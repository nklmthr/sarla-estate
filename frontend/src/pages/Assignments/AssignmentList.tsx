import React, { useEffect, useState, useRef } from 'react';
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
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  Chip,
  TablePagination,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  TextField,
  Tooltip,
} from '@mui/material';
import {
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Assessment as AssessmentIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { assignmentApi } from '../../api/assignmentApi';
import { employeeApi } from '../../api/employeeApi';
import { workActivityApi } from '../../api/workActivityApi';
import { completionCriteriaApi } from '../../api/completionCriteriaApi';
import { WorkAssignment, Employee, WorkActivity, WorkActivityCompletionCriteria } from '../../types';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';

interface ActivityWithCriteria extends WorkActivity {
  activeCriteria?: WorkActivityCompletionCriteria | null;
}

interface AssignmentCell {
  assignment?: WorkAssignment;
  isEditing: boolean;
  selectedActivityId?: string;
}

const AssignmentList: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activities, setActivities] = useState<ActivityWithCriteria[]>([]);
  const [assignments, setAssignments] = useState<WorkAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Week navigation
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday
  );
  
  // Cell editing state - key is "employeeId-dateString"
  const [editingCells, setEditingCells] = useState<Map<string, AssignmentCell>>(new Map());
  
  // Completion percentage dialog
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<WorkAssignment | null>(null);
  const [completionPercentage, setCompletionPercentage] = useState<number>(0);
  const completionInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<WorkAssignment | null>(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  useEffect(() => {
    loadData();
  }, [currentWeekStart]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [employeesData, activitiesData, assignmentsData] = await Promise.all([
        employeeApi.getAllEmployees(),
        workActivityApi.getAllWorkActivities(),
        assignmentApi.getAllAssignments(),
      ]);
      
      const employeesArray = Array.isArray(employeesData) ? employeesData : [];
      const activitiesArray = Array.isArray(activitiesData) ? activitiesData : [];
      const assignmentsArray = Array.isArray(assignmentsData) ? assignmentsData : [];
      
      // Load active completion criteria for each activity
      const activitiesWithCriteria: ActivityWithCriteria[] = await Promise.all(
        activitiesArray
          .filter(a => a.status === 'ACTIVE')
          .map(async (activity) => {
            try {
              const criteria = await completionCriteriaApi.getActive(activity.id!);
              return {
                ...activity,
                activeCriteria: criteria || null,
              };
            } catch (error) {
              console.error(`Error loading criteria for activity ${activity.id}:`, error);
              return { ...activity, activeCriteria: null };
            }
          })
      );
      
      setEmployees(employeesArray);
      setActivities(activitiesWithCriteria);
      setAssignments(assignmentsArray);
      setEditingCells(new Map());
    } catch (error) {
      console.error('Error loading data:', error);
      setEmployees([]);
      setActivities([]);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const getCellKey = (employeeId: string, date: Date): string => {
    return `${employeeId}-${format(date, 'yyyy-MM-dd')}`;
  };

  const getAssignment = (employeeId: string, date: Date): WorkAssignment | undefined => {
    return assignments.find(
      (a) =>
        a.assignedEmployeeId === employeeId &&
        isSameDay(parseISO(a.assignmentDate), date)
    );
  };

  const handleAddAssignment = (employeeId: string, date: Date) => {
    const key = getCellKey(employeeId, date);
    const newCell: AssignmentCell = {
      isEditing: true,
      selectedActivityId: '',
    };
    setEditingCells(new Map(editingCells.set(key, newCell)));
  };

  const handleActivityChange = (employeeId: string, date: Date, activityId: string) => {
    const key = getCellKey(employeeId, date);
    const cell = editingCells.get(key);
    if (cell) {
      cell.selectedActivityId = activityId;
      setEditingCells(new Map(editingCells.set(key, cell)));
    }
  };

  const handleSaveAssignment = async (employeeId: string, date: Date) => {
    const key = getCellKey(employeeId, date);
    const cell = editingCells.get(key);
    
    if (!cell || !cell.selectedActivityId) return;
    
    try {
      const activity = activities.find(a => a.id === cell.selectedActivityId);
      if (!activity) return;

      const newAssignment: WorkAssignment = {
        workActivityId: activity.id,
        assignedEmployeeId: employeeId,
        assignmentDate: format(date, 'yyyy-MM-dd'),
        activityName: activity.name,
        activityDescription: activity.description,
        assignmentStatus: 'ASSIGNED',
        completionPercentage: 0,
      };

      const savedAssignment = await assignmentApi.createAssignment(newAssignment);
      
      // Update state locally instead of reloading all data
      setAssignments([...assignments, savedAssignment]);
      
      // Clear the editing cell
      const newMap = new Map(editingCells);
      newMap.delete(key);
      setEditingCells(newMap);
    } catch (error) {
      console.error('Error saving assignment:', error);
      alert('Error saving assignment. Please try again.');
    }
  };

  const handleCancelEdit = (employeeId: string, date: Date) => {
    const key = getCellKey(employeeId, date);
    const newMap = new Map(editingCells);
    newMap.delete(key);
    setEditingCells(newMap);
  };

  const handleOpenCompletionDialog = (assignment: WorkAssignment) => {
    setSelectedAssignment(assignment);
    setCompletionPercentage(assignment.completionPercentage || 0);
    setCompletionDialogOpen(true);
    // Focus input after dialog opens
    setTimeout(() => completionInputRef.current?.focus(), 100);
  };

  const handleCloseCompletionDialog = () => {
    setCompletionDialogOpen(false);
    setSelectedAssignment(null);
    setCompletionPercentage(0);
  };

  const handleSaveCompletion = async () => {
    if (!selectedAssignment?.id) return;

    try {
      const updatedAssignment = await assignmentApi.updateCompletionPercentage(
        selectedAssignment.id,
        { completionPercentage }
      );

      // Update the assignment in state
      setAssignments(assignments.map(a => 
        a.id === updatedAssignment.id ? updatedAssignment : a
      ));

      handleCloseCompletionDialog();
    } catch (error) {
      console.error('Error updating completion percentage:', error);
      alert('Error updating completion percentage. Please try again.');
    }
  };

  const handleCompletionSliderChange = (_event: Event, newValue: number | number[]) => {
    setCompletionPercentage(newValue as number);
  };

  const handleCompletionInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value === '' ? 0 : Number(event.target.value);
    setCompletionPercentage(Math.min(100, Math.max(0, value)));
  };

  const handleOpenDeleteDialog = (assignment: WorkAssignment) => {
    setAssignmentToDelete(assignment);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setAssignmentToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!assignmentToDelete?.id) return;

    try {
      await assignmentApi.deleteAssignment(assignmentToDelete.id);

      // Remove the assignment from state
      setAssignments(assignments.filter(a => a.id !== assignmentToDelete.id));

      handleCloseDeleteDialog();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      alert('Error deleting assignment. Please try again.');
    }
  };

  const handlePreviousWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedEmployees = employees.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const renderCell = (employee: Employee, date: Date) => {
    const key = getCellKey(employee.id!, date);
    const editingCell = editingCells.get(key);
    const assignment = getAssignment(employee.id!, date);

    // If editing
    if (editingCell?.isEditing) {
      return (
        <TableCell key={key} sx={{ minWidth: 180, p: 1 }}>
          <Box>
            <FormControl fullWidth size="small">
              <Select
                value={editingCell.selectedActivityId || ''}
                onChange={(e) => handleActivityChange(employee.id!, date, e.target.value)}
                displayEmpty
              >
                <MenuItem value="">Select Activity</MenuItem>
                {activities.map((activity) => (
                  <MenuItem key={activity.id} value={activity.id}>
                    {activity.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {editingCell.selectedActivityId && (
              <Box sx={{ mt: 1 }}>
                {(() => {
                  const selectedActivity = activities.find(
                    (a) => a.id === editingCell.selectedActivityId
                  );
                  if (selectedActivity?.activeCriteria) {
                    return (
                      <Typography variant="caption" color="text.secondary">
                        Target: {selectedActivity.activeCriteria.value}{' '}
                        {selectedActivity.activeCriteria.unit}
                      </Typography>
                    );
                  }
                  return (
                    <Typography variant="caption" color="warning.main">
                      No active criteria
                    </Typography>
                  );
                })()}
              </Box>
            )}
            <Box sx={{ mt: 1, display: 'flex', gap: 0.5 }}>
              <IconButton
                size="small"
                onClick={() => handleSaveAssignment(employee.id!, date)}
                color="primary"
                disabled={!editingCell.selectedActivityId}
              >
                <SaveIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleCancelEdit(employee.id!, date)}
                color="error"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </TableCell>
      );
    }

    // If assignment exists
    if (assignment) {
      const activity = activities.find((a) => a.id === assignment.workActivityId);
      return (
        <TableCell key={key} sx={{ minWidth: 180, p: 1 }}>
          <Paper elevation={1} sx={{ p: 1, bgcolor: 'action.hover' }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Typography variant="body2" fontWeight="bold">
                {assignment.activityName}
              </Typography>
              <Box display="flex" gap={0.5}>
                <Tooltip title="Evaluate work against criteria" arrow>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenCompletionDialog(assignment)}
                    color="primary"
                    sx={{ mt: -0.5 }}
                  >
                    <AssessmentIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete assignment" arrow>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDeleteDialog(assignment)}
                    color="error"
                    sx={{ mt: -0.5, mr: -0.5 }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            {activity?.activeCriteria && (
              <Typography variant="caption" color="text.secondary" display="block">
                Target: {activity.activeCriteria.value} {activity.activeCriteria.unit}
              </Typography>
            )}
            <Box sx={{ mt: 0.5 }}>
              <Chip
                label={assignment.assignmentStatus?.replace('_', ' ')}
                size="small"
                color={
                  assignment.assignmentStatus === 'COMPLETED'
                    ? 'success'
                    : assignment.assignmentStatus === 'IN_PROGRESS'
                    ? 'warning'
                    : 'info'
                }
              />
            </Box>
            {assignment.completionPercentage !== undefined && (
              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                Evaluated: {assignment.completionPercentage}%
              </Typography>
            )}
          </Paper>
        </TableCell>
      );
    }

    // Empty cell - reduced width to fit more on screen
    return (
      <TableCell key={key} sx={{ minWidth: 100, maxWidth: 100, p: 1 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => handleAddAssignment(employee.id!, date)}
          fullWidth
        >
          Add
        </Button>
      </TableCell>
    );
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
        <Typography variant="h4">All Assignments</Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={handlePreviousWeek} color="primary">
            <PrevIcon />
          </IconButton>
          <Typography variant="h6">
            Week of {format(currentWeekStart, 'MMM dd, yyyy')}
          </Typography>
          <IconButton onClick={handleNextWeek} color="primary">
            <NextIcon />
          </IconButton>
        </Box>
      </Box>

      <Card>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', minWidth: 150, position: 'sticky', left: 0, bgcolor: 'background.paper', zIndex: 2 }}>
                  Employee
                </TableCell>
                {weekDays.map((day) => (
                  <TableCell key={day.toISOString()} align="center" sx={{ fontWeight: 'bold' }}>
                    <Box>
                      <Typography variant="body2">{format(day, 'EEE')}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(day, 'MMM dd')}
                      </Typography>
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="textSecondary">No employees found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedEmployees.map((employee) => (
                  <TableRow key={employee.id} hover>
                    <TableCell sx={{ fontWeight: 'bold', position: 'sticky', left: 0, bgcolor: 'background.paper', zIndex: 1 }}>
                      {employee.name}
                    </TableCell>
                    {weekDays.map((day) => renderCell(employee, day))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={employees.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      {/* Work Evaluation Dialog */}
      <Dialog 
        open={completionDialogOpen} 
        onClose={handleCloseCompletionDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Evaluate Work Against Criteria
          {selectedAssignment && (
            <Typography variant="body2" color="text.secondary">
              {selectedAssignment.activityName}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Rate how much of the completion criteria has been achieved
            </Typography>
            <Typography gutterBottom fontWeight="medium">
              Achievement Level: {completionPercentage}%
            </Typography>
            <Slider
              value={completionPercentage}
              onChange={handleCompletionSliderChange}
              aria-labelledby="evaluation-slider"
              valueLabelDisplay="auto"
              step={5}
              marks
              min={0}
              max={100}
              sx={{ mb: 3 }}
            />
            <TextField
              inputRef={completionInputRef}
              fullWidth
              label="Achievement Percentage"
              type="number"
              value={completionPercentage}
              onChange={handleCompletionInputChange}
              InputProps={{
                endAdornment: '%',
                inputProps: { min: 0, max: 100, step: 1 }
              }}
              helperText="Evaluate work completed against the defined criteria (0-100%)"
              autoFocus
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCompletionDialog} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleSaveCompletion} 
            variant="contained" 
            color="primary"
            startIcon={<SaveIcon />}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Assignment</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this assignment?
          </Typography>
          {assignmentToDelete && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="body2" fontWeight="bold">
                {assignmentToDelete.activityName}
              </Typography>
              <Typography variant="caption" display="block">
                Date: {assignmentToDelete.assignmentDate}
              </Typography>
              <Typography variant="caption" display="block">
                Status: {assignmentToDelete.assignmentStatus?.replace('_', ' ')}
              </Typography>
              {assignmentToDelete.completionPercentage !== undefined && (
                <Typography variant="caption" display="block">
                  Evaluated: {assignmentToDelete.completionPercentage}%
                </Typography>
              )}
            </Box>
          )}
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            variant="contained" 
            color="error"
            startIcon={<DeleteIcon />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssignmentList;
