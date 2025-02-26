import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';

// Define the interface for query metrics
export interface QueryMetrics {
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

interface MetricsTableProps {
  metrics: QueryMetrics | null; // null  allows no data to be rendered if its not available
}
// metrics is the prop that will be passed to the MetricsTable component
const MetricsTable: React.FC<MetricsTableProps> = ({ metrics }) => {
  if (!metrics) return null;

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Metric</TableCell>
            <TableCell align='right'>Value</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>Planning Time</TableCell>
            <TableCell align='right'>
              {metrics.planningTime.toFixed(2)} ms
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell>Execution Time</TableCell>
            <TableCell align='right'>
              {Math.floor(metrics.executionTime).toLocaleString()} ms
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell>Rows Returned</TableCell>
            <TableCell align='right'>
              {metrics.rowsReturned.toLocaleString()}
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell>Number of Loops</TableCell>
            <TableCell align='right'>{metrics.actualLoops}</TableCell>
          </TableRow>

          <TableRow>
            <TableCell>Shared Hit Blocks</TableCell>
            <TableCell align='right'>
              {metrics.sharedHitBlocks.toLocaleString()}
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell>Shared Read Blocks</TableCell>
            <TableCell align='right'>
              {metrics.sharedReadBlocks.toLocaleString()}
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell>Cache Hit Ratio</TableCell>
            <TableCell align='right'>{metrics.cacheHitRatio}%</TableCell>
          </TableRow>

          <TableRow>
            <TableCell>Startup Cost</TableCell>
            <TableCell align='right'>
              {Math.floor(metrics.startupCost).toLocaleString()}
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell>Total Cost</TableCell>
            <TableCell align='right'>
              {Math.floor(metrics.totalCost).toLocaleString()}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default MetricsTable;
