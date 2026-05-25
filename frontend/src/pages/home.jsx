
import React, { useContext, useMemo, useState } from 'react';
import withAuth from '../utils/withAuth';
import { useNavigate } from 'react-router-dom';
import { Button, IconButton, TextField, Box, Typography, Paper, Stack, Snackbar, Chip } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import ShareIcon from '@mui/icons-material/Share';
import RefreshIcon from '@mui/icons-material/Refresh';
import MessageIcon from '@mui/icons-material/Message';
import { AuthContext } from '../contexts/AuthContext';

function createMeetingCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function formatMeetingTime(value) {
  if (!value) return "Not scheduled";
  return new Date(value).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function HomeComponent() {
  let navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");
  const [createdCode, setCreatedCode] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [duration, setDuration] = useState("30");
  const [toast, setToast] = useState("");
  const { addToUserHistory } = useContext(AuthContext);

  const createdMeetingLink = useMemo(() => {
    const safeCode = createdCode.trim().replace(/[^a-zA-Z0-9_-]/g, "");
    if (!safeCode) return "";
    const params = new URLSearchParams();
    if (meetingTime) params.set("at", new Date(meetingTime).toISOString());
    if (duration) params.set("dur", duration);
    const query = params.toString();
    return `${window.location.origin}/${safeCode}${query ? `?${query}` : ""}`;
  }, [createdCode, duration, meetingTime]);

  let handleJoinVideoCall = async () => {
    const safeCode = meetingCode.trim().replace(/[^a-zA-Z0-9_-]/g, "");
    if (!safeCode) return;
    await addToUserHistory(safeCode);
    navigate(`/${safeCode}`);
  };

  const handleCreateMeeting = () => {
    const nextCode = createMeetingCode();
    setCreatedCode(nextCode);
    setToast("Meeting link created");
  };

  const copyMeetingLink = async () => {
    if (!createdMeetingLink) return;
    try {
      await navigator.clipboard.writeText(createdMeetingLink);
      setToast("Meeting link copied");
    } catch {
      setToast("Could not copy link");
    }
  };

  const shareMeetingLink = async () => {
    if (!createdMeetingLink) return;
    if (!navigator.share) {
      await copyMeetingLink();
      return;
    }

    try {
      await navigator.share({
        title: "Join my LiveLink meeting",
        text: "Join my LiveLink video meeting",
        url: createdMeetingLink,
      });
    } catch {
      setToast("Share cancelled");
    }
  };

  const copyInviteMessage = async () => {
    if (!createdMeetingLink) return;
    const invite = `Join my LiveLink meeting\nCode: ${createdCode}\nTime: ${formatMeetingTime(meetingTime)}\nDuration: ${duration || 30} minutes\nLink: ${createdMeetingLink}`;
    try {
      await navigator.clipboard.writeText(invite);
      setToast("Invite message copied");
    } catch {
      setToast("Could not copy invite");
    }
  };

  const startCreatedMeeting = async () => {
    if (!createdCode) return;
    await addToUserHistory(createdCode);
    navigate(`/${createdCode}${createdMeetingLink.includes("?") ? `?${createdMeetingLink.split("?")[1]}` : ""}`);
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      width: '100vw',
      background: 'linear-gradient(120deg, #FF9839 0%, #22223B 100%)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.5rem 2.5rem',
        background: 'rgba(34,34,59,0.15)',
        backdropFilter: 'blur(4px)',
      }}>
        <Typography variant="h4" fontWeight={700} letterSpacing={1}>LiveLink</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate("/history")} sx={{ color: '#fff' }}>
            <RestoreIcon />
          </IconButton>
          <Typography>History</Typography>
          <Button onClick={() => {
            localStorage.removeItem("token");
            navigate("/auth");
          }} sx={{ color: '#fff', border: '1px solid #fff', borderRadius: 2, ml: 2 }}>
            Logout
          </Button>
        </Box>
      </Box>
      <Box sx={{
        flex: 1,
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: 'center',
        justifyContent: 'center',
        gap: { xs: 4, md: 10 },
        px: { xs: 2, md: 8 },
        py: { xs: 4, md: 0 },
      }}>
        <Paper elevation={8} sx={{
          background: 'rgba(255,255,255,0.90)',
          borderRadius: 2,
          p: { xs: 3, md: 5 },
          minWidth: 300,
          maxWidth: 520,
          mb: { xs: 4, md: 0 },
        }}>
          <Typography variant="h5" fontWeight={700} color="#22223B" mb={1}>
            Start or Join Meeting
          </Typography>
          <Typography color="#22223B" mb={3}>
            Create a meeting link, send it to anyone, and they can join the same call.
          </Typography>

          <Stack spacing={2.5}>
            <Button
              onClick={handleCreateMeeting}
              variant="contained"
              size="large"
              startIcon={<VideoCallIcon />}
              sx={{
                background: 'linear-gradient(90deg, #FF9839 60%, #22223B 100%)',
                color: 'white',
                borderRadius: 1.5,
                fontWeight: 700,
                py: 1.2,
              }}
            >
              Create Meeting Link
            </Button>

            <Paper
              elevation={0}
              sx={{
                display: 'grid',
                gap: 1.5,
                p: 2,
                borderRadius: 2,
                background: 'linear-gradient(135deg, rgba(34,34,59,0.94), rgba(255,152,57,0.18))',
                border: '1px solid rgba(34,34,59,0.16)',
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                <Box>
                  <Typography color="white" fontWeight={800}>Your meeting invite</Typography>
                  <Typography color="rgba(255,255,255,0.72)" fontSize="0.88rem">
                    Har click par fresh code bana sakti ho.
                  </Typography>
                </Box>
                <Chip label={createdCode ? "Ready" : "Draft"} color={createdCode ? "success" : "default"} size="small" />
              </Stack>
              <TextField
                label="Meeting Code"
                value={createdCode}
                onChange={(e) => setCreatedCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))}
                placeholder="Type code or click Create"
                size="small"
                sx={{ background: '#fff', borderRadius: 1.5 }}
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <TextField
                  label="Meeting Time"
                  type="datetime-local"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  sx={{ flex: 1, background: '#fff', borderRadius: 1.5 }}
                />
                <TextField
                  label="Duration"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  inputProps={{ min: 5, max: 240, step: 5 }}
                  helperText="minutes"
                  size="small"
                  sx={{ width: { xs: '100%', sm: 135 }, background: '#fff', borderRadius: 1.5 }}
                />
              </Stack>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1.5,
                  background: 'rgba(255,255,255,0.10)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                <Typography color="rgba(255,255,255,0.68)" fontSize="0.78rem" mb={0.5}>
                  Meeting Link
                </Typography>
                <Typography color="white" fontWeight={800} sx={{ wordBreak: 'break-all' }}>
                  {createdMeetingLink || "Meeting link yahan dikhega"}
                </Typography>
                <Typography color="rgba(255,255,255,0.72)" fontSize="0.86rem" mt={1}>
                  {meetingTime ? `${formatMeetingTime(meetingTime)} · ${duration || 30} minutes` : "Timing add karna ho to upar choose karo."}
                </Typography>
              </Box>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button
                  onClick={handleCreateMeeting}
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  sx={{ borderRadius: 1.5, fontWeight: 700, color: 'white', borderColor: 'rgba(255,255,255,0.45)' }}
                >
                  New Code
                </Button>
                <Button
                  onClick={copyMeetingLink}
                  variant="outlined"
                  startIcon={<ContentCopyIcon />}
                  disabled={!createdMeetingLink}
                  sx={{ borderRadius: 1.5, fontWeight: 700, color: 'white', borderColor: 'rgba(255,255,255,0.45)' }}
                >
                  Copy Link
                </Button>
                <Button
                  onClick={copyInviteMessage}
                  variant="outlined"
                  startIcon={<MessageIcon />}
                  disabled={!createdMeetingLink}
                  sx={{ borderRadius: 1.5, fontWeight: 700, color: 'white', borderColor: 'rgba(255,255,255,0.45)' }}
                >
                  Copy Invite
                </Button>
                <Button
                  onClick={shareMeetingLink}
                  variant="outlined"
                  startIcon={<ShareIcon />}
                  disabled={!createdMeetingLink}
                  sx={{ borderRadius: 1.5, fontWeight: 700, color: 'white', borderColor: 'rgba(255,255,255,0.45)' }}
                >
                  Share
                </Button>
                <Button
                  onClick={startCreatedMeeting}
                  variant="contained"
                  disabled={!createdMeetingLink}
                  sx={{
                    background: '#22223B',
                    borderRadius: 1.5,
                    fontWeight: 700,
                  }}
                >
                  Start Meeting
                </Button>
              </Stack>
            </Paper>

            <Box sx={{ height: 1, background: 'rgba(34,34,59,0.14)' }} />

            <Typography color="#22223B" fontWeight={700}>
              Join with code
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              value={meetingCode}
              onChange={e => setMeetingCode(e.target.value)}
              id="outlined-basic"
              label="Meeting Code"
              variant="outlined"
              size="medium"
              sx={{ flex: 1, background: '#fff', borderRadius: 2 }}
            />
            <Button
              onClick={handleJoinVideoCall}
              variant='contained'
              size='large'
              sx={{
                background: 'linear-gradient(90deg, #FF9839 60%, #22223B 100%)',
                color: 'white',
                borderRadius: 2,
                fontWeight: 700,
                px: 3,
                boxShadow: '0 2px 8px 0 rgba(31,38,135,0.10)'
              }}
            >
              Join
            </Button>
            </Box>
          </Stack>
        </Paper>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img srcSet='/logo3.png' alt="" style={{ width: '30vw', maxWidth: 350, borderRadius: 20, boxShadow: '0 4px 24px 0 rgba(31,38,135,0.10)' }} />
        </Box>
      </Box>
      <Snackbar
        open={!!toast}
        autoHideDuration={2200}
        message={toast}
        onClose={() => setToast("")}
      />
    </Box>
  );
}

export default withAuth(HomeComponent);
