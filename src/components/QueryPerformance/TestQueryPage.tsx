import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  ThemeProvider,
  createTheme,
  Alert,
  Button,
  CssBaseline,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Import custom components
import Header from './Header'; // Nav bar on component on top
import MetricsTable, { QueryMetrics } from './MetricsTable'; // component that has the query mertics
import QueryHistoryDialog, { SavedQuery } from './QueryHistoryDialog'; // component that you can view your past queries.
import QueryComparisonPage from './QueryComparisonPage';
import OptimizationResultCard from './OptimizationResultCard';
import TestQueryForm from './TestQueryForm';
import RedisTestDialog, { RedisTestResult } from './RedisTestDialog';

// Import the same dark theme configuration as before
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
      // default: '#000000',
      // paper: '#181b1f',
    },
  },
});

const TestQueryPage: React.FC = () => {
  const navigate = useNavigate();
  const [uri_string, setUri_string] = useState('');
  const [queryId, setQueryId] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [queryName, setQueryName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryMetrics, setQueryMetrics] = useState<QueryMetrics | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // State for saved queries and comparison
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [showQueryHistory, setShowQueryHistory] = useState(false);

  const [firstQuery, setFirstQuery] = useState<SavedQuery | null>(null);
  const [secondQuery, setSecondQuery] = useState<SavedQuery | null>(null);
  const [selectedQueryIds, setSelectedQueryIds] = useState<number[]>([]);
  const [compareMode, setCompareMode] = useState(false);

  // Redis state
  const [redisDialogOpen, setRedisDialogOpen] = useState(false);
  const [redisLoading, setRedisLoading] = useState(false);
  const [redisMetrics, setRedisMetrics] = useState<RedisTestResult | null>(
    null,
  );

  // Represents what query was just tested
  const [savedQueryText, setSavedQueryText] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);

  // Optimization
  const [optimizationLoading, setOptimizationLoading] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<{
    suggestedQuery: string;
    explanation: string;
    warning?: string;
  } | null>(null);

  const optimizationResultRef = useRef<HTMLDivElement>(null);

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

  // Run once on mount - check auth and load saved queries if authenticated
  useEffect(() => {
    const isAuthed = checkAuthentication();
    if (isAuthed) {
      fetchSavedQueries();
    }
    // Run once on mount only - adding fetchSavedQueries to deps would cause an infinite loop
    // since it's recreated on every render. checkAuthentication return value is used
    // instead of isAuthenticated state to avoid stale state timing issue.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Automatically scrolls to the AI result every time optimizationResult changes
  useEffect(() => {
    if (optimizationResult && optimizationResultRef.current) {
      optimizationResultRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [optimizationResult]);

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
      setQueryId(data.id);
      setSavedQueryText(query);
      // Refresh the saved queries list after successful fetch
      await fetchSavedQueries();
    } catch (err) {
      setError('Error fetching metrics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = () => {
    const first =
      savedQueries.find((q) => q.id === selectedQueryIds[0]) ?? null;
    const second =
      savedQueries.find((q) => q.id === selectedQueryIds[1]) ?? null;
    setFirstQuery(first);
    setSecondQuery(second);
    setCompareMode(true);
  };

  // Function to handle loading a query from history
  // Takes in the string and metrics thats that have a set type for each metric.
  const handleLoadQuery = (
    id: number,
    name: string,
    queryText: string,
    metrics: QueryMetrics,
  ) => {
    setQueryId(id);
    setUri_string('');
    setQueryName(name);
    setQuery(queryText);
    setQueryMetrics(metrics);
    setSavedQueryText(queryText);
    setShowQueryHistory(false);
    setCompareMode(false);
    setOptimizationResult(null);
  };

  // Redirect to login if user is not authenticated
  const handleLogin = () => {
    navigate('/auth');
  };

  // Function to handle New Query button
  const handleNewQuery = () => {
    setUri_string('');
    setQueryName('');
    setQuery('');
    setQueryId(null);
    setQueryMetrics(null);
    setError(null);
    setSavedQueryText('');
    setOptimizationResult(null);
  };

  const handleOptimization = async () => {
    setOptimizationLoading(true);
    setOptimizationResult(null);
    setError(null);

    try {
      // check if user authenticated
      if (!checkAuthentication()) {
        throw Error('Authentication required. Please login to continue');
      }
      const token = localStorage.getItem(`authToken`);

      const response = await fetch(
        'http://localhost:4002/api/query/optimization',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            query: savedQueryText,
            metrics: queryMetrics,
            uri_string: uri_string,
          }),
        },
      );

      if (response.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        throw Error('Authentication required. Please login to continue.');
      }

      if (!response.ok) {
        throw Error('Failed to optimize query with AI.');
      }

      const data = await response.json();
      setOptimizationResult(data);
    } catch (err) {
      setError('Error optimizing query with AI. Please try again.');
      console.error(err);
    } finally {
      setOptimizationLoading(false);
    }
  };

  // Function to handle redis test
  const handleRedisTest = async () => {
    setRedisLoading(true);
    setRedisDialogOpen(true);
    setRedisMetrics(null);
    setError(null);

    try {
      // check if user authenticated
      if (!checkAuthentication()) {
        throw Error('Authentication required. Please login to continue');
      }
      const token = localStorage.getItem(`authToken`);

      const response = await fetch(
        'http://localhost:4002/api/run-query/redis',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            uri_string,
            queryId,
          }),
        },
      );

      if (response.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        throw Error('Authentication required. Please login to continue.');
      }

      if (!response.ok) {
        throw Error('Failed to fetch metrics with Redis.');
      }

      const data: RedisTestResult = await response.json();
      setRedisMetrics(data);
    } catch (err) {
      setRedisDialogOpen(false);
      setError(
        'Error fetching metrics with Redis. Make sure to input correct URI',
      );
      console.error(err);
    } finally {
      setRedisLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(
      optimizationResult?.suggestedQuery ?? '',
    );
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 3000);
  };

  const handleLoadSuggestedQuery = () => {
    setUri_string('');
    setQueryName(`${queryName} (AI Optimized)`);
    setQuery(optimizationResult?.suggestedQuery ?? '');
    setQueryId(null);
    setQueryMetrics(null);
    setError(null);
    setSavedQueryText('');
    setOptimizationResult(null);
  };

  const isQueryLoaded = queryMetrics !== null;

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline /> {/* Applies cosistent base style across browsers */}
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
        {/* Header */}
        <Header
          isAuthenticated={isAuthenticated}
          onHistoryClick={() => {
            setShowQueryHistory(true);
          }}
        />

        <Container maxWidth='xl' sx={{ mt: 4 }}>
          {/* If token is missing will give alert and notify user to log in */}
          {!isAuthenticated ? (
            <Alert
              severity='warning'
              action={
                <Button
                  color='inherit'
                  size='small'
                  onClick={handleLogin}
                  sx={{ textTransform: 'none' }}
                >
                  Log In
                </Button>
              }
            >
              You need to be logged in to use this feature.
            </Alert>
          ) : compareMode ? ( //
            // Comparison View
            <QueryComparisonPage
              firstQuery={firstQuery}
              secondQuery={secondQuery}
              onExitCompare={() => {
                setSelectedQueryIds([]);
                setCompareMode(false);
                handleNewQuery();
              }}
            />
          ) : (
            // Normal Test Query View
            <>
              {isQueryLoaded && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Typography variant='h5' color='white'>
                    {queryName}
                  </Typography>
                  <Button
                    variant='outlined'
                    onClick={handleNewQuery}
                    sx={{ textTransform: 'none' }}
                  >
                    New Query
                  </Button>
                </Box>
              )}
              <TestQueryForm
                uri_string={uri_string}
                query={query}
                queryName={queryName}
                loading={loading}
                onUriChange={setUri_string}
                onQueryChange={setQuery}
                onQueryNameChange={setQueryName}
                onSubmit={fetchMetrics}
                isQueryLoaded={isQueryLoaded}
              />

              {error && (
                <Typography color='error' style={{ marginTop: '10px' }}>
                  {error}
                </Typography>
              )}

              {queryMetrics && (
                <Card sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant='h6' color='white' gutterBottom>
                      Query Metrics
                    </Typography>
                    <MetricsTable metrics={queryMetrics} />
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        mt: 2,
                        gap: 2,
                      }}
                    >
                      <Tooltip
                        title={
                          !uri_string
                            ? 'Enter your database URI above to run this test'
                            : ''
                        }
                        componentsProps={{
                          tooltip: {
                            sx: {
                              fontSize: '0.840rem',
                            },
                          },
                        }}
                      >
                        <span>
                          <Button
                            size='small'
                            onClick={handleRedisTest}
                            variant='contained'
                            disabled={redisLoading || !queryId || !uri_string}
                            sx={{ mt: 2, textTransform: 'none' }}
                          >
                            Run with Redis
                          </Button>
                        </span>
                      </Tooltip>

                      <Tooltip
                        title={
                          optimizationLoading
                            ? 'Optimizing..'
                            : !uri_string
                              ? 'Enter your database URI above to optimize your query'
                              : ''
                        }
                        componentsProps={{
                          tooltip: {
                            sx: {
                              fontSize: '0.840rem',
                            },
                          },
                        }}
                      >
                        <span>
                          <Button
                            size='small'
                            onClick={handleOptimization}
                            variant='contained'
                            disabled={
                              optimizationLoading ||
                              !savedQueryText ||
                              !queryMetrics ||
                              !uri_string
                            }
                            sx={{ mt: 2, textTransform: 'none' }}
                          >
                            {optimizationLoading ? (
                              <CircularProgress size={24} color='inherit' />
                            ) : (
                              'Optimize Query with AI'
                            )}
                          </Button>
                        </span>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              )}
              {optimizationResult && (
                <OptimizationResultCard
                  ref={optimizationResultRef}
                  result={optimizationResult}
                  copied={copied}
                  onCopy={handleCopy}
                  onLoad={handleLoadSuggestedQuery}
                />
              )}
            </>
          )}
        </Container>
      </Box>
      {/* Modals */}
      <QueryHistoryDialog
        open={showQueryHistory}
        onClose={() => setShowQueryHistory(false)}
        savedQueries={savedQueries}
        onLoadQuery={handleLoadQuery}
        selectedQueryIds={selectedQueryIds}
        onToggleSelect={(id: number) => {
          setSelectedQueryIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
          );
        }}
        onCompare={handleCompare}
      />
      <RedisTestDialog
        open={redisDialogOpen}
        onClose={() => setRedisDialogOpen(false)}
        redisMetrics={redisMetrics}
        redisLoading={redisLoading}
      />
    </ThemeProvider>
  );
};

export default TestQueryPage;
