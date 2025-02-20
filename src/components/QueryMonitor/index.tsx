import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Container, Grid, IconButton, Typography, Button, Card, CardContent,
  TextField, CircularProgress, ThemeProvider, createTheme } from "@mui/material";
import Logo from "../assets/logo_queryhawk";
import GrafanaDashboard from "./GrafanaDashboard";

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

const buttonStyles = {
  height: theme => theme.spacing(7),
  textTransform: 'none',
  px: 4,
  borderRadius: 1.5,
  whiteSpace: 'nowrap',
};


const QueryMonitor: React.FC = () => {
  const navigate = useNavigate();
  const goTestQueryPage = () => { navigate("/test-query");};
  const [isConnected, setIsConnected] = useState(false);
  const [dbUrl, setDbUrl] = useState("");
  const [error, setError] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError("");

    try {
      const response = await fetch("http://localhost:4002/api/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          databaseUrl: dbUrl,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to connect to database");
      }
      setIsConnected(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsConnecting(false);
    }
  };
  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
        {/* Header */}
        <Box
          sx={{
            py: 2, // Padding top and bottom: 16px (2 * 8px)
            px: 2, // Padding left and right: 16px (2 * 8px)
          }}
        >
          <Container maxWidth="xl">
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between", // Puts space between logo and button
                alignItems: "center",
              }}
            >
              {/* Logo and Title */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <IconButton sx={{ p: 0, color: "white" }}>
                  {" "}
                  {/* Logo */}
                  <Logo />
                </IconButton>
                <Typography variant="h6" fontWeight="500" color="white">
                  QueryHawk
                </Typography>
              </Box>

              {/* Test Query Button */}
              <Button
                onClick={() => navigate("/test-query")}
                sx={{
                  ...buttonStyles,
                  color: "#fff",
                  "&:hover": {
                    color: "primary.main",
                    bgcolor: "transparent",
                  },
                }}
              >
                Test Query
              </Button>
            </Box>
          </Container>
        </Box>

        {/* Main Content */}
        <Container maxWidth="xl" sx={{ mt: 4 }}>
          {/* Database Connection Section - Always visible */}
          <Box sx={{ mb: 4 }}>
            <Card sx={{ bgcolor: "background.paper", borderRadius: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <TextField
                    label="Database URI"
                    // placeholder="postgresql://user:pass@localhost:5432/dbname"
                    variant="outlined"
                    fullWidth
                    value={dbUrl}
                    onChange={(e) => setDbUrl(e.target.value)}
                  />
                  <Button
                    variant="contained"
                    onClick={handleConnect}
                    disabled={isConnecting || !dbUrl}
                    sx={buttonStyles}
                  >
                    {isConnecting ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      "Connect Database"
                    )}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Dashboard Content */}
          {isConnected && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <GrafanaDashboard panelId="1" title="Transaction Rate" />
              </Grid>
              <Grid item xs={12} md={6}>
                <GrafanaDashboard panelId="2" title="Cache Hit Ratio" />
              </Grid>
            </Grid>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default QueryMonitor;
