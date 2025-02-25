import React, { useState, useCallback } from 'react';
import { 
  Box, Paper, CardContent, CircularProgress, Alert
} from '@mui/material';

// Props interface for the GrafanaDashboard component
interface GrafanaPanelProps {
  panelId: string; // ID of the Grafana panel we want to display
  title: string; // Title to show above the panel
}

/**
 * A React component that embeds a Grafana dashboard or panel using an iframe.
 * Supports authentication, auto-refresh, fullscreen mode, and theme customization.
 */
const GrafanaDashboard: React.FC<GrafanaPanelProps> = ({ panelId, title }) => {
  // State management
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Construct the URL for the Grafana dashboard
  const constructUrl = useCallback(() => {
    try {
      // Base URL from our Docker setup
      const baseUrl = new URL('http://localhost:3001'); 
      // Set the path for the specific dashboard
      baseUrl.pathname = `/d-solo/postgresql-overview/postgresql-overview`;// Ensure the URL is valid
      // All the query parameters we need
      const params = {
        orgId: '1',
        from: 'now-6h',
        to: 'now',
        theme: 'dark',
        refresh: '5s',
        panelId,
        'auth.anonymous': 'true',
        kiosk: 'true',
        'var-database': 'postgres',
    };
    // Add all params to the URL
    Object.entries(params).forEach(([key, value]) => {
      baseUrl.searchParams.set(key, value);
    });
    return baseUrl.toString();
  } catch (err) {
    setError('Invalid dashboard URL');
    return '';
  }
  }, [panelId]);

  // Component render
  return (
    <Paper elevation={2} sx={{ bgcolor: '#181b1f'}}>
      {/* Main content area */}
      <CardContent>
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', 
            alignItems: 'center', position: 'absolute',
            inset: 0, bgcolor: 'rgba(255, 255, 255, 1)', zIndex: 2
          }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error message */}
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {/* Panel container */}
        <Box sx={{ position: 'relative', height: '300px'}}>
          {/* Grafana iframe */}
          <iframe
            id={`panel-${panelId}`}
            src={constructUrl()}
            style={{
              border: 'none',
              width: '100%',
              height: '100%'
            }}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setError('Failed to load Grafana dashboard');
              setIsLoading(false);
            }}
            title={`Grafana Panel - ${title}`}
          />
        </Box>
      </CardContent>
    </Paper>
  );
};

export default GrafanaDashboard;