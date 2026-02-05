import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Alert,
} from '@mui/material';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface QueryAnalysis {
  executionTime: number;
  planningTime: number;
  totalCost: number;
  bufferHits: number;
  bufferReads: number;
  cacheHitRatio: number;
}

interface QueryInsights {
  isSlowQuery: boolean;
  isBadCache: boolean;
  isExpensive: boolean;
  recommendations: string[];
}

interface QueryAnalysisProps {
  analysis?: QueryAnalysis;
  insights?: QueryInsights;
  comparisonData?: {
    before: any;
    after: any;
    improvements?: {
      executionTime: string;
      cacheHitRatio: string;
      totalCost: string;
    };
  };
  mode?: 'single' | 'comparison';
  traceId?: string;
}

const COLORS = {
  good: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  cache: '#3B82F6',
  disk: '#F59E0B',
  neutral: '#6B7280',
};

const QuickInsight: React.FC<{
  icon: string;
  title: string;
  value: string;
  isGood: boolean;
  insight: string;
}> = ({ icon, title, value, isGood, insight }) => (
  <Card
    sx={{
      bgcolor: 'background.paper',
      border: `2px solid ${isGood ? COLORS.good : COLORS.danger}`,
      borderRadius: 2,
    }}
  >
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography variant='h4'>{icon}</Typography>
        <Typography variant='h6' color='text.primary'>
          {title}
        </Typography>
      </Box>
      <Typography
        variant='h4'
        sx={{
          color: isGood ? COLORS.good : COLORS.danger,
          fontWeight: 'bold',
          mb: 1,
        }}
      >
        {value}
      </Typography>
      <Typography variant='body2' color='text.secondary'>
        {insight}
      </Typography>
    </CardContent>
  </Card>
);

