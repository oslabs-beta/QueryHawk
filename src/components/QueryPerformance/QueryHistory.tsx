import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  IconButton,
  Box,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { QueryMetrics } from './MetricsTable';

// Define the SavedQuery interface
export interface SavedQuery {
  id: number;
  queryName: string;
  queryText: string;
  metrics: QueryMetrics;
  createdAt: string;
}

interface QueryHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  savedQueries: SavedQuery[];
  onLoadQuery: (queryText: string, metrics: QueryMetrics) => void;
  onOpenCompare: () => void;
}

const QueryHistoryDialog: React.FC<QueryHistoryDialogProps> = ({
  open,
  onClose,
  savedQueries,
  onLoadQuery,
  onOpenCompare,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth='md'
      disableEnforceFocus
      disableRestoreFocus
    >
      <DialogTitle>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          Query History
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {savedQueries.length === 0 ? (
          <DialogContentText>
            You don't have any saved queries yet. Run a query and save it to see
            it here.
          </DialogContentText>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Query</TableCell>
                  <TableCell>Execution Time</TableCell>
                  <TableCell>Rows</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {savedQueries.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.queryName}</TableCell>
                    <TableCell>
                      {item.queryText.length > 30
                        ? `${item.queryText.substring(0, 30)}...`
                        : item.queryText}
                    </TableCell>
                    <TableCell>
                      {Math.floor(item.metrics.executionTime).toLocaleString()}{' '}
                      ms
                    </TableCell>
                    <TableCell>
                      {item.metrics.rowsReturned.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant='outlined'
                        size='small'
                        sx={{
                          textTransform: "none"
                        }}
                        onClick={() =>
                          onLoadQuery(item.queryText, item.metrics)
                        }
                      >
                        Load
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onOpenCompare}
          variant='contained'
          startIcon={<CompareArrowsIcon />}
        >
          Compare Queries
        </Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default QueryHistoryDialog;
