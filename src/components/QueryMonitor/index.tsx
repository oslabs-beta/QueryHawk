import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  IconButton,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  CircularProgress,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import Logo from '../assets/logo_queryhawk';
import GrafanaDashboard from './GrafanaDashboard';

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
      default: '#000000',
      paper: '#181b1f',
    },
  },
});

const buttonStyles = {
  height: (theme) => theme.spacing(7),
  textTransform: 'none',
  px: 4,
  borderRadius: 1.5,
  whiteSpace: 'nowrap',
};

const QueryMonitor: React.FC = () => {
  const navigate = useNavigate();
  const goTestQueryPage = () => {
    navigate('/test-query');
  };
  const [isConnected, setIsConnected] = useState(false);
  const [dbUrl, setDbUrl] = useState('');
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [exporterInfo, setExporterInfo] = useState<{
    containerId: string;
    port: number;
    name: string;
  } | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  // Get the authenticated user ID from localStorage
  useEffect(() => {
    // Get auth token
    const token = localStorage.getItem('authToken');
    if (token) {
      setAuthToken(token);
    }
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user && user.id) {
          setUserId(user.id);
        }
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError('');
    setSuccessMessage('');

    if (!userId) {
      setError('You need to be logged in to connect to a database');
      setIsConnecting(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:4002/api/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          databaseUrl: dbUrl,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to connect to database');
      }

      const connectionData = await response.json();

      const exporterResponse = await fetch(
        'http://localhost:4002/api/monitoring/start',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            // userId: userId.toString(),
            uri_string: dbUrl,
          }),
        }
      );
      if (!exporterResponse.ok) {
        // If exporter setup fails, we still have internal monitoring, so just log a warning
        console.warn(
          'Exporter setup failed, but database monitoring is still active'
        );
      } else {
        const exporterData = await exporterResponse.json();
        setExporterInfo(exporterData);
      }

      // Add a small delay to allow metrics to be collected
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setIsConnected(true);
      setSuccessMessage('Connected successfully! Monitoring started.');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred'
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!userId) {
      setError('User ID not found. Please log in again.');
      return;
    }

    if (!authToken) {
      setError('Authentication token not found. Please log in again.');
      return;
    }

    try {
      // Stop the Docker-based exporter if it was started
      if (exporterInfo) {
        const exporterResponse = await fetch(
          'http://localhost:4002/api/monitoring/stop',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({}), // No need to send userId, it comes from the auth token
          }
        );

        if (!exporterResponse.ok) {
          console.warn(
            'Failed to stop exporter, but continuing with disconnect'
          );
        }
      }

      // We don't have a dedicated endpoint to stop the internal monitoring,
      // but we can simulate a disconnect by setting our state
      setIsConnected(false);
      setExporterInfo(null);
      setSuccessMessage('Database disconnected and monitoring stopped.');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred'
      );
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
        {/* Header */}
        <Box
          sx={{
            py: 2, // Padding top and bottom: 16px (2 * 8px)
            px: 2, // Padding left and right: 16px (2 * 8px)
          }}
        >
          <Container maxWidth='xl'>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between', // Puts space between logo and button
                alignItems: 'center',
              }}
            >
              {/* Logo and Title */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton sx={{ p: 0, color: 'white' }}>
                  {' '}
                  {/* Logo */}
                  <Logo />
                </IconButton>
                <Typography variant='h6' fontWeight='500' color='white'>
                  QueryHawk
                </Typography>
              </Box>

              {/* Test Query Button */}
              <Button
                onClick={() => navigate('/test-query')}
                sx={{
                  ...buttonStyles,
                  color: '#fff',
                  '&:hover': {
                    color: 'primary.main',
                    bgcolor: 'transparent',
                  },
                }}
              >
                Test Query
              </Button>
            </Box>
          </Container>
        </Box>

        {/* Main Content */}
        <Container maxWidth='xl' sx={{ mt: 4 }}>
          {/* Database Connection Section - Always visible */}
          <Box sx={{ mb: 4 }}>
            <Card sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label='Database URI'
                    // placeholder="postgresql://user:pass@localhost:5432/dbname"
                    variant='outlined'
                    fullWidth
                    value={dbUrl}
                    onChange={(e) => setDbUrl(e.target.value)}
                  />
                  <Button
                    variant='contained'
                    onClick={handleConnect}
                    disabled={isConnecting || !dbUrl}
                    sx={buttonStyles}
                  >
                    {isConnecting ? (
                      <CircularProgress size={24} color='inherit' />
                    ) : (
                      'Connect Database'
                    )}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {exporterInfo && (
            <Box sx={{ mt: 2 }}>
              <Typography variant='subtitle2' color='primary.light'>
                Exporter running on port {exporterInfo.port} (Container:{' '}
                {exporterInfo.name})
              </Typography>
            </Box>
          )}

          {/* Dashboard Content */}
          {isConnected && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <GrafanaDashboard panelId="1" title="Transaction Rate" />
              </Grid>
              <Grid item xs={12} md={6}>
                <GrafanaDashboard panelId="2" title="Cache Hit Ratio" />
              </Grid>
              <Grid item xs={12} md={6}>
                <GrafanaDashboard panelId="3" title="Active Connections" />
              </Grid>
              {/* <Grid item xs={12} md={6}>
                <GrafanaDashboard panelId="4" title="Query Execution Time" />
              </Grid> */}
              <Grid item xs={12} md={6}>
                <GrafanaDashboard panelId="5" title="Tuple Operations" />
              </Grid>
              <Grid item xs={12} md={6}>
                <GrafanaDashboard panelId="6" title="Lock Metrics" />
              </Grid>
              <Grid item xs={12} md={6}>
                <GrafanaDashboard panelId="7" title="I/O Statistics" />
              </Grid>
              <Grid item xs={12} md={6}>
                <GrafanaDashboard panelId="8" title="Index Usage" />
              </Grid>
              <Grid item xs={12} md={6}>
                <GrafanaDashboard
                  panelId="9"
                  title="Transaction Commits vs Rollbacks"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <GrafanaDashboard panelId="10" title="Long-Running Queries" />
              </Grid>
            </Grid>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default QueryMonitor;
