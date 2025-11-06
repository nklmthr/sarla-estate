import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { workActivityApi } from '../../api/workActivityApi';
import { WorkActivity, WorkActivityStatus } from '../../types';

const WorkActivityList: React.FC = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<WorkActivity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<WorkActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<WorkActivity | null>(null);

  useEffect(() => {
    loadActivities();
  }, []);

  useEffect(() => {
    filterActivities();
  }, [searchTerm, statusFilter, activities]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const data = await workActivityApi.getAllWorkActivities();
      console.log('API Response:', data);
      // Ensure data is an array
      const activitiesArray = Array.isArray(data) ? data : [];
      setActivities(activitiesArray);
      setFilteredActivities(activitiesArray);
    } catch (error) {
      console.error('Error loading work activities:', error);
      setActivities([]);
      setFilteredActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const filterActivities = () => {
    // Ensure activities is always an array
    if (!Array.isArray(activities)) {
      setFilteredActivities([]);
      return;
    }

    let filtered = activities;

    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((act) => act.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (act) =>
          act.name?.toLowerCase().includes(term) ||
          act.description?.toLowerCase().includes(term) ||
          act.typicalLocation?.toLowerCase().includes(term)
      );
    }

    setFilteredActivities(filtered);
  };

  const handleDelete = async () => {
    if (!activityToDelete) return;

    try {
      await workActivityApi.deleteWorkActivity(activityToDelete.id!);
      setActivities(activities.filter((a) => a.id !== activityToDelete.id));
      setDeleteDialogOpen(false);
      setActivityToDelete(null);
    } catch (error) {
      console.error('Error deleting work activity:', error);
    }
  };

  const openDeleteDialog = (activity: WorkActivity) => {
    setActivityToDelete(activity);
    setDeleteDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'default';
      case 'SEASONAL':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getShiftColor = (shift: string) => {
    switch (shift) {
      case 'MORNING':
        return 'info';
      case 'EVENING':
        return 'secondary';
      case 'FULL_DAY':
        return 'primary';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Work Activities</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/work-activities/new')}
        >
          Add Activity
        </Button>
      </Box>

      <Card>
        <Box p={2} display="flex" gap={2}>
          <TextField
            fullWidth
            placeholder="Search by name, description, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="ALL">All</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
              <MenuItem value="SEASONAL">Seasonal</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Work Shift</TableCell>
                <TableCell>Frequency</TableCell>
                <TableCell>Duration (hrs/day)</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredActivities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="textSecondary">
                      {searchTerm || statusFilter !== 'ALL' ? 'No activities found' : 'No activities yet'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredActivities.map((activity) => (
                  <TableRow key={activity.id} hover>
                    <TableCell><strong>{activity.name}</strong></TableCell>
                    <TableCell>
                      {activity.description && activity.description.length > 50
                        ? activity.description.substring(0, 50) + '...'
                        : activity.description}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={activity.workShift?.replace('_', ' ')}
                        color={getShiftColor(activity.workShift || '')}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{activity.frequency?.replace('_', ' ')}</TableCell>
                    <TableCell>{activity.estimatedDurationHoursPerDay}</TableCell>
                    <TableCell>
                      <Chip
                        label={activity.status}
                        color={getStatusColor(activity.status || '')}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/work-activities/${activity.id}/edit`)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => openDeleteDialog(activity)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete work activity "{activityToDelete?.name}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkActivityList;

