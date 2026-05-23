import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  TextField,
  Typography,
  Tooltip,
} from '@mui/material';

// Define the button styles
const buttonStyles = {
  height: (theme) => theme.spacing(7),
  textTransform: 'none',
  px: 4,
  borderRadius: 1.5,
  whiteSpace: 'nowrap',
  width: '100%',
};

// Define the input styles
const inputStyles = {
  '& .MuiOutlinedInput-root': {
    height: '48px',
    borderRadius: 1.5,
  },
};

interface TestQueryFormProps {
  uri_string: string;
  query: string;
  queryName: string;
  loading: boolean;
  onUriChange: (value: string) => void;
  onQueryChange: (value: string) => void;
  onQueryNameChange: (value: string) => void;
  onSubmit: () => void;
  isQueryLoaded: boolean;
}

const TestQueryForm: React.FC<TestQueryFormProps> = ({
  uri_string,
  query,
  queryName,
  loading,
  onUriChange,
  onQueryChange,
  onQueryNameChange,
  onSubmit,
  isQueryLoaded,
}) => {
  return (
    <Box sx={{ mb: 2 }}>
      <Card sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant='h5' color='white' gutterBottom>
            Test Query
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label='Database URI'
              variant='outlined'
              fullWidth
              value={uri_string}
              onChange={(e) => onUriChange(e.target.value)}
              // helperText={!uri_string ? 'Required for Redis Comparison' : ''}
              sx={inputStyles}
            />
            <TextField
              label='Query Name'
              variant='outlined'
              fullWidth
              value={queryName}
              onChange={(e) => onQueryNameChange(e.target.value)}
              sx={inputStyles}
              placeholder='Enter a descriptive name for this query'
              InputProps={{ readOnly: isQueryLoaded }}
            />
            <TextField
              label='Query'
              variant='outlined'
              fullWidth
              multiline
              rows={4}
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              InputProps={{ readOnly: isQueryLoaded }}
            />
            <Tooltip
              title={
                isQueryLoaded
                  ? 'Click New Query to test a different query'
                  : !uri_string || !queryName || !query
                    ? 'Please fill in Database URI, Query Name, and Query to fetch Metrics'
                    : ''
              }
              componentsProps={{
                tooltip: {
                  sx: { fontSize: '0.8rem' },
                },
              }}
            >
              <span>
                <Button
                  variant='contained'
                  onClick={onSubmit}
                  disabled={
                    loading ||
                    !uri_string ||
                    !query ||
                    !queryName ||
                    isQueryLoaded
                  }
                  sx={buttonStyles}
                >
                  {loading ? (
                    <CircularProgress size={24} color='inherit' />
                  ) : (
                    'Fetch Metrics'
                  )}
                </Button>
              </span>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TestQueryForm;
