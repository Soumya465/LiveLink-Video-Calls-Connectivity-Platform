import { useCallback, useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import server from "../environment";
import { createMeetingRoomLink } from "../utils/meetingRoom";

const rtcConfig = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export function useMeetingRoom({ roomId, userName = "Guest", isHost = false }) {
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const peersRef = useRef(new Map());

  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [members, setMembers] = useState([]);
  const [roomLink, setRoomLink] = useState("");
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [roomError, setRoomError] = useState("");

  const replaceVideoTrack = useCallback((newTrack) => {
    peersRef.current.forEach((peer) => {
      const sender = peer
        .getSenders()
        .find((item) => item.track?.kind === "video");

      if (sender) sender.replaceTrack(newTrack);
    });
  }, []);

  const stopScreenShare = useCallback(async () => {
    const cameraStream =
      cameraStreamRef.current ||
      (await navigator.mediaDevices.getUserMedia({ video: true, audio: true }));

    cameraStreamRef.current = cameraStream;

    const cameraTrack = cameraStream.getVideoTracks()[0];
    const currentVideoTrack = localStreamRef.current?.getVideoTracks()[0];

    if (currentVideoTrack) {
      localStreamRef.current.removeTrack(currentVideoTrack);
      currentVideoTrack.stop();
    }

    localStreamRef.current.addTrack(cameraTrack);
    replaceVideoTrack(cameraTrack);
    setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
    setIsScreenSharing(false);
  }, [replaceVideoTrack]);

  const startScreenShare = useCallback(async () => {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    });

    const screenTrack = screenStream.getVideoTracks()[0];
    const oldVideoTrack = localStreamRef.current?.getVideoTracks()[0];

    if (oldVideoTrack) {
      localStreamRef.current.removeTrack(oldVideoTrack);
      oldVideoTrack.stop();
    }

    localStreamRef.current.addTrack(screenTrack);
    replaceVideoTrack(screenTrack);
    setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
    setIsScreenSharing(true);

    screenTrack.onended = async () => {
      await stopScreenShare();
    };
  }, [replaceVideoTrack, stopScreenShare]);

  const removePeer = useCallback((socketId) => {
    const peer = peersRef.current.get(socketId);
    if (peer) peer.close();

    peersRef.current.delete(socketId);
    setRemoteStreams((items) =>
      items.filter((item) => item.socketId !== socketId)
    );
  }, []);

  const createPeer = useCallback(
    (socketId) => {
      if (peersRef.current.has(socketId)) return peersRef.current.get(socketId);

      const peer = new RTCPeerConnection(rtcConfig);

      localStreamRef.current?.getTracks().forEach((track) => {
        peer.addTrack(track, localStreamRef.current);
      });

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.emit("webrtc-ice-candidate", {
            to: socketId,
            candidate: event.candidate,
          });
        }
      };

      peer.ontrack = (event) => {
        const [stream] = event.streams;

        setRemoteStreams((items) => {
          if (items.some((item) => item.socketId === socketId)) return items;
          return [...items, { socketId, stream }];
        });
      };

      peer.onconnectionstatechange = () => {
        if (["failed", "closed", "disconnected"].includes(peer.connectionState)) {
          removePeer(socketId);
        }
      };

      peersRef.current.set(socketId, peer);
      return peer;
    },
    [removePeer]
  );

  const callUser = useCallback(
    async (socketId) => {
      const peer = createPeer(socketId);
      const offer = await peer.createOffer();

      await peer.setLocalDescription(offer);

      socketRef.current.emit("webrtc-offer", {
        to: socketId,
        offer,
      });
    },
    [createPeer]
  );

  const removeMember = useCallback(
    (socketId) => {
      socketRef.current?.emit("remove-member", {
        roomId,
        socketId,
      });
    },
    [roomId]
  );

  useEffect(() => {
    if (!roomId) return undefined;

    let mounted = true;

    async function start() {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (!mounted) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      cameraStreamRef.current = stream;
      localStreamRef.current = stream;
      setLocalStream(stream);
      setRoomLink(createMeetingRoomLink(roomId));

      const token = localStorage.getItem("token");
      const socket = io.connect(server, {
        transports: ["websocket", "polling"],
        auth: {
          token: token || undefined,
          guestName: token ? undefined : userName,
        },
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        if (isHost) {
          socket.emit("create-room", { roomId, userName });
        } else {
          socket.emit("join-room", { roomId, userName });
        }
      });

      socket.on("room-created", ({ roomLink }) => {
        setRoomLink(`${window.location.origin}${roomLink}`);
      });

      socket.on("room-users", async (users) => {
        setMembers(users);

        for (const user of users) {
          await callUser(user.socketId);
        }
      });

      socket.on("room-members", (items) => {
        setMembers(items);
      });

      socket.on("user-joined", ({ socketId }) => {
        createPeer(socketId);
      });

      socket.on("user-left", ({ socketId }) => {
        removePeer(socketId);
      });

      socket.on("removed-from-room", ({ message }) => {
        setRoomError(message);
        window.location.href = "/";
      });

      socket.on("room-closed", ({ message }) => {
        setRoomError(message);
        window.location.href = "/";
      });

      socket.on("room-error", ({ message }) => {
        setRoomError(message);
      });

      socket.on("webrtc-offer", async ({ from, offer }) => {
        const peer = createPeer(from);

        await peer.setRemoteDescription(new RTCSessionDescription(offer));

        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);

        socket.emit("webrtc-answer", {
          to: from,
          answer,
        });
      });

      socket.on("webrtc-answer", async ({ from, answer }) => {
        const peer = peersRef.current.get(from);
        if (peer) {
          await peer.setRemoteDescription(new RTCSessionDescription(answer));
        }
      });

      socket.on("webrtc-ice-candidate", async ({ from, candidate }) => {
        const peer = peersRef.current.get(from);
        if (peer && candidate) {
          await peer.addIceCandidate(new RTCIceCandidate(candidate));
        }
      });
    }

    start();

    return () => {
      mounted = false;

      socketRef.current?.disconnect();
      socketRef.current = null;

      peersRef.current.forEach((peer) => peer.close());
      peersRef.current.clear();

      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());

      localStreamRef.current = null;
      cameraStreamRef.current = null;

      setLocalStream(null);
      setRemoteStreams([]);
      setMembers([]);
      setIsScreenSharing(false);
    };
  }, [roomId, userName, isHost, callUser, createPeer, removePeer]);

  return {
    localStream,
    remoteStreams,
    members,
    roomLink,
    roomError,
    isScreenSharing,
    startScreenShare,
    stopScreenShare,
    removeMember,
  };
}
