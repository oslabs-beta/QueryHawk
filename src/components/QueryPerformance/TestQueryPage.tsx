import React, { useEffect, useState } from 'react';
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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Import custom components
import Header from './Header'; // Nav bar on component on top
import MetricsTable, { QueryMetrics } from './MetricsTable'; // component that has the query mertics
import QueryHistoryDialog, { SavedQuery } from './QueryHistoryDialog'; // component that you can view your past queries.
import QueryComparisonPage from './QueryComparisonPage';
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
      setQueryId(data.id); // adding this for the redis button to work on fresh new query,

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
    setShowQueryHistory(false);
    setCompareMode(false);
  };

  // Redirect to login if user is not authenticated
  const handleLogin = () => {
    navigate('/auth');
  };

  // Function to handle redis test
  const handleRedisTest = async () => {
    // Things it needs
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

      // need to fetch our route in our backend that has runRedisTest
      // it needs the queryId
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
                // When we exit out setCompareMode becomes false and the page goes back to normal view.
                setCompareMode(false);
              }}
            />
          ) : (
            // Normal Test Query View
            <>
              <TestQueryForm
                uri_string={uri_string}
                query={query}
                queryName={queryName}
                loading={loading}
                onUriChange={setUri_string}
                onQueryChange={setQuery}
                onQueryNameChange={setQueryName}
                onSubmit={fetchMetrics}
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
                            sx={{ mt: 2 }}
                          >
                            Run with Redis
                          </Button>
                        </span>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
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
