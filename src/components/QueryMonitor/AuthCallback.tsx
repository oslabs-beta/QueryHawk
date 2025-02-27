import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  CircularProgress,
  CssBaseline,
  createTheme,
  ThemeProvider,
} from '@mui/material';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';

// Create the dark theme matching the one from QueryMonitor
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#a594fd',
    },
    secondary: {
      main: '#ff4081',
    },
    background: {
      // default: '#000000',
      // paper: '#181b1f',
    },
  },
});

const AuthCallback: React.FC = () => {
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        // console.log("📟 Received GitHub code:", code);
        // console.log(
        //   "🕰️ Received GitHub code:",
        //   code,
        //   "at:",
        //   new Date().toISOString()
        // );

        if (!code) {
          throw new Error('No authorization code received from GitHub');
        }

        // Make request to your backend
        const response = await fetch(
          'http://localhost:4002/api/auth/github/callback',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code, provider: 'github' }),
            credentials: 'include',
          }
        );

        if (!response.ok) {
          const errorData = await response.text();
          console.error('Server error:', errorData);
          throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        // console.log('Auth success, received token');

        if (data.token) {
          localStorage.setItem('authToken', data.token);
          if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
          }
          navigate('/', { replace: true });
        } else {
          throw new Error('No authentication token received');
        }
      } catch (err) {
        console.error('Authentication error:', err);
        setError(err instanceof Error ? err.message : 'Failed to authenticate');
        setIsLoading(false);
      }
    };

    handleCallback();
  }, [navigate, location]);

  if (error) {
    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            bgcolor: 'background.default',
          }}
        >
          <Container maxWidth='sm'>
            <Paper
              elevation={6}
              sx={{
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                bgcolor: 'background.paper',
                borderRadius: 2,
              }}
            >
              <Alert severity='error' sx={{ width: '100%', mb: 3 }}>
                <AlertTitle>Authentication Failed</AlertTitle>
                {error}
              </Alert>

              <Button
                fullWidth
                variant='contained'
                onClick={() => navigate('/auth')}
                sx={{
                  mt: 2,
                  bgcolor: 'primary.main',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  textTransform: 'none',
                  height: (theme) => theme.spacing(7),
                  borderRadius: 1.5,
                }}
              >
                Return to Login
              </Button>
            </Paper>
          </Container>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <Paper
          elevation={6}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <CircularProgress size={40} color='primary' />
          <Typography variant='h6' color='primary'>
            Authenticating with GitHub...
          </Typography>
        </Paper>
      </Box>
    </ThemeProvider>
  );
};

export default AuthCallback;
