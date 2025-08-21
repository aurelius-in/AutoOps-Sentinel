import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#0ea5e9' }, // sky-500
    secondary: { main: '#22c55e' }, // green-500
    background: {
      default: '#0b1020',
      paper: '#0f172a',
    },
    text: {
      primary: '#e5e7eb',
      secondary: '#94a3b8',
    },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: ['Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'].join(','),
    h6: { fontWeight: 700 },
  },
  components: {
    MuiPaper: {
      defaultProps: { elevation: 3 },
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))',
          border: '1px solid rgba(148, 163, 184, 0.1)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(90deg, #0ea5e9, #22c55e)',
        },
      },
    },
  },
});

export default theme;


