import React from 'react';
import {
  Box,
  Container,
  IconButton,
  Typography,
  Button,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import Logo from '../assets/logo_queryhawk';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onHistoryClick?: () => void;
  isAuthenticated: boolean;
}
// const darkTheme = createTheme({
//   palette: {
//     mode: 'dark',
//     primary: {
//       main: '#a594fd',
//     },
//     secondary: {
//       main: '#ff4081',
//     },
//     background: {
//       default: '#000000',
//       paper: '#181b1f',
//     },
//   },
// });

const Header: React.FC<HeaderProps> = ({ onHistoryClick, isAuthenticated }) => {
  const navigate = useNavigate();

  return (
    // <ThemeProvider theme={darkTheme}>
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
          {isAuthenticated && onHistoryClick && (
            <Button
              variant='outlined'
              startIcon={<HistoryIcon />}
              onClick={onHistoryClick}
            >
              Query History
            </Button>
          )}
        </Box>
      </Container>
    </Box>
    // </ThemeProvider>
  );
};

export default Header;
