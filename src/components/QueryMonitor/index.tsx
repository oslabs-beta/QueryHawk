import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Container,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  Paper,
  TextField,
  Typography,
  Alert,
  Button,
} from '@mui/material';
import {
  Storage as DatabaseIcon,
  Search as SearchIcon,
  Timeline as TimelineIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import logo from '../assets/logo_queryhawk.jpg';
import { QueryMetrics } from './types';
import { MetricBar } from './MetricBar';
import GrafanaDashboard from './GrafanaDashboard';

//hardcoded
const QueryMonitor: React.FC = () => {
  const [queryMetrics] = useState<QueryMetrics>({
    executionTime: 100,
    planningTime: 100,
    rowsReturned: 100,
    memoryUsage: 100,
    cacheHitRatio: 100,
  });

  const [performanceData] = useState([
    { time: '10:00', qps: 40 },
    { time: '11:00', qps: 50 },
    { time: '12:00', qps: 60 },
    { time: '13:00', qps: 70 },
  ]);

  const navigate = useNavigate();

  const goTestQueryPage = () => {
    navigate('/test-query');
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 3 }}>
      <Container maxWidth='xl'>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton sx={{ p: 0 }}>
              <Box
                component='img'
                src={logo}
                alt='QueryHawk Logo'
                sx={{ width: 40, height: 40, objectFit: 'contain' }}
              />
            </IconButton>
            <Typography variant='h6' component='h6'>
              QueryHawk
            </Typography>
          </Box>
          <Button variant='contained' startIcon={<DatabaseIcon />} size='large'>
            Connect Database
          </Button>
          <Button
            variant='contained'
            startIcon={<DatabaseIcon />}
            size='large'
            onClick={goTestQueryPage} // Trigger navigation to the test query page
          >
            Test Query
          </Button>
        </Box>

        {/* Query Input
        <Paper sx={{ mb: 4, p: 0.5 }}>
          <TextField
            fullWidth
            placeholder='Enter your SQL query...'
            variant='outlined'
            InputProps={{
              endAdornment: (
                <InputAdornment position='end'>
                  <IconButton>
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Paper> */}

        {/* Metrics Grid */}
        <Grid container spacing={3}>
          {/* Database Health Metrics */}
          <Grid item xs={12}>
            <DatabaseHealthMetrics
              prometheusUrl={prometheusUrl}
              refreshInterval={30000} // refresh every 30 seconds
            />
          </Grid>
          <Grid container spacing={3}>
            {/* CPU Usage Dashboard Panel */}
            <Grid item xs={12} md={6}>
              {' '}
              {/* Changed from xs={12} to xs={12} md={6} */}
              <GrafanaDashboard
                dashboardUrl='http://localhost:3001/d-solo/000000039/postgresql-database'
                orgId='1'
                panelId='22'
                theme='dark'
                height='300px'
                refreshInterval={10}
                authToken={import.meta.env.VITE_GRAFANA_TOKEN}
                title='PostgreSQL CPU Usage'
              />
            </Grid>

            {/* Memory Usage Dashboard Panel */}
            <Grid item xs={12} md={6}>
              {' '}
              {/* Changed from xs={12} to xs={12} md={6} */}
              <GrafanaDashboard
                dashboardUrl='http://localhost:3001/d-solo/000000039/postgresql-database'
                orgId='1'
                panelId='24'
                theme='dark'
                height='300px'
                refreshInterval={10}
                authToken={import.meta.env.VITE_GRAFANA_TOKEN}
                title='PostgreSQL Memory Usage'
              />
            </Grid>
          </Grid>
          {/* Key Metrics */}
          {/* <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title={<Typography variant='h6'>Key Metrics</Typography>}
                avatar={<TimelineIcon color='primary' />}
              />
              <CardContent>
                <MetricBar
                  label='Execution Time'
                  value={queryMetrics.executionTime}
                  unit='ms'
                />
                <MetricBar
                  label='Planning Time'
                  value={queryMetrics.planningTime}
                  unit='ms'
                />
                <MetricBar
                  label='Rows Returned'
                  value={queryMetrics.rowsReturned}
                  unit=''
                />
                <MetricBar
                  label='Memory Usage'
                  value={queryMetrics.memoryUsage}
                  unit='MB'
                />
                <MetricBar
                  label='Cache Hit Ratio'
                  value={queryMetrics.cacheHitRatio}
                  unit='%'
                />
              </CardContent>
            </Card>
          </Grid> */}

          {/* Query Performance */}
          {/* <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title={<Typography variant='h6'>Query Performance</Typography>}
              />
              <CardContent>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer>
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis dataKey='time' />
                      <YAxis />
                      <Tooltip />
                      <Line type='monotone' dataKey='qps' stroke='#2196f3' />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid> */}

          {/* Alerts */}
          {/* <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title={<Typography variant='h6'>Critical Alerts</Typography>}
                avatar={<WarningIcon color='error' />}
              />
              <CardContent>
                <Alert severity='error' sx={{ mb: 2 }}>
                  High Memory Usage: DB1 - 92% used
                </Alert>
                <Alert severity='error'>
                  Slow Query: SELECT taking &gt; 10s
                </Alert>
              </CardContent>
            </Card>
          </Grid> */}

          {/* Active Connections */}
          {/* <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title={<Typography variant='h6'>Active Connections</Typography>}
              />
              <CardContent>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer>
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis dataKey='time' />
                      <YAxis />
                      <Tooltip />
                      <Line type='monotone' dataKey='qps' stroke='#4caf50' />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid> */}
        </Grid>
      </Container>
    </Box>
  );
};

export default QueryMonitor;
