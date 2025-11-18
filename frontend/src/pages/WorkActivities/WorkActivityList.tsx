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
  Grid,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { workActivityApi } from '../../api/workActivityApi';
import { completionCriteriaApi } from '../../api/completionCriteriaApi';
import { WorkActivity, WorkActivityCompletionCriteria } from '../../types';

const WorkActivityList: React.FC = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<WorkActivity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<WorkActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<WorkActivity | null>(null);
  const [criteriaDialogOpen, setCriteriaDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<WorkActivity | null>(null);
  const [completionCriteria, setCompletionCriteria] = useState<WorkActivityCompletionCriteria[]>([]);
  const [showCriteriaForm, setShowCriteriaForm] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState<WorkActivityCompletionCriteria | null>(null);
  const [criteriaFormData, setCriteriaFormData] = useState<WorkActivityCompletionCriteria>({
    unit: 'KG',
    value: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    isActive: true,
    notes: '',
  });

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
          act.description?.toLowerCase().includes(term)
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

  const openCriteriaDialog = async (activity: WorkActivity) => {
    setSelectedActivity(activity);
    try {
      const data = await completionCriteriaApi.getAllByActivity(activity.id!);
      setCompletionCriteria(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading completion criteria:', error);
      setCompletionCriteria([]);
    }
    setCriteriaDialogOpen(true);
  };

  const closeCriteriaDialog = () => {
    setCriteriaDialogOpen(false);
    setSelectedActivity(null);
    setCompletionCriteria([]);
    setShowCriteriaForm(false);
    setEditingCriteria(null);
    resetCriteriaForm();
  };

  const resetCriteriaForm = () => {
    setCriteriaFormData({
      unit: 'KG',
      value: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      isActive: true,
      notes: '',
    });
  };

  const handleAddCriteria = () => {
    resetCriteriaForm();
    setEditingCriteria(null);
    setShowCriteriaForm(true);
  };

  const handleEditCriteria = (criteria: WorkActivityCompletionCriteria) => {
    setCriteriaFormData(criteria);
    setEditingCriteria(criteria);
    setShowCriteriaForm(true);
  };

  const handleCriteriaFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setCriteriaFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : name === 'value' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSaveCriteria = async () => {
    if (!selectedActivity?.id) return;

    try {
      if (editingCriteria?.id) {
        // Update existing criteria
        await completionCriteriaApi.update(selectedActivity.id, editingCriteria.id, criteriaFormData);
      } else {
        // Create new criteria
        await completionCriteriaApi.create(selectedActivity.id, criteriaFormData);
      }
      
      // Reload criteria
      const data = await completionCriteriaApi.getAllByActivity(selectedActivity.id);
      setCompletionCriteria(Array.isArray(data) ? data : []);
      
      // Close form
      setShowCriteriaForm(false);
      setEditingCriteria(null);
      resetCriteriaForm();
    } catch (error) {
      console.error('Error saving completion criteria:', error);
    }
  };

  const handleCancelCriteriaForm = () => {
    setShowCriteriaForm(false);
    setEditingCriteria(null);
    resetCriteriaForm();
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
            placeholder="Search by name or description..."
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
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredActivities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
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
                        label={activity.status}
                        color={getStatusColor(activity.status || '')}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => openCriteriaDialog(activity)}
                        color="success"
                        title="Manage Completion Criteria"
                      >
                        <CheckCircleIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/work-activities/${activity.id}/edit`)}
                        color="primary"
                        title="Edit Activity"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => openDeleteDialog(activity)}
                        color="error"
                        title="Delete Activity"
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

      {/* Completion Criteria Dialog */}
      <Dialog 
        open={criteriaDialogOpen} 
        onClose={closeCriteriaDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {showCriteriaForm 
                ? (editingCriteria ? 'Edit Completion Criteria' : 'Add Completion Criteria')
                : `Completion Criteria - ${selectedActivity?.name}`
              }
            </Typography>
            {!showCriteriaForm && (
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddCriteria}
              >
                Add Criteria
              </Button>
            )}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {showCriteriaForm ? (
            // Form to add/edit criteria
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  required
                  label="Unit"
                  name="unit"
                  value={criteriaFormData.unit}
                  onChange={handleCriteriaFormChange}
                >
                  <MenuItem value="KG">Kilograms (KG)</MenuItem>
                  <MenuItem value="AREA">Area</MenuItem>
                  <MenuItem value="PLANTS">Plants</MenuItem>
                  <MenuItem value="LITERS">Liters</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Value"
                  name="value"
                  value={criteriaFormData.value}
                  onChange={handleCriteriaFormChange}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  type="date"
                  label="Start Date"
                  name="startDate"
                  value={criteriaFormData.startDate}
                  onChange={handleCriteriaFormChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="End Date"
                  name="endDate"
                  value={criteriaFormData.endDate || ''}
                  onChange={handleCriteriaFormChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={criteriaFormData.isActive}
                      onChange={handleCriteriaFormChange}
                      name="isActive"
                    />
                  }
                  label="Active"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Notes"
                  name="notes"
                  value={criteriaFormData.notes || ''}
                  onChange={handleCriteriaFormChange}
                />
              </Grid>
            </Grid>
          ) : (
            // List of criteria
            completionCriteria.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Typography color="textSecondary">
                  No completion criteria defined yet. Click "Add Criteria" to create one.
                </Typography>
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Unit</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell>Start Date</TableCell>
                    <TableCell>End Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {completionCriteria.map((criteria) => (
                    <TableRow key={criteria.id}>
                      <TableCell>{criteria.unit}</TableCell>
                      <TableCell>{criteria.value}</TableCell>
                      <TableCell>{criteria.startDate}</TableCell>
                      <TableCell>{criteria.endDate || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={criteria.isActive ? 'Active' : 'Inactive'}
                          color={criteria.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleEditCriteria(criteria)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          )}
        </DialogContent>
        <DialogActions>
          {showCriteriaForm ? (
            <>
              <Button onClick={handleCancelCriteriaForm}>Cancel</Button>
              <Button onClick={handleSaveCriteria} variant="contained">
                Save
              </Button>
            </>
          ) : (
            <Button onClick={closeCriteriaDialog}>Close</Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkActivityList;

