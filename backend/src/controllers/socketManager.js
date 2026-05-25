import { Server } from "socket.io";
import { User } from "../models/user.model.js";
import { registerMeetingRooms } from "./meetingRooms.js";

const MAX_ROOM_ID_LEN = 64;
const MAX_ROOM_SIZE = 16;
const MAX_MESSAGES_PER_ROOM = 200;

const roomConnections = new Map(); // roomId -> Set(socketId)
const roomMessages = new Map(); // roomId -> Array<{sender,data,socketIdSender}>
const socketToRoom = new Map(); // socketId -> roomId
const roomHosts = new Map(); // roomId -> host socketId
const pendingJoins = new Map(); // roomId -> Map(socketId, { name, username, kind })

function normalizeRoomId(raw) {
  const roomId = String(raw || "")
    .trim()
    .slice(0, MAX_ROOM_ID_LEN)
    .replace(/[^a-zA-Z0-9_-]/g, "");
  return roomId;
}

function getDisplayIdentity(socket) {
  const identity = socket.data.identity || {};
  return {
    socketId: socket.id,
    name: identity.name || identity.username || "Guest",
    username: identity.username || identity.name || "Guest",
    kind: identity.kind || "guest",
  };
}

function replayRoomMessages(io, socketId, roomId) {
  const history = roomMessages.get(roomId) || [];
  for (const m of history) {
    io.to(socketId).emit("chat-message", m.data, m.sender, m.socketIdSender);
  }
}

function approveSocketIntoRoom(io, socket, roomId) {
  const currentSet = roomConnections.get(roomId) || new Set();

  socket.join(roomId);
  socketToRoom.set(socket.id, roomId);
  currentSet.add(socket.id);
  roomConnections.set(roomId, currentSet);

  const pending = pendingJoins.get(roomId);
  if (pending) {
    pending.delete(socket.id);
    if (pending.size === 0) pendingJoins.delete(roomId);
  }

  const clients = Array.from(currentSet);
  socket.emit("join-approved", { roomId, isHost: roomHosts.get(roomId) === socket.id });
  io.to(roomId).emit("user-joined", socket.id, clients, socket.data.identity);
  replayRoomMessages(io, socket.id, roomId);
}

async function resolveSocketIdentity(socket) {
  const token =
    socket.handshake?.auth?.token ||
    socket.handshake?.headers?.authorization?.toString()?.replace(/^bearer\s+/i, "");

  if (token) {
    const user = await User.findOne({ token }).lean();
    if (user) return { kind: "user", name: user.name, username: user.username };
  }

  const guestName = String(socket.handshake?.auth?.guestName || "").trim().slice(0, 32);
  if (guestName) return { kind: "guest", name: guestName, username: guestName };

  return null;
}