export const LeanQueryAnalyzer: React.FC<QueryAnalysisProps> = ({
  analysis,
  insights,
  comparisonData,
  mode = 'single',
  traceId,
}) => {
  if (!analysis && !comparisonData) return null;

  if (mode === 'single' && analysis && insights) {
    const cacheData = [
      { name: 'Cache Hits', value: analysis.bufferHits, fill: COLORS.cache },
      { name: 'Disk Reads', value: analysis.bufferReads, fill: COLORS.disk },
    ];

    return (
      <Box sx={{ space: 6, mt: 3 }}>
        {/* Health Check Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <QuickInsight
              icon='⚡'
              title='Speed'
              value={`${analysis.executionTime.toFixed(0)}ms`}
              isGood={!insights.isSlowQuery}
              insight={
                insights.isSlowQuery
                  ? 'Slow - needs optimization'
                  : 'Good performance'
              }
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <QuickInsight
              icon='💾'
              title='Cache Efficiency'
              value={`${analysis.cacheHitRatio}%`}
              isGood={!insights.isBadCache}
              insight={
                insights.isBadCache
                  ? 'Poor cache usage'
                  : 'Good cache efficiency'
              }
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <QuickInsight
              icon='💰'
              title='Query Cost'
              value={analysis.totalCost.toFixed(0)}
              isGood={!insights.isExpensive}
              insight={
                insights.isExpensive ? 'Expensive query' : 'Efficient query'
              }
            />
          </Grid>
        </Grid>

        {/* Cache Analysis */}
        <Card sx={{ bgcolor: 'background.paper', borderRadius: 2, mb: 4 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant='h6' color='text.primary' gutterBottom>
              Buffer Cache Analysis
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <ResponsiveContainer width='100%' height={250}>
                  <PieChart>
                    <Pie
                      data={cacheData}
                      cx='50%'
                      cy='50%'
                      innerRadius={60}
                      outerRadius={100}
                      dataKey='value'
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(1)}%`
                      }
                    >
                      {cacheData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant='h6' color='text.primary' gutterBottom>
                    Performance Insights:
                  </Typography>
                  <Box sx={{ space: 2 }}>
                    {insights.recommendations.map((rec, i) => (
                      <Alert
                        key={i}
                        severity={
                          rec.includes('good') || rec.includes('looks good')
                            ? 'success'
                            : 'warning'
                        }
                        sx={{ mb: 1 }}
                      >
                        {rec}
                      </Alert>
                    ))}
                  </Box>
                </Box>
              </Grid>
            </Grid>
                      </CardContent>
          </Card>

          {/* Trace Information */}
          {traceId && (
            <Card sx={{ bgcolor: 'background.paper', borderRadius: 2, mb: 4 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant='h6' color='text.primary' gutterBottom>
                  🔍 Trace Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, bgcolor: 'rgba(24, 27, 31, 0.8)' }}>
                      <Typography variant='subtitle2' color='text.secondary'>
                        Trace ID
                      </Typography>
                      <Typography variant='body2' color='text.primary' sx={{ fontFamily: 'monospace' }}>
                        {traceId}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, bgcolor: 'rgba(24, 27, 31, 0.8)' }}>
                      <Typography variant='subtitle2' color='text.secondary'>
                        View in Grafana
                      </Typography>
                      <Typography variant='body2' color='primary.main' sx={{ cursor: 'pointer' }}
                        onClick={() => window.open(`http://localhost:3001/explore?left=%7B%22queries%22%3A%5B%7B%22refId%22%3A%22A%22%2C%22expr%22%3A%22%7Btrace_id%3D%5C%22${traceId}%5C%22%7D%22%7D%5D%7D`, '_blank')}
                      >
                        🔗 Open Trace
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Detailed Metrics */}
        <Card sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant='h6' color='text.primary' gutterBottom>
              Detailed Metrics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, bgcolor: 'rgba(24, 27, 31, 0.8)' }}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Planning Time
                  </Typography>
                  <Typography variant='h6' color='text.primary'>
                    {analysis.planningTime.toFixed(2)}ms
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, bgcolor: 'rgba(24, 27, 31, 0.8)' }}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Buffer Hits
                  </Typography>
                  <Typography variant='h6' color='text.primary'>
                    {analysis.bufferHits.toLocaleString()}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, bgcolor: 'rgba(24, 27, 31, 0.8)' }}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Buffer Reads
                  </Typography>
                  <Typography variant='h6' color='text.primary'>
                    {analysis.bufferReads.toLocaleString()}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, bgcolor: 'rgba(24, 27, 31, 0.8)' }}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Cache Hit Ratio
                  </Typography>
                  <Typography variant='h6' color='text.primary'>
                    {analysis.cacheHitRatio}%
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (mode === 'comparison' && comparisonData) {
    const comparisonChartData = [
      {
        metric: 'Execution Time (ms)',
        before: comparisonData.before?.executionTime || 0,
        after: comparisonData.after?.executionTime || 0,
      },
      {
        metric: 'Total Cost',
        before: comparisonData.before?.totalCost || 0,
        after: comparisonData.after?.totalCost || 0,
      },
      {
        metric: 'Buffer Reads',
        before: comparisonData.before?.bufferReads || 0,
        after: comparisonData.after?.bufferReads || 0,
      },
      {
        metric: 'Cache Hit Ratio (%)',
        before: comparisonData.before?.cacheHitRatio || 0,
        after: comparisonData.after?.cacheHitRatio || 0,
      },
    ];

    return (
      <Box sx={{ space: 6, mt: 3 }}>
        {/* Comparison Chart */}
        <Card sx={{ bgcolor: 'background.paper', borderRadius: 2, mb: 4 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant='h6' color='text.primary' gutterBottom>
              Performance Comparison
            </Typography>
            <ResponsiveContainer width='100%' height={300}>
              <BarChart data={comparisonChartData}>
                <XAxis dataKey='metric' />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey='before' fill={COLORS.danger} name='Before' />
                <Bar dataKey='after' fill={COLORS.good} name='After' />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Improvement Summary */}
        {comparisonData.improvements && (
          <Card sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant='h6' color='text.primary' gutterBottom>
                Performance Improvements
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Paper sx={{ p: 2, bgcolor: 'rgba(24, 27, 31, 0.8)' }}>
                    <Typography variant='subtitle2' color='text.secondary'>
                      Execution Time
                    </Typography>
                    <Typography variant='h6' color='text.primary'>
                      {comparisonData.improvements.executionTime}%
                      {parseFloat(comparisonData.improvements.executionTime) > 0
                        ? ' faster'
                        : ' slower'}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={4}>
                  <Paper sx={{ p: 2, bgcolor: 'rgba(24, 27, 31, 0.8)' }}>
                    <Typography variant='subtitle2' color='text.secondary'>
                      Cache Hit Ratio
                    </Typography>
                    <Typography variant='h6' color='text.primary'>
                      {comparisonData.improvements.cacheHitRatio}%
                      {parseFloat(comparisonData.improvements.cacheHitRatio) > 0
                        ? ' better'
                        : ' worse'}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={4}>
                  <Paper sx={{ p: 2, bgcolor: 'rgba(24, 27, 31, 0.8)' }}>
                    <Typography variant='subtitle2' color='text.secondary'>
                      Total Cost
                    </Typography>
                    <Typography variant='h6' color='text.primary'>
                      {comparisonData.improvements.totalCost}%
                      {parseFloat(comparisonData.improvements.totalCost) > 0
                        ? ' lower'
                        : ' higher'}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}
      </Box>
    );
  }

  return null;
};

export default LeanQueryAnalyzer;
