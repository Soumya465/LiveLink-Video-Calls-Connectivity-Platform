import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, Box, CardActions, CardContent, Button, Typography, Stack } from '@mui/material';

export default function History() {
  const { getHistoryOfUser } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);
  const routeTo = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getHistoryOfUser();
        setMeetings(history);
      } catch {
        // IMPLEMENT SNACKBAR
      }
    };
    fetchHistory();
  }, [getHistoryOfUser]);

  let formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      width: '100vw',
      background: `radial-gradient(1200px 800px at 15% 20%, rgba(255,152,57,0.20), transparent 60%),
                   radial-gradient(900px 700px at 85% 30%, rgba(108,99,255,0.16), transparent 55%),
                   linear-gradient(120deg, #0b1020 0%, #0a0f1e 100%)`,
      color: 'white',
      p: { xs: 2, md: 4 },
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 3,
      maxWidth: 860,
      mx: 'auto',
    }}>
      <Stack direction="row" sx={{ width: "100%", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="h4" fontWeight={900}>History</Typography>
        <Button variant="outlined" color="inherit" onClick={() => routeTo("/home")}>
          Back
        </Button>
      </Stack>
      {meetings.length !== 0 ? meetings.map((e, i) => (
        <Card key={i} sx={{ width: '100%', borderRadius: 3, background: 'rgba(10, 15, 30, 0.55)' }}>
          <CardContent>
            <Typography variant="h6" fontWeight={800}>
              Meeting Code: {e.meetingCode || e.meeting_code}
            </Typography>
            <Typography sx={{ opacity: 0.8, fontSize: { xs: '1rem', md: '1.05rem' } }}>
              Date: {formatDate(e.date || e.createdAt)}
            </Typography>
          </CardContent>
          <CardActions>
            <Button
              size="small"
              variant="contained"
              onClick={() => routeTo(`/${e.meetingCode || e.meeting_code}`)}
              sx={{
                background: "linear-gradient(90deg, rgba(255,152,57,1) 0%, rgba(108,99,255,1) 100%)",
                color: "#0b1020",
                fontWeight: 900
              }}
            >
              Rejoin
            </Button>
          </CardActions>
        </Card>
      )) : (
        <Typography variant="h6" color="#fff" mt={4}>
          No meeting history found.
        </Typography>
      )}
    </Box>
  );
}

// ...existing code...
