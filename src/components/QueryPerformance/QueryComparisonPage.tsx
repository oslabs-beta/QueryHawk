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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { SavedQuery } from './QueryHistoryDialog';
import MetricsTable from './MetricsTable';

interface QueryComparisonPageProps {
  firstQuery: SavedQuery | null;
  secondQuery: SavedQuery | null;
  onExitCompare: () => void;
}
const COLORS = {
  before: '#EF4444',
  after: '#10B981',
};

const QueryComparisonPage: React.FC<QueryComparisonPageProps> = ({
  firstQuery,
  secondQuery,
  onExitCompare,
}) => {
  if (!firstQuery || !secondQuery) return null;

  const comparisonChartData = [
    {
      metric: 'Exec Time (ms)',
      Before: firstQuery.metrics.executionTime,
      After: secondQuery.metrics.executionTime,
    },
    {
      metric: 'Total Cost',
      Before: firstQuery.metrics.totalCost,
      After: secondQuery.metrics.totalCost,
    },
    {
      metric: 'Buffer Reads',
      Before: firstQuery.metrics.sharedReadBlocks ?? 0,
      After: secondQuery.metrics.sharedReadBlocks ?? 0,
    },
    {
      metric: 'Cache Hit (%)',
      Before: firstQuery.metrics.cacheHitRatio ?? 0,
      After: secondQuery.metrics.cacheHitRatio ?? 0,
    },
  ];

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
          variant='outlined'
          onClick={onExitCompare}
          sx={{
            textTransform: 'none',
          }}
        >
          Exit Comparison
        </Button>
      </Box>
      <Grid container spacing={2} alignItems='stretch'>
        {/* First Query */}
        <Grid item xs={6} sx={{ display: 'flex' }}>
          <Card
            sx={{ bgcolor: 'background.paper', borderRadius: 2, width: '100%' }}
          >
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
        <Grid item xs={6} sx={{ display: 'flex' }}>
          <Card
            sx={{ bgcolor: 'background.paper', borderRadius: 2, width: '100%' }}
          >
            <CardContent>
              <Typography variant='h6' color='white' gutterBottom>
                {secondQuery.queryName}
              </Typography>
              <Typography
                variant='body2'
                color='text.secondary'
                sx={{
                  mb: 2,
                }}
              >
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
                <Typography
                  variant='h6'
                  sx={{
                    color:
                      firstQuery.metrics.executionTime >
                      secondQuery.metrics.executionTime
                        ? '#10b981'
                        : '#EF4444',
                  }}
                >
                  {Math.abs(
                    ((parseFloat(firstQuery.metrics.executionTime.toFixed(2)) -
                      parseFloat(
                        secondQuery.metrics.executionTime.toFixed(2),
                      )) /
                      parseFloat(firstQuery.metrics.executionTime.toFixed(2))) *
                      100,
                  ).toFixed(2)}
                  %
                  {firstQuery.metrics.executionTime >
                  secondQuery.metrics.executionTime
                    ? ` faster`
                    : ` slower`}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  {firstQuery.metrics.executionTime >
                  secondQuery.metrics.executionTime
                    ? `${secondQuery.queryName} is recommended`
                    : `${firstQuery.queryName} is recommended`}
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={4}>
              <Paper sx={{ p: 2, bgcolor: 'rgba(24, 27, 31, 0.8)' }}>
                <Typography variant='subtitle1' color='white'>
                  Planning Time
                </Typography>
                <Typography
                  variant='h6'
                  sx={{
                    color:
                      firstQuery.metrics.planningTime >
                      secondQuery.metrics.planningTime
                        ? '#10b981'
                        : '#EF4444',
                  }}
                >
                  {Math.abs(
                    ((parseFloat(firstQuery.metrics.planningTime.toFixed(2)) -
                      parseFloat(secondQuery.metrics.planningTime.toFixed(2))) /
                      parseFloat(firstQuery.metrics.planningTime.toFixed(2))) *
                      100,
                  ).toFixed(2)}
                  %
                  {firstQuery.metrics.planningTime >
                  secondQuery.metrics.planningTime
                    ? ' faster'
                    : ' slower'}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  {firstQuery.metrics.planningTime >
                  secondQuery.metrics.planningTime
                    ? `${secondQuery.queryName} is recommended`
                    : `${firstQuery.queryName} is recommended`}
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={4}>
              <Paper sx={{ p: 2, bgcolor: 'rgba(24, 27, 31, 0.8)' }}>
                <Typography variant='subtitle1' color='white'>
                  Total Cost
                </Typography>
                <Typography
                  variant='h6'
                  sx={{
                    color:
                      firstQuery.metrics.totalCost >
                      secondQuery.metrics.totalCost
                        ? '#10B981'
                        : '#EF4444',
                  }}
                >
                  {Math.abs(
                    ((parseFloat(firstQuery.metrics.totalCost.toFixed(2)) -
                      parseFloat(secondQuery.metrics.totalCost.toFixed(2))) /
                      parseFloat(firstQuery.metrics.totalCost.toFixed(2))) *
                      100,
                  ).toFixed(2)}
                  %
                  {firstQuery.metrics.totalCost > secondQuery.metrics.totalCost
                    ? ' lower'
                    : ' higher'}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  {firstQuery.metrics.totalCost > secondQuery.metrics.totalCost
                    ? `${secondQuery.queryName} is recommended`
                    : `${firstQuery.queryName} is recommended`}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      {/* Bar chart */}
      <Card sx={{ bgcolor: 'background.paper', borderRadius: 2, mt: 3 }}>
        <CardContent>
          <Typography variant='h6' color='white' gutterBottom>
            Performance Chart
          </Typography>
          <ResponsiveContainer width='100%' height={300}>
            <BarChart
              data={comparisonChartData}
              margin={{ top: 8, right: 24, left: 0, bottom: 8 }}
            >
              <CartesianGrid
                strokeDasharray='3 3'
                stroke='rgba(255,255,255,0.08)'
              />
              <XAxis
                dataKey='metric'
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.15)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.15)' }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  color: '#F9FAFB',
                  fontSize: 13,
                }}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />
              <Legend
                wrapperStyle={{ color: '#9CA3AF', fontSize: 13, paddingTop: 8 }}
              />
              <Bar
                dataKey='Before'
                fill={COLORS.before}
                radius={[4, 4, 0, 0]}
              />
              <Bar dataKey='After' fill={COLORS.after} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default QueryComparisonPage;
