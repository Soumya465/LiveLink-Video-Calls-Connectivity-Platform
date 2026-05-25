const MAX_ROOM_ID_LEN = 64;

const rooms = new Map();

function normalizeRoomId(raw) {
  return String(raw || "")
    .trim()
    .slice(0, MAX_ROOM_ID_LEN)
    .replace(/[^a-zA-Z0-9_-]/g, "");
}

function getMembers(roomId) {
  const room = rooms.get(roomId);
  if (!room) return [];

  return Array.from(room.members.entries()).map(([socketId, member]) => ({
    socketId,
    userName: member.userName,
    isHost: socketId === room.hostId,
  }));
}

function emitMembers(io, roomId) {
  io.to(roomId).emit("room-members", getMembers(roomId));
}

export function registerMeetingRooms(io) {
  io.on("connection", (socket) => {
    socket.on("create-room", ({ roomId, userName }) => {
      const safeRoomId = normalizeRoomId(roomId);
      if (!safeRoomId) {
        socket.emit("room-error", { message: "Invalid room id" });
        return;
      }

      rooms.set(safeRoomId, {
        hostId: socket.id,
        members: new Map(),
      });

      socket.data.meetingRoomId = safeRoomId;
      socket.data.meetingUserName =
        userName || socket.data.identity?.name || socket.data.identity?.username || "Host";

      rooms.get(safeRoomId).members.set(socket.id, {
        userName: socket.data.meetingUserName,
      });

      socket.join(safeRoomId);

      socket.emit("room-created", {
        roomId: safeRoomId,
        hostId: socket.id,
        roomLink: `/room/${safeRoomId}`,
      });

      emitMembers(io, safeRoomId);
    });

    socket.on("join-room", ({ roomId, userName }) => {
      const safeRoomId = normalizeRoomId(roomId);

      if (!safeRoomId || !rooms.has(safeRoomId)) {
        socket.emit("room-error", { message: "Room not found" });
        return;
      }

      const room = rooms.get(safeRoomId);
      const existingUsers = getMembers(safeRoomId);

      socket.data.meetingRoomId = safeRoomId;
      socket.data.meetingUserName =
        userName || socket.data.identity?.name || socket.data.identity?.username || "Guest";

      room.members.set(socket.id, {
        userName: socket.data.meetingUserName,
      });

      socket.join(safeRoomId);

      socket.emit("room-users", existingUsers);

      socket.to(safeRoomId).emit("user-joined", {
        socketId: socket.id,
        userName: socket.data.meetingUserName,
      });

      emitMembers(io, safeRoomId);
    });

    socket.on("remove-member", ({ roomId, socketId }) => {
      const safeRoomId = normalizeRoomId(roomId);
      const room = rooms.get(safeRoomId);
      if (!room) return;

      if (room.hostId !== socket.id) {
        socket.emit("room-error", {
          message: "Only host can remove members",
        });
        return;
      }

      if (socketId === room.hostId) {
        socket.emit("room-error", {
          message: "Host cannot remove himself",
        });
        return;
      }

      const targetSocket = io.sockets.sockets.get(socketId);
      if (!targetSocket) return;

      room.members.delete(socketId);

      targetSocket.leave(safeRoomId);
      targetSocket.emit("removed-from-room", {
        roomId: safeRoomId,
        message: "Host removed you from the room",
      });

      socket.to(safeRoomId).emit("user-left", { socketId });

      emitMembers(io, safeRoomId);
    });

    socket.on("webrtc-offer", ({ to, offer }) => {
      io.to(to).emit("webrtc-offer", {
        from: socket.id,
        offer,
      });
    });

    socket.on("webrtc-answer", ({ to, answer }) => {
      io.to(to).emit("webrtc-answer", {
        from: socket.id,
        answer,
      });
    });

    socket.on("webrtc-ice-candidate", ({ to, candidate }) => {
      io.to(to).emit("webrtc-ice-candidate", {
        from: socket.id,
        candidate,
      });
    });

    socket.on("disconnect", () => {
      const roomId = socket.data.meetingRoomId;
      if (!roomId || !rooms.has(roomId)) return;

      const room = rooms.get(roomId);
      room.members.delete(socket.id);

      socket.to(roomId).emit("user-left", {
        socketId: socket.id,
      });

      if (socket.id === room.hostId || room.members.size === 0) {
        socket.to(roomId).emit("room-closed", {
          message: "Host ended the room",
        });

        rooms.delete(roomId);
        return;
      }

      emitMembers(io, roomId);
    });
  });
}
