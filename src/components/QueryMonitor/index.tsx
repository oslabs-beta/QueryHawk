import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  IconButton,
  Typography,
  Button,
} from '@mui/material';
import {
  Storage as DatabaseIcon
} from '@mui/icons-material';
import logo from '../assets/logo_queryhawk.jpg';
import GrafanaDashboard from './GrafanaDashboard';
import DatabaseHealthMetrics from './DatabaseHealthMetrics';


const QueryMonitor: React.FC = () => {
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
        </Grid>
      </Container>
    </Box>
  );
};

export default QueryMonitor;
