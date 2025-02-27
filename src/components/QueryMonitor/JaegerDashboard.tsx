import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';

// Environment variable from docker-compose
const JAEGER_URL = import.meta.env.VITE_JAEGER_URL || 'http://localhost:16686';

interface JaegerDashboardProps {
  title: string;
  serviceName?: string;
}

const JaegerDashboard: React.FC<JaegerDashboardProps> = ({
  title,
  serviceName = 'sql-optimizer',
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Iframe URL that points to Jaeger UI with specific service pre-selected
  const iframeUrl = `${JAEGER_URL}/search?service=${serviceName}`;

  const handleIframeLoad = () => {
    setLoading(false);
  };

  const handleIframeError = () => {
    setLoading(false);
    setError(
      'Failed to load Jaeger traces. Please make sure Jaeger is running.'
    );
  };

  return (
    <Card sx={{ height: '400px', borderRadius: 2, overflow: 'hidden', mb: 3 }}>
      <CardContent sx={{ p: 2, height: '100%' }}>
        <Box
          sx={{
            mb: 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant='h6' fontWeight='500'>
            {title}
          </Typography>
        </Box>

        {loading && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '90%',
            }}
          >
            <CircularProgress size={40} />
          </Box>
        )}

        {error && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '90%',
            }}
          >
            <Typography color='error'>{error}</Typography>
          </Box>
        )}

        <Box
          sx={{
            height: 'calc(100% - 40px)',
            display: loading ? 'none' : 'block',
          }}
        >
          <iframe
            title={`Jaeger Dashboard - ${title}`}
            src={iframeUrl}
            width='100%'
            height='100%'
            frameBorder='0'
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            style={{ borderRadius: 4 }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default JaegerDashboard;
