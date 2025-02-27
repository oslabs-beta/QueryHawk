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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Import custom components
import Header from './Header'; // Nav bar on component on top
import MetricsTable, { QueryMetrics } from './MetricsTable'; // component that has the query mertics
import QueryHistory, { SavedQuery } from './QueryHistory'; // component that you can view your past queries.
import QueryComparisonForm from './QueryComparisonForm';
import QueryComparisonPage from './QueryComparisonPage';
import TestQueryForm from './TestQueryForm';

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

  // Function to handle loading a query from history
  // Takes in the string and metrics thats that have a set type for each metric.
  const handleLoadQuery = (queryText: string, metrics: QueryMetrics) => {
    setQuery(queryText);
    setQueryMetrics(metrics);
    setShowQueryHistory(false);
  };

  // Function to handle query selection for comparison
  const handleSelectQuery = (key: 'first' | 'second', value: number) => {
    setSelectedQueries({
      ...selectedQueries,
      [key]: value,
    });
  };

  // Redirect to login if user is not authenticated
  const handleLogin = () => {
    navigate('/auth');
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
            setCompareMode(false);
          }}
        />

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
          ) : compareMode ? ( //
            // Comparison View
            <QueryComparisonPage
              firstQuery={firstQuery}
              secondQuery={secondQuery}
              onExitCompare={() => {
                // When we exit out setCompareMode becomes false and the page goes back to normal view.
                setCompareMode(false);
                setFirstQuery(null); //
                setSecondQuery(null);
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
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </Container>
      </Box>
      {/* Modals */}
      <QueryHistory
        open={showQueryHistory}
        onClose={() => setShowQueryHistory(false)}
        savedQueries={savedQueries}
        onLoadQuery={handleLoadQuery}
        onOpenCompare={() => {
          setShowQueryHistory(false);
          setShowComparisonDialog(true);
        }}
      />
      <QueryComparisonForm
        open={showComparisonDialog}
        onClose={() => setShowComparisonDialog(false)}
        savedQueries={savedQueries}
        selectedQueries={selectedQueries}
        onSelectQuery={handleSelectQuery}
        onCompare={handleCompare}
      />
    </ThemeProvider>
  );
};

export default TestQueryPage;
