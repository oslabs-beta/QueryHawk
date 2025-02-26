import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  CircularProgress, 
  Alert, 
  Button, 
  Divider,
  TextField,
  Card,
  CardContent
} from '@mui/material';

/**
 * Component to debug Prometheus metrics and Grafana connection
 */
const PrometheusDebugger: React.FC = () => {
  const [metrics, setMetrics] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [grafanaUrl, setGrafanaUrl] = useState<string>('http://localhost:3001');
  const [prometheusUrl, setPrometheusUrl] = useState<string>('http://localhost:4002/api/metrics');
  const [promDatasourceStatus, setPromDatasourceStatus] = useState<'unknown' | 'success' | 'error'>('unknown');

  // Function to fetch metrics
  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(prometheusUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const text = await response.text();
      setMetrics(text);
      
      // Check if key metrics exist
      const requiredMetrics = [
        'pg_stat_database_xact_commit',
        'pg_stat_database_blks_hit'
      ];
      
      const foundMetrics = requiredMetrics.filter(metric => text.includes(metric));
      
      if (foundMetrics.length === 0) {
        setError('Warning: No PostgreSQL metrics found in the response');
      } else if (foundMetrics.length < requiredMetrics.length) {
        setError(`Warning: Only found ${foundMetrics.length}/${requiredMetrics.length} required metrics`);
      }
    } catch (err) {
      setError(`Failed to fetch metrics: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to check Grafana datasource
  const checkGrafanaDatasource = async () => {
    try {
      const healthResponse = await fetch(`${grafanaUrl}/api/health`);
      if (!healthResponse.ok) {
        setPromDatasourceStatus('error');
        return;
      }
      
      // This is simplified - in a real app you would need proper auth
      // and would check the actual datasource configuration
      setPromDatasourceStatus('success');
    } catch (err) {
      setPromDatasourceStatus('error');
    }
  };

  // Fetch metrics on component mount
  useEffect(() => {
    fetchMetrics();
    checkGrafanaDatasource();
    
    // Set up interval to refresh metrics every 15 seconds
    const interval = setInterval(fetchMetrics, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box sx={{ my: 3 }}>
      <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
        <Typography variant="h5" gutterBottom>
          Prometheus Metrics Debugger
        </Typography>
        
        <Box sx={{ my: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Metrics Source Configuration
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField 
              label="Prometheus Metrics URL" 
              value={prometheusUrl}
              onChange={(e) => setPrometheusUrl(e.target.value)}
              fullWidth
              size="small"
            />
            <Button 
              variant="contained" 
              onClick={fetchMetrics}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Refresh'}
            </Button>
          </Box>
          
          <TextField 
            label="Grafana URL" 
            value={grafanaUrl}
            onChange={(e) => setGrafanaUrl(e.target.value)}
            fullWidth
            size="small"
            sx={{ mb: 2 }}
          />
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button 
              variant="outlined" 
              onClick={checkGrafanaDatasource}
            >
              Check Grafana Datasource
            </Button>
            
            <Button 
              variant="outlined" 
              onClick={() => {
                window.open(`${grafanaUrl}/datasources`, '_blank');
              }}
            >
              Open Grafana Datasources
            </Button>
          </Box>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Status Cards */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Prometheus Status
              </Typography>
              <Typography color={error ? 'error.main' : 'success.main'}>
                {error ? 'Error' : 'Connected'}
              </Typography>
            </CardContent>
          </Card>
          
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Grafana Datasource
              </Typography>
              <Typography 
                color={
                  promDatasourceStatus === 'success' 
                    ? 'success.main' 
                    : promDatasourceStatus === 'error' 
                      ? 'error.main' 
                      : 'text.secondary'
                }
              >
                {promDatasourceStatus === 'success' 
                  ? 'Connected' 
                  : promDatasourceStatus === 'error' 
                    ? 'Error' 
                    : 'Unknown'}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        
        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {/* Metrics Display */}
        <Typography variant="subtitle1" gutterBottom>
          Available Metrics
        </Typography>
        
        <Paper 
          elevation={0} 
          variant="outlined" 
          sx={{ 
            p: 2, 
            maxHeight: '400px', 
            overflow: 'auto',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : metrics ? (
            metrics
          ) : (
            'No metrics data available'
          )}
        </Paper>
        
        {/* Troubleshooting Tips */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Troubleshooting Tips
          </Typography>
          <ul>
            <li>Check that the metrics endpoint is accessible from Grafana</li>
            <li>Verify that Prometheus is properly configured as a data source in Grafana</li>
            <li>Ensure metric names match exactly what Grafana queries are expecting</li>
            <li>Check Grafana's query inspector for detailed error information</li>
            <li>Verify that your PostgreSQL connection is active and metrics are being collected</li>
          </ul>
        </Box>
      </Paper>
    </Box>
  );
};

export default PrometheusDebugger;