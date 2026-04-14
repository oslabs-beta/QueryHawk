import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import { BarChart, XAxis, YAxis, Bar, Cell } from 'recharts';
import CloseIcon from '@mui/icons-material/Close';

export interface RedisTestResult {
  pgExecutionTime: number;
  redisRetrievalTime: number;
}

interface RedisTestDialogProps {
  open: boolean;
  onClose: () => void;
  redisMetrics: RedisTestResult | null;
  redisLoading: boolean;
}

function RedisChart({ redisMetrics }: { redisMetrics: RedisTestResult }) {
  const { pgExecutionTime, redisRetrievalTime } = redisMetrics;
  const data = [
    { name: 'PostgreSQL', value: pgExecutionTime },
    { name: 'Redis', value: redisRetrievalTime },
  ];

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant='subtitle1' fontWeight='bold'>
          Performance Metrics
        </Typography>
        <Typography variant='body2'>
          PostgreSQL Execution Time: {pgExecutionTime.toFixed(2)} ms
        </Typography>
        <Typography variant='body2'>
          Redis Retrieval Time: {redisRetrievalTime.toFixed(2)} ms
        </Typography>
      </Box>

      <BarChart width={350} height={250} data={data}>
        <XAxis dataKey='name' stroke='#ffffff' />
        <YAxis
          tickFormatter={(value) => `${value} ms`}
          width={65}
          stroke='#ffffff'
        />
        <Bar dataKey='value'>
          <Cell fill='#a594fd ' />
          <Cell fill='#ff4081 ' />
        </Bar>
      </BarChart>
    </Box>
  );
}

const RedisTestDialog: React.FC<RedisTestDialogProps> = ({
  open,
  onClose,
  redisMetrics,
  redisLoading,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { minWidth: 400 } }}
    >
      <DialogTitle sx={{ position: 'relative' }}>
        Redis vs. PostgreSQL Performance
        <IconButton
          sx={{ position: 'absolute', right: 9, top: 12 }}
          onClick={onClose}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {redisLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : redisMetrics ? (
          <Box>
            <RedisChart redisMetrics={redisMetrics} />
          </Box>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default RedisTestDialog;
