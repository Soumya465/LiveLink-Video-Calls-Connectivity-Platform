
import * as React from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Snackbar, Button, TextField, Box, Typography, Paper, useMediaQuery, CircularProgress } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

const GlassCard = styled(Paper)(({ theme }) => ({
  background: 'rgba(10, 15, 30, 0.55)',
  borderRadius: 24,
  boxShadow: '0 8px 32px 0 rgba(31,38,135,0.15)',
  padding: theme.spacing(3, 2),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%',
  maxWidth: 400,
  margin: 'auto',
  [theme.breakpoints.down('sm')]: {
    maxWidth: '95vw',
    padding: theme.spacing(2, 1),
  },
}));

export default function Authentication() {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [formState, setFormState] = React.useState(0); // 0: login, 1: register
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { handleRegister, handleLogin } = React.useContext(AuthContext);

  const handleAuth = async () => {
    setLoading(true);
    setError("");
    try {
      if (formState === 0) {
        await handleLogin(username, password);
      }
      if (formState === 1) {
        let result = await handleRegister(name, username, password);
        setUsername("");
        setMessage(result);
        setOpen(true);
        setError("");
        setFormState(0);
        setPassword("");
      }
    } catch (err) {
      let message = err?.response?.data?.message || "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        background: `radial-gradient(1200px 800px at 15% 20%, rgba(255,152,57,0.25), transparent 60%),
                     radial-gradient(900px 700px at 85% 30%, rgba(108,99,255,0.22), transparent 55%),
                     linear-gradient(120deg, #0b1020 0%, #0a0f1e 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        p: { xs: 2, md: 4 },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `url(/logo3.png) no-repeat right bottom/contain`,
          opacity: 0.06,
          zIndex: 0,
        }}
      />

      <GlassCard elevation={10} sx={{ zIndex: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              background: 'linear-gradient(135deg, rgba(255,152,57,1) 0%, rgba(108,99,255,1) 100%)',
              borderRadius: '50%',
              width: 64,
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 1,
              boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
            }}
          >
            <LockOutlinedIcon sx={{ color: '#0b1020', fontSize: 34 }} />
          </Box>
          <Typography variant={isMobile ? "h5" : "h4"} fontWeight={800} gutterBottom>
            {formState === 0 ? 'Welcome back' : 'Create your account'}
          </Typography>
          <Typography sx={{ opacity: 0.8, textAlign: "center" }}>
            {formState === 0 ? 'Sign in to start meetings and chat with AI.' : 'Join LiveLink in seconds.'}
          </Typography>
        </Box>

        <Box component="form" noValidate sx={{ width: '100%' }}>
          {formState === 1 && (
            <TextField
              margin="normal"
              required
              id="name"
              label="Full Name"
              name="name"
              value={name}
              autoFocus
              onChange={(e) => setName(e.target.value)}
              sx={{ mb: 1.5 }}
            />
          )}

          <TextField
            margin="normal"
            required
            id="username"
            label="Username"
            name="username"
            value={username}
            autoFocus={formState === 0}
            onChange={(e) => setUsername(e.target.value)}
            sx={{ mb: 1.5 }}
          />

          <TextField
            margin="normal"
            required
            name="password"
            label="Password"
            value={password}
            type="password"
            onChange={(e) => setPassword(e.target.value)}
            id="password"
            sx={{ mb: 1.5 }}
          />

          {error && <Typography color="error" sx={{ mb: 1 }}>{error}</Typography>}

          <Button
            type="button"
            fullWidth
            variant="contained"
            size="large"
            sx={{
              mt: 0.5,
              mb: 2,
              borderRadius: 2,
              fontWeight: 800,
              fontSize: '1.05rem',
              letterSpacing: 0.2,
              background: "linear-gradient(90deg, rgba(255,152,57,1) 0%, rgba(108,99,255,1) 100%)",
              color: "#0b1020",
            }}
            onClick={handleAuth}
            disabled={loading}
            endIcon={loading && <CircularProgress size={20} color="inherit" />}
          >
            {formState === 0 ? "Login" : "Register"}
          </Button>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
            <Button
              variant={formState === 0 ? 'outlined' : 'text'}
              color="inherit"
              onClick={() => setFormState(0)}
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              Sign In
            </Button>
            <Button
              variant={formState === 1 ? 'outlined' : 'text'}
              color="inherit"
              onClick={() => setFormState(1)}
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              Sign Up
            </Button>
          </Box>
        </Box>
      </GlassCard>

      <Snackbar
        open={open}
        autoHideDuration={4000}
        message={message}
        onClose={() => setOpen(false)}
      />
    </Box>
  );
}