import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Rule as RuleIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { workActivityApi } from '../../api/workActivityApi';
import { completionCriteriaApi } from '../../api/completionCriteriaApi';
import { WorkActivity, WorkActivityCompletionCriteria } from '../../types';
import { useError } from '../../contexts/ErrorContext';

const WorkActivityList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess } = useError();
  const [activities, setActivities] = useState<WorkActivity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<WorkActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');
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
    notes: '',
  });
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [deleteCriteriaDialogOpen, setDeleteCriteriaDialogOpen] = useState(false);
  const [criteriaToDelete, setCriteriaToDelete] = useState<WorkActivityCompletionCriteria | null>(null);

  // Reload activities whenever the page is navigated to
  useEffect(() => {
    loadActivities();
  }, [location.pathname]); // Reload when route changes

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
      // Error handled by global interceptor
      setActivities([]);
      setFilteredActivities([]);
    } finally {
      setLoading(false);
    }
  };

  // Reload activities in background without showing loading spinner
  const reloadActivitiesInBackground = async () => {
    try {
      const data = await workActivityApi.getAllWorkActivities();
      const activitiesArray = Array.isArray(data) ? data : [];
      setActivities(activitiesArray);
      setFilteredActivities(activitiesArray);
    } catch (error) {
      // Error handled by global interceptor
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
      showSuccess('Work activity deleted successfully!');
      setDeleteDialogOpen(false);
      setActivityToDelete(null);
    } catch (error) {
      // Error handled by global interceptor
      setDeleteDialogOpen(false);
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
      // Error handled by global interceptor
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

    // Capture activity ID before async operations
    const activityId = selectedActivity.id;

    try {
      if (editingCriteria?.id) {
        // Update existing criteria
        await completionCriteriaApi.update(activityId, editingCriteria.id, criteriaFormData);
      } else {
        // Create new criteria
        await completionCriteriaApi.create(activityId, criteriaFormData);
      }
      
      // Close form and show success dialog (blocking)
      setShowCriteriaForm(false);
      setEditingCriteria(null);
      resetCriteriaForm();
      setSuccessDialogOpen(true);
    } catch (error) {
      // Error handled by global interceptor
    }
  };

  const handleSuccessDialogClose = async () => {
    setSuccessDialogOpen(false);
    
    // Now reload the criteria list after user acknowledges success
    if (selectedActivity?.id) {
      const data = await completionCriteriaApi.getAllByActivity(selectedActivity.id);
      setCompletionCriteria(Array.isArray(data) ? data : []);
      
      // ✨ Reload activities list in background to update ACTIVE/INACTIVE status
      reloadActivitiesInBackground();
    }
  };

  const handleDeleteCriteria = async () => {
    if (!selectedActivity?.id || !criteriaToDelete?.id) return;

    try {
      await completionCriteriaApi.delete(selectedActivity.id, criteriaToDelete.id);
      
      // Close delete dialog
      setDeleteCriteriaDialogOpen(false);
      setCriteriaToDelete(null);
      
      // Reload criteria list
      const data = await completionCriteriaApi.getAllByActivity(selectedActivity.id);
      setCompletionCriteria(Array.isArray(data) ? data : []);
      

      // Reload activities list in background to update ACTIVE/INACTIVE status
      reloadActivitiesInBackground();
      
      showSuccess('Completion criteria deleted successfully!');
    } catch (error) {
      // Error handled by global interceptor
    }
  };

  const openDeleteCriteriaDialog = (criteria: WorkActivityCompletionCriteria) => {
    setCriteriaToDelete(criteria);
    setDeleteCriteriaDialogOpen(true);
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
                        color="primary"
                        title="Manage Completion Criteria"
                      >
                        <RuleIcon />
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
            <Box>
              <Typography variant="h6">
                {showCriteriaForm 
                  ? (editingCriteria ? 'Edit Completion Criteria' : 'Add Completion Criteria')
                  : 'Completion Criteria'
                }
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Activity: {selectedActivity?.name}
              </Typography>
            </Box>
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
                <Box sx={{ position: 'relative' }}>
                  <TextField
                    fullWidth
                    type="date"
                    label="End Date"
                    name="endDate"
                    value={criteriaFormData.endDate || ''}
                    onChange={handleCriteriaFormChange}
                    InputLabelProps={{ shrink: true }}
                    helperText="Leave empty for ongoing criteria"
                  />
                  {criteriaFormData.endDate && (
                    <IconButton
                      size="small"
                      onClick={() => setCriteriaFormData(prev => ({ ...prev, endDate: '' }))}
                      title="Clear end date (ongoing criteria)"
                      sx={{
                        position: 'absolute',
                        right: 35,
                        top: 14,
                        bgcolor: 'background.paper',
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
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
                          title="Edit Criteria"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => openDeleteCriteriaDialog(criteria)}
                          color="error"
                          title="Delete Criteria"
                        >
                          <DeleteIcon />
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

      {/* Success Confirmation Dialog */}
      <Dialog open={successDialogOpen} onClose={handleSuccessDialogClose}>
        <DialogTitle>Success</DialogTitle>
        <DialogContent>
          <Typography>
            Completion criteria saved successfully!
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSuccessDialogClose} variant="contained" color="primary">
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Criteria Confirmation Dialog */}
      <Dialog open={deleteCriteriaDialogOpen} onClose={() => setDeleteCriteriaDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this completion criteria?
          </Typography>
          {criteriaToDelete && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="body2"><strong>Unit:</strong> {criteriaToDelete.unit}</Typography>
              <Typography variant="body2"><strong>Value:</strong> {criteriaToDelete.value}</Typography>
              <Typography variant="body2"><strong>Start Date:</strong> {criteriaToDelete.startDate}</Typography>
              <Typography variant="body2"><strong>End Date:</strong> {criteriaToDelete.endDate || 'Ongoing'}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteCriteriaDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteCriteria} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default WorkActivityList;

