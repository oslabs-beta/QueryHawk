// src/TestQueryPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  ThemeProvider,
  createTheme,
  Alert,
} from '@mui/material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import HistoryIcon from '@mui/icons-material/History';
import CloseIcon from '@mui/icons-material/Close';
import Logo from './assets/logo_queryhawk';
import { useNavigate } from 'react-router-dom';

// Import the same dark theme configuration as index.tsx
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

// Reuse the same styles as index.tsx
const buttonStyles = {
  height: (theme) => theme.spacing(7),
  textTransform: 'none',
  px: 4,
  borderRadius: 1.5,
  whiteSpace: 'nowrap',
};

const inputStyles = {
  '& .MuiOutlinedInput-root': {
    height: '48px',
    borderRadius: 1.5,
  },
};

interface QueryMetrics {
  executionTime: number;
  planningTime: number;
  rowsReturned: number;
  actualLoops: number;
  sharedHitBlocks: number;
  sharedReadBlocks: number;
  workMem: number;
  cacheHitRatio: number;
  startupCost: number;
  totalCost: number;
}

// New interface for saved queries
interface SavedQuery {
  id: number;
  queryName: string;
  queryText: string;
  metrics: QueryMetrics;
  createdAt: string;
}

const TestQueryPage: React.FC = () => {
  const navigate = useNavigate();
  const [uri_string, setUri_string] = useState('');
  const [query, setQuery] = useState('');
  const [queryName, setQueryName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryMetrics, setQueryMetrics] = useState<QueryMetrics | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // State for saved queries and comparison
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [showQueryHistory, setShowQueryHistory] = useState(false);
  const [showComparisonDialog, setShowComparisonDialog] = useState(false);
  const [selectedQueries, setSelectedQueries] = useState<{
    first: number | null;
    second: number | null;
  }>({
    first: null,
    second: null,
  });
  const [compareMode, setCompareMode] = useState(false);
  const [firstQuery, setFirstQuery] = useState<SavedQuery | null>(null);
  const [secondQuery, setSecondQuery] = useState<SavedQuery | null>(null);

  // Create authentication check
  const checkAuthentication = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('You must be logged in to use this feature');
      setIsAuthenticated(false);
      return false;
    } else {
      setIsAuthenticated(true);
      return true;
    }
  };

  // Check if user is authenticated on component mount
  useEffect(() => {
    checkAuthentication();
    if (isAuthenticated) {
      fetchSavedQueries();
    }
  }, [isAuthenticated]);

  // Fetch saved queries from the backend
  const fetchSavedQueries = async () => {
    try {
      if (!checkAuthentication()) {
        return;
      }
      const token = localStorage.getItem('authToken');

      const response = await fetch('http://localhost:4002/api/saved-queries', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setError('Authentication required. Please log in to continue');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch saved queries');
      }

      const data = await response.json();
      setSavedQueries(data);
    } catch (err) {
      console.error('Error fetching saved queries:', err);
    }
  };

  // Function to handle the button click and fetch metrics
  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    setQueryMetrics(null);

    try {
      // Checks authentication
      if (!checkAuthentication()) {
        throw Error('Authentication required. Please log in to continue');
      }
      const token = localStorage.getItem('authToken');

      // When we fetch have to fetch our back end in the container.
      const response = await fetch('http://localhost:4002/api/query-metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          uri_string,
          query,
          queryName: queryName || `Query ${new Date().toLocaleString()}`,
        }),
      });

      if (response.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        throw Error('Authentication required. Please log in to continue');
      }

      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }

      const data: QueryMetrics = await response.json();
      setQueryMetrics(data);

      // Refresh the saved queries list after successful fetch
      await fetchSavedQueries();
    } catch (err) {
      setError('Error fetching metrics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle selecting queries for comparison
  const handleCompare = () => {
    if (selectedQueries.first !== null && selectedQueries.second !== null) {
      const first =
        savedQueries.find((q) => q.id === selectedQueries.first) || null;
      const second =
        savedQueries.find((q) => q.id === selectedQueries.second) || null;

      setFirstQuery(first);
      setSecondQuery(second);
      setCompareMode(true);
      setShowComparisonDialog(false);
    }
  };

  // Redirect to login if user is not authenticated
  const handleLogin = () => {
    navigate('/auth');
  };

  // Function to render the metrics table
  const renderMetricsTable = (metrics: QueryMetrics | null) => {
    if (!metrics) return null;

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Metric</TableCell>
              <TableCell align='right'>Value</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>Planning Time</TableCell>
              <TableCell align='right'>
                {metrics.planningTime.toFixed(2)} ms
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell>Execution Time</TableCell>
              <TableCell align='right'>
                {Math.floor(metrics.executionTime).toLocaleString()} ms
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell>Rows Returned</TableCell>
              <TableCell align='right'>
                {metrics.rowsReturned.toLocaleString()}
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell>Number of Loops</TableCell>
              <TableCell align='right'>{metrics.actualLoops}</TableCell>
            </TableRow>

            <TableRow>
              <TableCell>Shared Hit Blocks</TableCell>
              <TableCell align='right'>
                {metrics.sharedHitBlocks.toLocaleString()}
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell>Shared Read Blocks</TableCell>
              <TableCell align='right'>
                {metrics.sharedReadBlocks.toLocaleString()}
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell>Cache Hit Ratio</TableCell>
              <TableCell align='right'>{metrics.cacheHitRatio}%</TableCell>
            </TableRow>

            <TableRow>
              <TableCell>Startup Cost</TableCell>
              <TableCell align='right'>
                {Math.floor(metrics.startupCost).toLocaleString()}
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell>Total Cost</TableCell>
              <TableCell align='right'>
                {Math.floor(metrics.totalCost).toLocaleString()}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // Render query history dialog
  const renderQueryHistoryDialog = () => {
    return (
      <Dialog
        open={showQueryHistory}
        onClose={() => setShowQueryHistory(false)}
        fullWidth
        maxWidth='md'
      >
        <DialogTitle>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            Query History
            <IconButton onClick={() => setShowQueryHistory(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {savedQueries.length === 0 ? (
            <DialogContentText>
              You don't have any saved queries yet. Run a query and save it to
              see it here.
            </DialogContentText>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Query</TableCell>
                    <TableCell>Execution Time</TableCell>
                    <TableCell>Rows</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {savedQueries.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.queryName}</TableCell>
                      <TableCell>
                        {item.queryText.length > 30
                          ? `${item.queryText.substring(0, 30)}...`
                          : item.queryText}
                      </TableCell>
                      <TableCell>
                        {Math.floor(
                          item.metrics.executionTime
                        ).toLocaleString()}{' '}
                        ms
                      </TableCell>
                      <TableCell>
                        {item.metrics.rowsReturned.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant='outlined'
                          size='small'
                          onClick={() => {
                            setQuery(item.queryText);
                            setQueryMetrics(item.metrics);
                            setShowQueryHistory(false);
                          }}
                        >
                          Load
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowQueryHistory(false);
              setShowComparisonDialog(true);
            }}
            variant='contained'
            startIcon={<CompareArrowsIcon />}
          >
            Compare Queries
          </Button>
          <Button onClick={() => setShowQueryHistory(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Render query comparison selection dialog
  const renderComparisonDialog = () => {
    return (
      <Dialog
        open={showComparisonDialog}
        onClose={() => setShowComparisonDialog(false)}
        fullWidth
        maxWidth='sm'
      >
        <DialogTitle>Compare Queries</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Select two queries to compare their performance metrics side by
            side.
          </DialogContentText>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>First Query</InputLabel>
            <Select
              value={selectedQueries.first || ''}
              onChange={(e) =>
                setSelectedQueries({
                  ...selectedQueries,
                  first: e.target.value as number,
                })
              }
              label='First Query'
            >
              {savedQueries.map((query) => (
                <MenuItem key={query.id} value={query.id}>
                  {query.queryName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Second Query</InputLabel>
            <Select
              value={selectedQueries.second || ''}
              onChange={(e) =>
                setSelectedQueries({
                  ...selectedQueries,
                  second: e.target.value as number,
                })
              }
              label='Second Query'
            >
              {savedQueries.map((query) => (
                <MenuItem key={query.id} value={query.id}>
                  {query.queryName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowComparisonDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCompare}
            variant='contained'
            disabled={
              selectedQueries.first === null || selectedQueries.second === null
            }
          >
            Compare
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
        {/* Header */}
        <Box sx={{ py: 2, px: 2 }}>
          <Container maxWidth='xl'>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              {/* Logo and Title */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton
                  sx={{ p: 0, color: 'white' }}
                  onClick={() => navigate('/')}
                >
                  <Logo />
                </IconButton>
                <Typography variant='h6' fontWeight='500' color='white'>
                  QueryHawk
                </Typography>
              </Box>

              {/* History button */}
              {isAuthenticated && (
                <Button
                  variant='outlined'
                  startIcon={<HistoryIcon />}
                  onClick={() => {
                    setShowQueryHistory(true);
                    setCompareMode(false);
                  }}
                >
                  Query History
                </Button>
              )}
            </Box>
          </Container>
        </Box>

        <Container maxWidth='xl' sx={{ mt: 4 }}>
          {/* If token is missing will give alert and notify user to log in */}
          {!isAuthenticated ? (
            <Alert
              severity='warning'
              action={
                <Button color='inherit' size='small' onClick={handleLogin}>
                  Log In
                </Button>
              }
            >
              You need to be logged in to use this feature.
            </Alert>
          ) : compareMode ? (
            // Comparison View
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
                  onClick={() => {
                    setCompareMode(false);
                    setFirstQuery(null);
                    setSecondQuery(null);
                  }}
                >
                  Exit Comparison
                </Button>
              </Box>

              <Grid container spacing={2}>
                {/* First Query */}
                <Grid item xs={6}>
                  <Card sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
                    <CardContent>
                      <Typography variant='h6' color='white' gutterBottom>
                        {firstQuery?.queryName}
                      </Typography>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        sx={{ mb: 2 }}
                      >
                        {firstQuery?.queryText}
                      </Typography>
                      {firstQuery && renderMetricsTable(firstQuery.metrics)}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Second Query */}
                <Grid item xs={6}>
                  <Card sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
                    <CardContent>
                      <Typography variant='h6' color='white' gutterBottom>
                        {secondQuery?.queryName}
                      </Typography>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        sx={{ mb: 2 }}
                      >
                        {secondQuery?.queryText}
                      </Typography>
                      {secondQuery && renderMetricsTable(secondQuery.metrics)}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Performance Difference Summary */}
              {firstQuery && secondQuery && (
                <Card
                  sx={{ bgcolor: 'background.paper', borderRadius: 2, mt: 3 }}
                >
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
                            {firstQuery.metrics.totalCost >
                            secondQuery.metrics.totalCost
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
          ) : (
            // Normal Test Query View
            <Box sx={{ mb: 4 }}>
              <Card sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant='h5' color='white' gutterBottom>
                    Test Query
                  </Typography>
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                  >
                    <TextField
                      label='Database URI'
                      variant='outlined'
                      fullWidth
                      value={uri_string}
                      onChange={(e) => setUri_string(e.target.value)}
                      sx={inputStyles}
                    />
                    <TextField
                      label='Query Name'
                      variant='outlined'
                      fullWidth
                      value={queryName}
                      onChange={(e) => setQueryName(e.target.value)}
                      sx={inputStyles}
                      placeholder='Enter a descriptive name for this query'
                    />
                    <TextField
                      label='Query'
                      variant='outlined'
                      fullWidth
                      multiline
                      rows={4}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    <Button
                      variant='contained'
                      onClick={fetchMetrics}
                      disabled={loading || !uri_string || !query || !queryName}
                      sx={buttonStyles}
                    >
                      {loading ? (
                        <CircularProgress size={24} color='inherit' />
                      ) : (
                        'Fetch Metrics'
                      )}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          )}

          {error && (
            <Typography color='error' style={{ marginTop: '10px' }}>
              {error}
            </Typography>
          )}

          {queryMetrics && !compareMode && (
            <Card sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant='h6' color='white' gutterBottom>
                  Query Metrics
                </Typography>
                {renderMetricsTable(queryMetrics)}
              </CardContent>
            </Card>
          )}
        </Container>
      </Box>

      {/* Dialogs */}
      {renderQueryHistoryDialog()}
      {renderComparisonDialog()}
    </ThemeProvider>
  );
};

export default TestQueryPage;
