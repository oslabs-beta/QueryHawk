// src/components/QueryMonitor/AuthPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
} from '@mui/material';
import { GitHub as GitHubIcon } from '@mui/icons-material';
import logo from '../assets/logo_queryhawk.svg';

// Create dark theme
const darkTheme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#9d7fff',
      },
      secondary: {
        main: '#FFB4E1',
      },
      background: {
        default: '#0A0A0F',
        paper: '#16121F',
      },
    },
    typography: {
      fontFamily: '"Pacifico", sans-serif',
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            textTransform: 'none',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 16,
          },
        },
      },
    },
  });
  

const AuthPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGitHubLogin = () => {
    const githubClientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/github/callback');
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${redirectUri}&scope=user:email`;
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          bgcolor: 'background.default',
        }}
      >
        <Container maxWidth="sm">
          <Paper
            elevation={6}
            sx={{
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* Logo and Title */}
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                component="img"
                src={logo}
                alt="QueryHawk Logo"
                sx={{ width: 50, height: 50, objectFit: 'contain', filter: 'brightness(0) invert(1)'}}
              />
              <Typography 
                variant="h4" 
                component="h1"
                sx={{ fontWeight: 600, color: "primary.main"}}
              >
                QueryHawk
              </Typography>
            </Box>

            {/* GitHub OAuth Button */}
            <Button
              fullWidth
              variant="outlined"
              startIcon={<GitHubIcon />}
              onClick={handleGitHubLogin}
              sx={{ mb: 2, textTransform: "none"}}
            >
              Continue with GitHub
            </Button>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default AuthPage;