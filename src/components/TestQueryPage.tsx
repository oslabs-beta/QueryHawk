// src/TestQueryPage.tsx
import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  IconButton,
  Paper,
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
} from "@mui/material";
import Logo from "./assets/logo_queryhawk";
import { useNavigate } from "react-router-dom";
// Import the same dark theme configuration as index.tsx
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#a594fd",
    },
    secondary: {
      main: "#ff4081",
    },
    background: {
      default: "#000000",
      paper: "#181b1f",
    },
  },
});
// Reuse the same styles as index.tsx
const buttonStyles = {
  height: theme => theme.spacing(7),
  textTransform: 'none',
  px: 4,
  borderRadius: 1.5,
  whiteSpace: 'nowrap',
};

const inputStyles = {
  "& .MuiOutlinedInput-root": {
    height: "48px",
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
const TestQueryPage: React.FC = () => {
  const navigate = useNavigate();
  const [uri_string, setUri_string] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryMetrics, setQueryMetrics] = useState<QueryMetrics | null>(null);

  // Function to handle the button click and fetch metrics
  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    setQueryMetrics(null);

    try {
      // when we fetch have to fetch our back end in the container. (4002)
      const response = await fetch("http://localhost:4002/api/query-metrics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uri_string, query }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch metrics");
      }

      const data: QueryMetrics = await response.json(); // Type the response as MetricsResponse
      setQueryMetrics(data);
    } catch (err) {
      setError("Error fetching metrics");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
        {/* Header */}
        <Box sx={{ py: 2, px: 2 }}>
          <Container maxWidth="xl">
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {/* Logo and Title */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <IconButton
                  sx={{ p: 0, color: "white" }}
                  onClick={() => navigate("/")}
                >
                  <Logo />
                </IconButton>
                <Typography variant="h6" fontWeight="500" color="white">
                  QueryHawk
                </Typography>
              </Box>
            </Box>
          </Container>
        </Box>
        <Container maxWidth="xl" sx={{ mt: 4 }}>
          <Box sx={{ mb: 4 }}>
            <Card sx={{ bgcolor: "background.paper", borderRadius: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" color="white" gutterBottom>
                  Test Query
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <TextField
                    label="Database URI"
                    variant="outlined"
                    fullWidth
                    value={uri_string}
                    onChange={(e) => setUri_string(e.target.value)}
                  />
                  <TextField
                    label="Query"
                    variant="outlined"
                    fullWidth
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <Button
                    variant="contained"
                    onClick={fetchMetrics}
                    disabled={loading || !uri_string || !query}
                    sx={buttonStyles}
                  >
                    {loading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      "Fetch Metrics"
                    )}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {error && (
            <Typography color="error" style={{ marginTop: "10px" }}>
              {error}
            </Typography>
          )}

          {queryMetrics && (
            // <div style={{ marginTop: '20px' }}>
            <Card sx={{ bgcolor: "background.paper", borderRadius: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" color="white" gutterBottom>
                  Query Metrics
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Metric</TableCell>
                        <TableCell align="right">Value</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>Planning Time</TableCell>
                        <TableCell align="right">
                          {queryMetrics.planningTime.toFixed(2)} ms
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell>Execution Time</TableCell>
                        <TableCell align="right">
                          {Math.floor(
                            queryMetrics.executionTime
                          ).toLocaleString()}{" "}
                          ms
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell>Rows Returned</TableCell>
                        <TableCell align="right">
                          {queryMetrics.rowsReturned.toLocaleString()}
                        </TableCell>
                      </TableRow>

                      {/* <TableRow>
                  <TableCell>Work Memory</TableCell>
                  <TableCell align='right'>{queryMetrics.workMem} KB</TableCell>
                </TableRow> */}

                      <TableRow>
                        <TableCell>Number of Loops</TableCell>
                        <TableCell align="right">
                          {queryMetrics.actualLoops}
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell>Shared Hit Blocks</TableCell>
                        <TableCell align="right">
                          {queryMetrics.sharedHitBlocks.toLocaleString()}
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell>Shared Read Blocks</TableCell>
                        <TableCell align="right">
                          {queryMetrics.sharedReadBlocks.toLocaleString()}
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell>Cache Hit Ratio</TableCell>
                        <TableCell align="right">
                          {queryMetrics.cacheHitRatio}%
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell>Startup Cost</TableCell>
                        <TableCell align="right">
                          {Math.floor(
                            queryMetrics.startupCost
                          ).toLocaleString()}
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell>Total Cost</TableCell>
                        <TableCell align="right">
                          {Math.floor(queryMetrics.totalCost).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default TestQueryPage;
