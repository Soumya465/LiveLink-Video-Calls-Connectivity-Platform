import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#ff9839" },
    secondary: { main: "#6c63ff" },
    background: {
      default: "#0b1020",
      paper: "rgba(255,255,255,0.06)",
    },
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: "Poppins, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    h3: { fontWeight: 800, letterSpacing: -0.5 },
    h4: { fontWeight: 800 },
    h5: { fontWeight: 750 },
    button: { textTransform: "none", fontWeight: 700 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.10)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 14 },
      },
    },
    MuiTextField: {
      defaultProps: { fullWidth: true },
    },
  },
});

