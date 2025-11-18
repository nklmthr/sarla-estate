import React, { useEffect, useState } from 'react';
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
} from '@mui/material';
import {
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Close as CloseIcon,
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
        priority: 'MEDIUM',
        completionPercentage: 0,
      };

      await assignmentApi.createAssignment(newAssignment);
      await loadData();
    } catch (error) {
      console.error('Error saving assignment:', error);
    }
  };

  const handleCancelEdit = (employeeId: string, date: Date) => {
    const key = getCellKey(employeeId, date);
    const newMap = new Map(editingCells);
    newMap.delete(key);
    setEditingCells(newMap);
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
            <Typography variant="body2" fontWeight="bold">
              {assignment.activityName}
            </Typography>
            {activity?.activeCriteria && (
              <Typography variant="caption" color="text.secondary">
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
                {assignment.completionPercentage}% complete
              </Typography>
            )}
          </Paper>
        </TableCell>
      );
    }

    // Empty cell
    return (
      <TableCell key={key} sx={{ minWidth: 180, p: 1 }}>
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
                  <TableCell key={day.toISOString()} align="center" sx={{ fontWeight: 'bold', minWidth: 180 }}>
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
    </Box>
  );
};

export default AssignmentList;