export const connectToSocket = (server) => {
  const corsOrigin = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : "*";

  const io = new Server(server, {
    cors: {
      origin: corsOrigin,
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    pingInterval: 20000,
    pingTimeout: 20000,
  });

  io.use(async (socket, next) => {
    try {
      const identity = await resolveSocketIdentity(socket);
      if (!identity) {
        return next(new Error("unauthorized"));
      }
      socket.data.identity = identity;
      return next();
    } catch (e) {
      return next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("join-call", (rawRoomId) => {
      const roomId = normalizeRoomId(rawRoomId);
      if (!roomId) {
        socket.emit("join-error", "Invalid meeting code");
        return;
      }

      const currentSet = roomConnections.get(roomId) || new Set();
      if (currentSet.size >= MAX_ROOM_SIZE) {
        socket.emit("join-error", "Room is full");
        return;
      }

      if (currentSet.size === 0 || !roomHosts.has(roomId)) {
        roomHosts.set(roomId, socket.id);
        socket.emit("host-status", { isHost: true });
        approveSocketIntoRoom(io, socket, roomId);
        return;
      }

      const pending = pendingJoins.get(roomId) || new Map();
      pending.set(socket.id, getDisplayIdentity(socket));
      pendingJoins.set(roomId, pending);

      socket.emit("waiting-for-approval", {
        roomId,
        message: "Waiting for host approval",
      });

      const hostId = roomHosts.get(roomId);
      if (hostId) {
        io.to(hostId).emit("join-request", getDisplayIdentity(socket));
      }
    });

    socket.on("approve-join", ({ roomId: rawRoomId, socketId }) => {
      const roomId = normalizeRoomId(rawRoomId);
      if (roomHosts.get(roomId) !== socket.id) {
        socket.emit("join-error", "Only host can approve guests");
        return;
      }

      const pending = pendingJoins.get(roomId);
      if (!pending?.has(socketId)) return;

      const targetSocket = io.sockets.sockets.get(socketId);
      if (!targetSocket) {
        pending.delete(socketId);
        return;
      }

      approveSocketIntoRoom(io, targetSocket, roomId);
      socket.emit("join-request-resolved", { socketId });
    });

    socket.on("reject-join", ({ roomId: rawRoomId, socketId }) => {
      const roomId = normalizeRoomId(rawRoomId);
      if (roomHosts.get(roomId) !== socket.id) {
        socket.emit("join-error", "Only host can reject guests");
        return;
      }

      const pending = pendingJoins.get(roomId);
      if (!pending?.has(socketId)) return;

      pending.delete(socketId);
      if (pending.size === 0) pendingJoins.delete(roomId);

      io.to(socketId).emit("join-rejected", {
        message: "Host rejected your request",
      });
      socket.emit("join-request-resolved", { socketId });
    });

    socket.on("signal", (toId, message) => {
      io.to(toId).emit("signal", socket.id, message);
    });

    socket.on("chat-message", (data, sender) => {
      const roomId = socketToRoom.get(socket.id);
      if (!roomId) return;

      const safeData = String(data || "").slice(0, 2000);
      const safeSender =
        (socket.data.identity?.kind === "user" ? socket.data.identity.username : socket.data.identity?.name) ||
        String(sender || "").slice(0, 32);

      const list = roomMessages.get(roomId) || [];
      list.push({ sender: safeSender, data: safeData, socketIdSender: socket.id });
      if (list.length > MAX_MESSAGES_PER_ROOM) list.shift();
      roomMessages.set(roomId, list);

      io.to(roomId).emit("chat-message", safeData, safeSender, socket.id);
    });

    socket.on("meeting-reaction", (reaction) => {
      const roomId = socketToRoom.get(socket.id);
      if (!roomId) return;

      const safeReaction = String(reaction || "").trim().slice(0, 24);
      if (!safeReaction) return;

      const sender =
        (socket.data.identity?.kind === "user" ? socket.data.identity.username : socket.data.identity?.name) ||
        "Guest";

      io.to(roomId).emit("meeting-reaction", {
        reaction: safeReaction,
        sender,
        socketId: socket.id,
      });
    });

    socket.on("disconnect", () => {
      const roomId = socketToRoom.get(socket.id);
      socketToRoom.delete(socket.id);
      if (!roomId) {
        for (const [pendingRoomId, pending] of pendingJoins.entries()) {
          if (!pending.has(socket.id)) continue;
          pending.delete(socket.id);
          const hostId = roomHosts.get(pendingRoomId);
          if (hostId) io.to(hostId).emit("join-request-resolved", { socketId: socket.id });
          if (pending.size === 0) pendingJoins.delete(pendingRoomId);
          break;
        }
        return;
      }

      const set = roomConnections.get(roomId);
      if (set) {
        set.delete(socket.id);
        io.to(roomId).emit("user-left", socket.id);
        if (set.size === 0) {
          roomConnections.delete(roomId);
          roomMessages.delete(roomId);
          roomHosts.delete(roomId);
          pendingJoins.delete(roomId);
        } else {
          if (roomHosts.get(roomId) === socket.id) {
            const nextHost = Array.from(set)[0];
            roomHosts.set(roomId, nextHost);
            io.to(nextHost).emit("host-status", { isHost: true });
          }
          roomConnections.set(roomId, set);
        }
      }
    });
  });

  registerMeetingRooms(io);

  return io;
};

