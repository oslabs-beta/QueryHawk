import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { SavedQuery } from './QueryHistory';

interface ComparisonDialogProps {
  open: boolean;
  onClose: () => void;
  savedQueries: SavedQuery[];
  selectedQueries: {
    first: number | null;
    second: number | null;
  };
  onSelectQuery: (key: 'first' | 'second', value: number) => void;
  onCompare: () => void;
}

const ComparisonDialog: React.FC<ComparisonDialogProps> = ({
  open,
  onClose,
  savedQueries,
  selectedQueries,
  onSelectQuery,
  onCompare,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth='sm'
      disableEnforceFocus
      disableRestoreFocus
    >
      <DialogTitle>Compare Queries</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Select two queries to compare their performance metrics side by side.
        </DialogContentText>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>First Query</InputLabel>
          <Select
            value={selectedQueries.first || ''}
            onChange={(e) => onSelectQuery('first', e.target.value as number)}
            label='First Query'
          >
            {savedQueries.map((query) => (
              <MenuItem key={query.id} value={query.id}>
                {query.queryName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Second Query</InputLabel>
          <Select
            value={selectedQueries.second || ''}
            onChange={(e) => onSelectQuery('second', e.target.value as number)}
            label='Second Query'
          >
            {savedQueries.map((query) => (
              <MenuItem key={query.id} value={query.id}>
                {query.queryName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={onCompare}
          variant='contained'
          sx={{
            textTransform: "none"
          }}
          disabled={
            selectedQueries.first === null || selectedQueries.second === null
          }
        >
          Compare
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ComparisonDialog;
