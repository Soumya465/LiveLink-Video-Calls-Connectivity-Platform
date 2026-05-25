import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppBar, Box, Button, Container, Toolbar, Typography, Stack, Paper } from "@mui/material";

export default function LandingPage() {
  const router = useNavigate();
  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        background: `radial-gradient(1200px 800px at 10% 15%, rgba(255,152,57,0.25), transparent 60%),
                     radial-gradient(900px 700px at 90% 25%, rgba(108,99,255,0.20), transparent 55%),
                     linear-gradient(120deg, #0b1020 0%, #0a0f1e 100%)`,
        color: "white",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <AppBar position="sticky" elevation={0} sx={{ background: "rgba(10,15,30,0.45)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <Toolbar>
          <Container maxWidth="lg" sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: { xs: 0, sm: 2 } }}>
            <Typography variant="h5" fontWeight={900} letterSpacing={0.4}>
              LiveLink
            </Typography>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => router(`/${Math.random().toString(36).slice(2, 8)}`)}
              >
                Join as guest
              </Button>
              <Button variant="text" color="inherit" onClick={() => router("/auth")}>
                Register
              </Button>
              <Button
                variant="contained"
                onClick={() => router("/auth")}
                sx={{
                  background: "linear-gradient(90deg, rgba(255,152,57,1) 0%, rgba(108,99,255,1) 100%)",
                  color: "#0b1020",
                }}
              >
                Login
              </Button>
            </Stack>
          </Container>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ flex: 1, display: "grid", alignItems: "center", py: { xs: 5, md: 10 }, gap: { xs: 4, md: 6 }, gridTemplateColumns: { xs: "1fr", md: "1.15fr 0.85fr" } }}>
        <Box>
          <Typography variant="h3" sx={{ lineHeight: 1.08 }}>
            Connect. Meet. <Box component="span" sx={{ color: "primary.main" }}>Feel closer</Box>.
          </Typography>
          <Typography sx={{ opacity: 0.85, mt: 2, fontSize: { xs: "1.05rem", md: "1.2rem" } }}>
            High-quality video calls, real-time chat, and a private Gemini AI assistant built for smooth meetings.
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 4, alignItems: { xs: "stretch", sm: "center" } }}>
            <Button
              component={Link}
              to="/auth"
              size="large"
              variant="contained"
              sx={{
                background: "linear-gradient(90deg, rgba(255,152,57,1) 0%, rgba(108,99,255,1) 100%)",
                color: "#0b1020",
                py: 1.2,
              }}
            >
              Get started
            </Button>
            <Button
              size="large"
              variant="outlined"
              color="inherit"
              onClick={() => router("/auth")}
              sx={{ py: 1.2 }}
            >
              Create account
            </Button>
          </Stack>
        </Box>

        <Paper sx={{ p: 2, borderRadius: 4, overflow: "hidden" }}>
          <Box
            component="video"
            src="https://shorturl.at/ZpNzc"
            autoPlay
            muted
            loop
            playsInline
            sx={{ width: "100%", height: { xs: 260, md: 380 }, objectFit: "cover", borderRadius: 3 }}
          />
        </Paper>
      </Container>

      <Box component="footer" sx={{ textAlign: "center", py: 3, opacity: 0.7 }}>
        &copy; {new Date().getFullYear()} LiveLink. All rights reserved.
      </Box>
    </Box>
  );
}
