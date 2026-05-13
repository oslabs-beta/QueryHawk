import React from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Typography,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';

interface OptimizationResultCardProps {
  result: {
    suggestedQuery: string;
    explanation: string;
    warning?: string;
  };
  copied: boolean;
  onCopy: () => void;
  onLoad: () => void;
}

const OptimizationResultCard = React.forwardRef<
  HTMLDivElement,
  OptimizationResultCardProps
>(({ result, copied, onCopy, onLoad }, ref) => {
  return (
    <Card
      ref={ref}
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 2,
        mt: 2,
        mb: 2,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography variant='h6' color='white' gutterBottom>
          AI Optimization Result
        </Typography>

        {result.warning && (
          <Alert severity='warning' sx={{ mb: 2 }}>
            {result.warning}
          </Alert>
        )}

        <Typography variant='subtitle2' color='text.secondary' gutterBottom>
          Suggested Query
        </Typography>
        <Box
          sx={{
            position: 'relative',
            bgcolor: 'rgba(0,0,0,0.3)',
            borderRadius: 1,
            p: 2,
            mb: 2,
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            color: '#a594fd',
            whiteSpace: 'pre-wrap',
          }}
        >
          <IconButton
            onClick={onCopy}
            sx={{ position: 'absolute', top: 4, right: 4 }}
            size='small'
          >
            {copied ? (
              <CheckIcon fontSize='small' />
            ) : (
              <ContentCopyIcon fontSize='small' />
            )}
          </IconButton>
          {result.suggestedQuery}
        </Box>

        <Typography variant='subtitle2' color='text.secondary' gutterBottom>
          Explanation
        </Typography>
        <Typography variant='body2' color='white'>
          {result.explanation}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button
            variant='contained'
            onClick={onLoad}
            sx={{ textTransform: 'none', mt: 2 }}
          >
            Load into Tester
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
});

export default OptimizationResultCard;
