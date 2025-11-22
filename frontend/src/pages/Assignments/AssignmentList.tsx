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
  TextField,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Assessment as AssessmentIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { assignmentApi } from '../../api/assignmentApi';
import { employeeApi } from '../../api/employeeApi';
import { workActivityApi } from '../../api/workActivityApi';
import { completionCriteriaApi } from '../../api/completionCriteriaApi';
import { unitOfMeasureApi, UnitOfMeasure } from '../../api/unitOfMeasureApi';
import { WorkAssignment, Employee, WorkActivity, WorkActivityCompletionCriteria } from '../../types';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { useError } from '../../contexts/ErrorContext';

interface ActivityWithCriteria extends WorkActivity {
  activeCriteria?: WorkActivityCompletionCriteria | null;
}

interface AssignmentCell {
  assignment?: WorkAssignment;
  isEditing: boolean;
  selectedActivityId?: string;
}

const AssignmentList: React.FC = () => {
  const { showError, showSuccess, showWarning } = useError();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activities, setActivities] = useState<ActivityWithCriteria[]>([]);
  const [assignments, setAssignments] = useState<WorkAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [unitsOfMeasure, setUnitsOfMeasure] = useState<UnitOfMeasure[]>([]);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalEmployees, setTotalEmployees] = useState(0);

  // Search
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');

  // Debounce search term
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 400);

    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);

  // Week navigation
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday
  );

  // Cell editing state - key is "employeeId-dateString"
  const [editingCells, setEditingCells] = useState<Map<string, AssignmentCell>>(new Map());

  // Completion dialog
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<WorkAssignment | null>(null);
  const [actualValue, setActualValue] = useState<number>(0);
  const completionInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<WorkAssignment | null>(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  // Load activities and units once on mount
  useEffect(() => {
    loadActivities();
    loadUnitsOfMeasure();
  }, []);

  // Load employees and assignments when page, rowsPerPage, week, or search changes
  // Load employees and assignments when page, rowsPerPage, week, or debounced search changes
  useEffect(() => {
    loadData();
  }, [currentWeekStart, page, rowsPerPage, debouncedSearchTerm]);

  const loadActivities = async () => {
    try {
      const activitiesData = await workActivityApi.getAllWorkActivities();
      const activitiesArray = Array.isArray(activitiesData) ? activitiesData : [];

      // Load active completion criteria for ALL activities (including inactive)
      const activitiesWithCriteria: ActivityWithCriteria[] = await Promise.all(
        activitiesArray.map(async (activity) => {
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

      setActivities(activitiesWithCriteria);
    } catch (error) {
      console.error('Error loading activities:', error);
      setActivities([]);
    }
  };

  const loadUnitsOfMeasure = async () => {
    try {
      const data = await unitOfMeasureApi.getActiveUnits();
      setUnitsOfMeasure(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading units of measure:', error);
      setUnitsOfMeasure([]);
    }
  };

  const getUnitName = (unitCode: string): string => {
    const unit = unitsOfMeasure.find(u => u.code === unitCode);
    return unit ? unit.name : unitCode;
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const weekStart = format(currentWeekStart, 'yyyy-MM-dd');
      const weekEnd = format(addDays(currentWeekStart, 6), 'yyyy-MM-dd');

      // Only search if we have at least 2 characters or if it's empty (to reset)
      // But if it's empty, the if check below will be false, so we go to else block.
      // If it's 1 char, we don't want to search yet, so we might need to handle that.
      // However, the requirement says "start searching only if 2 or more characters are entered".
      // So if length is 1, we should probably treat it as no search or just not trigger loadData?
      // Actually, loadData is triggered by debouncedSearchTerm.
      // So we can check length here.

      const shouldSearch = debouncedSearchTerm.trim().length >= 2;

      if (shouldSearch) {
        // When searching, fetch all employees and assignments for filtering
        const allEmployees = await employeeApi.getAllEmployees();
        const employeeIds = allEmployees.map(emp => emp.id!);
        const assignmentsData = await assignmentApi.getAssignmentsByDateRange(
          weekStart,
          weekEnd,
          employeeIds
        );

        setEmployees(allEmployees);
        setTotalEmployees(allEmployees.length);
        setAssignments(assignmentsData);
      } else if (debouncedSearchTerm.trim().length === 0) {
        // When not searching (empty), use server-side pagination
        const paginatedData = await employeeApi.getEmployeesPaginated(page, rowsPerPage);
        const employeesArray = paginatedData.content;
        setTotalEmployees(paginatedData.totalElements);

        // Get employee IDs from the current page
        const employeeIds = employeesArray.map(emp => emp.id!);

        // Fetch assignments only for the current week and current page employees
        const assignmentsData = await assignmentApi.getAssignmentsByDateRange(
          weekStart,
          weekEnd,
          employeeIds
        );

        setEmployees(employeesArray);
        setAssignments(assignmentsData);
      }

      setEditingCells(new Map());
    } catch (error) {
      console.error('Error loading data:', error);
      setEmployees([]);
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

      // Validate that activity has active completion criteria before saving
      if (!activity.activeCriteria) {
        showWarning(
          `Cannot create assignment: "${activity.name}" does not have active completion criteria. ` +
          'Please define completion criteria for this activity before creating assignments.'
        );
        return;
      }

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
      // Error handled by global interceptor
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
    setActualValue(assignment.actualValue || 0);
    setCompletionDialogOpen(true);
    // Focus and select input after dialog opens so typing replaces the value
    setTimeout(() => {
      completionInputRef.current?.focus();
      completionInputRef.current?.select();
    }, 100);
  };

  const handleCloseCompletionDialog = () => {
    setCompletionDialogOpen(false);
    setSelectedAssignment(null);
    setActualValue(0);
  };

  const handleSaveCompletion = async () => {
    if (!selectedAssignment?.id) return;

    try {
      const updatedAssignment = await assignmentApi.updateCompletionPercentage(
        selectedAssignment.id,
        { actualValue }
      );

      // Update the assignment in state
      setAssignments(assignments.map(a =>
        a.id === updatedAssignment.id ? updatedAssignment : a
      ));

      handleCloseCompletionDialog();
    } catch (error) {
      // Error handled by global interceptor
    }
  };

  const handleMarkComplete = async () => {
    if (!selectedAssignment?.id) return;

    // Get the activity's completion criteria to set actualValue = criteriaValue
    const activity = activities.find(a => a.id === selectedAssignment.workActivityId);
    const criteriaValue = activity?.activeCriteria?.value || 100;

    try {
      const updatedAssignment = await assignmentApi.updateCompletionPercentage(
        selectedAssignment.id,
        { actualValue: criteriaValue }
      );

      // Update the assignment in state
      setAssignments(assignments.map(a =>
        a.id === updatedAssignment.id ? updatedAssignment : a
      ));

      handleCloseCompletionDialog();
    } catch (error) {
      // Error handled by global interceptor
    }
  };

  const handleActualValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value === '' ? 0 : Number(event.target.value);
    setActualValue(Math.max(0, value));
  };

  const handleCompletionDialogKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSaveCompletion();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      handleCloseCompletionDialog();
    }
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

      showSuccess('Assignment deleted successfully!');
      handleCloseDeleteDialog();
    } catch (error) {
      // Error handled by global interceptor
      handleCloseDeleteDialog();
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

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0); // Reset to first page when searching
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setPage(0);
  };

  // Filter employees based on search term (only when searching)
  const filteredEmployees = debouncedSearchTerm.trim().length >= 2
    ? employees.filter((employee) => {
      const lowerSearchTerm = debouncedSearchTerm.toLowerCase();

      // Search by employee name
      if (employee.name.toLowerCase().includes(lowerSearchTerm)) {
        return true;
      }

      // Search by activity name or status in any assignment for this employee
      const hasMatchingAssignment = assignments.some((assignment) => {
        if (assignment.assignedEmployeeId !== employee.id) return false;

        return (
          assignment.activityName.toLowerCase().includes(lowerSearchTerm) ||
          assignment.assignmentStatus?.toLowerCase().includes(lowerSearchTerm)
        );
      });

      return hasMatchingAssignment;
    })
    : employees;

  // When searching, do client-side pagination on filtered results
  // When not searching, employees are already paginated from server
  const paginatedEmployees = debouncedSearchTerm.trim().length >= 2
    ? filteredEmployees.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : employees;

  const renderCell = (employee: Employee, date: Date) => {
    const key = getCellKey(employee.id!, date);
    const editingCell = editingCells.get(key);
    const assignment = getAssignment(employee.id!, date);

    // If editing
    if (editingCell?.isEditing) {
      return (
        <TableCell key={key} sx={{ width: 140, minWidth: 140, maxWidth: 140, p: 0.5 }}>
          <Box>
            <FormControl fullWidth size="small">
              <Select
                value={editingCell.selectedActivityId || ''}
                onChange={(e) => handleActivityChange(employee.id!, date, e.target.value)}
                displayEmpty
              >
                <MenuItem value="">Select Activity</MenuItem>
                {activities.map((activity) => (
                  <MenuItem
                    key={activity.id}
                    value={activity.id}
                    sx={{
                      color: activity.activeCriteria ? 'inherit' : 'error.main',
                    }}
                  >
                    {activity.name}
                    {!activity.activeCriteria && ' ⚠️'}
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
                    <Typography variant="caption" color="error.main">
                      ⚠️ Cannot assign: This activity does not have active completion criteria
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
                disabled={
                  !editingCell.selectedActivityId ||
                  !activities.find((a) => a.id === editingCell.selectedActivityId)?.activeCriteria
                }
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
      const hasActiveCriteria = !!activity?.activeCriteria;
      const isCompleted = assignment.assignmentStatus === 'COMPLETED';
      const isLocked = assignment.isEditable === false; // Assignment is locked if isEditable is explicitly false

      return (
        <TableCell key={key} sx={{ width: 140, minWidth: 140, maxWidth: 140, p: 0.5 }}>
          <Paper
            elevation={1}
            sx={{
              p: 0.75,
              bgcolor: isLocked ? 'grey.200' : (!hasActiveCriteria && !isCompleted ? 'error.light' : 'action.hover'),
              position: 'relative',
              border: isLocked ? '2px solid' : (!hasActiveCriteria && !isCompleted ? '1px solid' : 'none'),
              borderColor: isLocked ? 'warning.main' : 'error.main',
              opacity: isLocked ? 0.7 : 1,
            }}
          >
            {isLocked && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 4,
                  left: 4,
                  zIndex: 20,
                  display: 'flex',
                  alignItems: 'center',
                  bgcolor: 'warning.main',
                  color: 'warning.contrastText',
                  px: 0.5,
                  py: 0.25,
                  borderRadius: 0.5,
                  fontSize: '0.65rem',
                }}
              >
                <LockIcon sx={{ fontSize: 12, mr: 0.25 }} />
                <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 600 }}>
                  LOCKED
                </Typography>
              </Box>
            )}
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Typography
                variant="body2"
                fontWeight="bold"
                sx={{
                  fontSize: '0.8125rem',
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                  mr: 0.5
                }}
                title={assignment.activityName}
              >
                {assignment.activityName}
              </Typography>
              <Box display="flex" gap={0} sx={{ position: 'relative', zIndex: 10, flexShrink: 0 }}>
                <Tooltip
                  title={
                    isLocked 
                      ? "Assignment is locked (included in payment)" 
                      : (!hasActiveCriteria && !isCompleted 
                          ? "Cannot evaluate: No active criteria" 
                          : "Evaluate")
                  }
                  arrow
                >
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenCompletionDialog(assignment)}
                      color="primary"
                      sx={{ p: 0.5 }}
                      disabled={isLocked || (!hasActiveCriteria && !isCompleted)}
                    >
                      <AssessmentIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip 
                  title={isLocked ? "Cannot delete: Assignment is locked (included in payment)" : "Delete Assignment"} 
                  arrow
                >
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDeleteDialog(assignment)}
                      color="error"
                      sx={{ p: 0.5 }}
                      disabled={isLocked}
                    >
                      <DeleteIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            </Box>
            {isLocked && assignment.includedInPaymentId && (
              <Typography variant="caption" color="warning.dark" display="block" sx={{ fontSize: '0.65rem', fontWeight: 600, mt: 0.5 }}>
                 In Payment: {assignment.includedInPaymentId.substring(0, 8)}...
              </Typography>
            )}
            {!hasActiveCriteria && !isCompleted && (
              <Typography variant="caption" color="error.dark" display="block" sx={{ fontSize: '0.65rem', fontWeight: 600, mt: 0.25 }}>
                ⚠️ No active criteria - please delete
              </Typography>
            )}
            {activity?.activeCriteria && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.7rem' }}>
                Target: {activity.activeCriteria.value} {getUnitName(activity.activeCriteria.unit)}
              </Typography>
            )}
            <Box sx={{ mt: 0.25 }}>
              <Chip
                label={assignment.assignmentStatus?.replace('_', ' ')}
                size="small"
                sx={{ height: 20, fontSize: '0.7rem' }}
                color={
                  assignment.assignmentStatus === 'COMPLETED'
                    ? 'success'
                    : 'info'
                }
              />
            </Box>
            {assignment.actualValue !== undefined && assignment.actualValue !== null && (
              <Typography variant="caption" display="block" sx={{ mt: 0.25, fontSize: '0.7rem' }}>
                Done: {assignment.actualValue} {activity?.activeCriteria ? getUnitName(activity.activeCriteria.unit) : ''} ({(assignment.completionPercentage || 0).toFixed(2)}%)
              </Typography>
            )}
          </Paper>
        </TableCell>
      );
    }

    // Empty cell - fixed width for consistency
    return (
      <TableCell key={key} sx={{ width: 140, minWidth: 140, maxWidth: 140, p: 0.5 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon sx={{ fontSize: 16 }} />}
          onClick={() => handleAddAssignment(employee.id!, date)}
          fullWidth
          sx={{ fontSize: '0.75rem', py: 0.5 }}
        >
          Add
        </Button>
      </TableCell>
    );
  };

  if (loading && employees.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mx: -1 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">All Assignments</Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton onClick={handlePreviousWeek} color="primary" size="small">
            <PrevIcon />
          </IconButton>
          <Typography variant="h6" sx={{ minWidth: 200, textAlign: 'center' }}>
            Week of {format(currentWeekStart, 'MMM dd, yyyy')}
          </Typography>
          <IconButton onClick={handleNextWeek} color="primary" size="small">
            <NextIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search by employee name, activity name, or status..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
            endAdornment: searchTerm && (
              <IconButton size="small" onClick={handleClearSearch}>
                <ClearIcon fontSize="small" />
              </IconButton>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'background.paper',
            },
          }}
        />
        {searchTerm && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            Found {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''}
          </Typography>
        )}
      </Box>

      <Card>
        {loading && <LinearProgress />}
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', width: 100, maxWidth: 100, position: 'sticky', left: 0, bgcolor: 'background.paper', zIndex: 2, p: 1 }}>
                  Employee
                </TableCell>
                {weekDays.map((day) => (
                  <TableCell key={day.toISOString()} align="center" sx={{ fontWeight: 'bold', width: 140, minWidth: 140, maxWidth: 140, p: 1 }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>{format(day, 'EEE')}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
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
                    <TableCell sx={{
                      fontWeight: 'bold',
                      position: 'sticky',
                      left: 0,
                      bgcolor: 'background.paper',
                      zIndex: 1,
                      width: 100,
                      maxWidth: 100,
                      p: 1,
                      wordWrap: 'break-word',
                      whiteSpace: 'normal',
                      lineHeight: 1.2,
                      fontSize: '0.875rem'
                    }}>
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
          count={debouncedSearchTerm.trim().length >= 2 ? filteredEmployees.length : totalEmployees}
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
        onKeyDown={handleCompletionDialogKeyDown}
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
            {(() => {
              const activity = activities.find(a => a.id === selectedAssignment?.workActivityId);
              const criteria = activity?.activeCriteria;
              const calculatedPercentage = criteria?.value
                ? Math.round((actualValue / criteria.value) * 100)
                : 0;

              return (
                <>
                  {criteria && (
                    <Box sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Typography variant="body2" fontWeight="medium" gutterBottom>
                        Completion Criteria:
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {criteria.value} {getUnitName(criteria.unit)}
                      </Typography>
                    </Box>
                  )}

                  <TextField
                    inputRef={completionInputRef}
                    fullWidth
                    label="Actual Value Achieved"
                    type="number"
                    value={actualValue}
                    onChange={handleActualValueChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveCompletion();
                      }
                    }}
                    InputProps={{
                      endAdornment: criteria ? getUnitName(criteria.unit) : '',
                      inputProps: { min: 0, step: 0.1 }
                    }}
                    helperText="Enter the actual value of work completed (Press Enter to save)"
                    autoFocus
                    sx={{ mb: 3 }}
                  />

                  {criteria && (
                    <Box sx={{ p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Calculated Completion Percentage:
                      </Typography>
                      <Typography variant="h5" color="info.main" fontWeight="bold">
                        {calculatedPercentage}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ({actualValue} / {criteria.value} {criteria.unit})
                      </Typography>
                    </Box>
                  )}
                </>
              );
            })()}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCompletionDialog} color="inherit">
            Cancel
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button
            onClick={handleMarkComplete}
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
          >
            Mark 100% Complete
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
