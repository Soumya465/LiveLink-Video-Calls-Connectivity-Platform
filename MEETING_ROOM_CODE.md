# Meeting Room Code

This repository copy includes extra meeting-room code for:

- Host room creation.
- Room link joining.
- Joined member list.
- Host member removal.
- Multi-user WebRTC video/audio.
- Screen sharing.

## Added files

- `backend/src/controllers/meetingRooms.js`
- `frontend/src/utils/meetingRoom.js`
- `frontend/src/hooks/useMeetingRoom.js`
- `frontend/src/components/MeetingRoom.jsx`

## Backend registration

`backend/src/controllers/socketManager.js` imports and registers `registerMeetingRooms(io)`.

## Host usage

```jsx
import { createRoomId } from "./utils/meetingRoom";
import MeetingRoom from "./components/MeetingRoom";

const roomId = createRoomId();

<MeetingRoom roomId={roomId} userName="Host Name" isHost={true} />;
```

## Join usage

```jsx
import { getRoomIdFromUrl } from "./utils/meetingRoom";
import MeetingRoom from "./components/MeetingRoom";

const roomId = getRoomIdFromUrl();

<MeetingRoom roomId={roomId} userName="Guest Name" isHost={false} />;
```
