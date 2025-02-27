import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  TextField,
  Typography,
} from '@mui/material';

// Define the button styles
const buttonStyles = {
  height: (theme) => theme.spacing(7),
  textTransform: 'none',
  px: 4,
  borderRadius: 1.5,
  whiteSpace: 'nowrap',
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
}) => {
  return (
    <Box sx={{ mb: 4 }}>
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
            />
            <TextField
              label='Query'
              variant='outlined'
              fullWidth
              multiline
              rows={4}
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
            />
            <Button
              variant='contained'
              onClick={onSubmit}
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
  );
};

export default TestQueryForm;
