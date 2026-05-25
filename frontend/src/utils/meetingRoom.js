export function createRoomId() {
  return (
    crypto.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

export function createMeetingRoomLink(roomId) {
  return `${window.location.origin}/room/${roomId}`;
}

export function getRoomIdFromUrl() {
  return window.location.pathname.split("/room/")[1]?.split("/")[0] || "";
}
