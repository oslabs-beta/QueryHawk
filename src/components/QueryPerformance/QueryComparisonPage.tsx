import React from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Paper,
} from '@mui/material';
import { SavedQuery } from './QueryHistory';
import MetricsTable from './MetricsTable';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';

interface QueryComparisonViewProps {
  firstQuery: SavedQuery | null;
  secondQuery: SavedQuery | null;
  onExitCompare: () => void;
}

const QueryComparisonView: React.FC<QueryComparisonViewProps> = ({
  firstQuery,
  secondQuery,
  onExitCompare,
}) => {
  if (!firstQuery || !secondQuery) return null;

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant='h5' color='white'>
          Query Comparison
        </Typography>
        <Button
          // onClick={onOpenCompare}
          variant='contained'
          startIcon={<CompareArrowsIcon />}
        >
          Compare Queries
        </Button>
        <Button variant='outlined' onClick={onExitCompare}>
          Exit Comparison
        </Button>
      </Box>

      <Grid container spacing={2}>
        {/* First Query */}
        <Grid item xs={6}>
          <Card sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
            <CardContent>
              <Typography variant='h6' color='white' gutterBottom>
                {firstQuery.queryName}
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                {firstQuery.queryText}
              </Typography>
              <MetricsTable metrics={firstQuery.metrics} />
            </CardContent>
          </Card>
        </Grid>

        {/* Second Query */}
        <Grid item xs={6}>
          <Card sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
            <CardContent>
              <Typography variant='h6' color='white' gutterBottom>
                {secondQuery.queryName}
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                {secondQuery.queryText}
              </Typography>
              <MetricsTable metrics={secondQuery.metrics} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance Difference Summary */}
      <Card sx={{ bgcolor: 'background.paper', borderRadius: 2, mt: 3 }}>
        <CardContent>
          <Typography variant='h6' color='white' gutterBottom>
            Performance Comparison
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Paper sx={{ p: 2, bgcolor: 'rgba(24, 27, 31, 0.8)' }}>
                <Typography variant='subtitle1' color='white'>
                  Execution Time
                </Typography>
                <Typography variant='h6' color='white'>
                  {Math.abs(
                    ((firstQuery.metrics.executionTime -
                      secondQuery.metrics.executionTime) /
                      firstQuery.metrics.executionTime) *
                      100
                  ).toFixed(2)}
                  %
                  {firstQuery.metrics.executionTime >
                  secondQuery.metrics.executionTime
                    ? ' faster'
                    : ' slower'}
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={4}>
              <Paper sx={{ p: 2, bgcolor: 'rgba(24, 27, 31, 0.8)' }}>
                <Typography variant='subtitle1' color='white'>
                  Planning Time
                </Typography>
                <Typography variant='h6' color='white'>
                  {Math.abs(
                    ((firstQuery.metrics.planningTime -
                      secondQuery.metrics.planningTime) /
                      firstQuery.metrics.planningTime) *
                      100
                  ).toFixed(2)}
                  %
                  {firstQuery.metrics.planningTime >
                  secondQuery.metrics.planningTime
                    ? ' faster'
                    : ' slower'}
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={4}>
              <Paper sx={{ p: 2, bgcolor: 'rgba(24, 27, 31, 0.8)' }}>
                <Typography variant='subtitle1' color='white'>
                  Total Cost
                </Typography>
                <Typography variant='h6' color='white'>
                  {Math.abs(
                    ((firstQuery.metrics.totalCost -
                      secondQuery.metrics.totalCost) /
                      firstQuery.metrics.totalCost) *
                      100
                  ).toFixed(2)}
                  %
                  {firstQuery.metrics.totalCost > secondQuery.metrics.totalCost
                    ? ' lower'
                    : ' higher'}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default QueryComparisonView;
