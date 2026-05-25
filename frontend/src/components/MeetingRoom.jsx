import { useEffect, useRef } from "react";
import { useMeetingRoom } from "../hooks/useMeetingRoom";

function VideoTile({ stream, muted }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);

  return <video ref={videoRef} autoPlay playsInline muted={muted} />;
}

export default function MeetingRoom({ roomId, userName, isHost }) {
  const {
    localStream,
    remoteStreams,
    members,
    roomLink,
    roomError,
    isScreenSharing,
    startScreenShare,
    stopScreenShare,
    removeMember,
  } = useMeetingRoom({ roomId, userName, isHost });

  return (
    <div>
      {roomError && <p>{roomError}</p>}

      {isHost && (
        <div>
          <p>Room Link: {roomLink}</p>
          <button onClick={() => navigator.clipboard.writeText(roomLink)}>
            Copy Room Link
          </button>
        </div>
      )}

      <button onClick={isScreenSharing ? stopScreenShare : startScreenShare}>
        {isScreenSharing ? "Stop Screen Share" : "Share Screen"}
      </button>

      <div>
        <h3>Joined Members</h3>

        {members.map((member) => (
          <div key={member.socketId}>
            <span>
              {member.userName} {member.isHost ? "(Host)" : ""}
            </span>

            {isHost && !member.isHost && (
              <button onClick={() => removeMember(member.socketId)}>
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      <div>
        {localStream && <VideoTile stream={localStream} muted />}

        {remoteStreams.map(({ socketId, stream }) => (
          <VideoTile key={socketId} stream={stream} />
        ))}
      </div>
    </div>
  );
}
