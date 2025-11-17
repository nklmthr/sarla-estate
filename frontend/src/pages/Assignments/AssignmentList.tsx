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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  LinearProgress,
  Stack,
  Autocomplete,
  Tooltip,
} from '@mui/material';
import {
  PersonAdd as AssignIcon,
  PersonRemove as UnassignIcon,
  Check as CompleteIcon,
  Edit as EditIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { assignmentApi } from '../../api/assignmentApi';
import { employeeApi } from '../../api/employeeApi';
import { WorkAssignment, Employee } from '../../types';
import { format } from 'date-fns';

const AssignmentList: React.FC = () => {
  const navigate = useNavigate();
  
  const [assignments, setAssignments] = useState<WorkAssignment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [employeeFilter, setEmployeeFilter] = useState<Employee | null>(null);
  
  // Dialog states
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<WorkAssignment | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [completionPercentage, setCompletionPercentage] = useState<number>(100);
  const [actualHours, setActualHours] = useState<number>(0);
  const [completionNotes, setCompletionNotes] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterAssignments();
  }, [statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assignmentsData, employeesData] = await Promise.all([
        assignmentApi.getAllAssignments(),
        employeeApi.getAllEmployees(),
      ]);
      
      const assignmentsArray = Array.isArray(assignmentsData) ? assignmentsData : [];
      const employeesArray = Array.isArray(employeesData) ? employeesData : [];
      
      setAssignments(assignmentsArray);
      setEmployees(employeesArray.filter(e => e.status === 'ACTIVE'));
    } catch (error) {
      console.error('Error loading data:', error);
      setAssignments([]);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAssignments = () => {
    // This would filter assignments based on status
    // For now, we'll just trigger a re-render
  };

  const openAssignDialog = (assignment: WorkAssignment) => {
    setSelectedAssignment(assignment);
    setSelectedEmployeeId('');
    setAssignDialogOpen(true);
  };

  const openCompleteDialog = (assignment: WorkAssignment) => {
    setSelectedAssignment(assignment);
    setCompletionPercentage(assignment.completionPercentage || 100);
    setActualHours(assignment.estimatedDurationHours || 0);
    setCompletionNotes('');
    setCompleteDialogOpen(true);
  };

  const openProgressDialog = (assignment: WorkAssignment) => {
    setSelectedAssignment(assignment);
    setCompletionPercentage(assignment.completionPercentage || 0);
    setProgressDialogOpen(true);
  };

  const handleUpdateProgress = async () => {
    if (!selectedAssignment) return;

    try {
      await assignmentApi.updateCompletionPercentage(selectedAssignment.id!, {
        completionPercentage,
      });
      await loadData();
      setProgressDialogOpen(false);
      setSelectedAssignment(null);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleAssign = async () => {
    if (!selectedAssignment || !selectedEmployeeId) return;

    try {
      await assignmentApi.assignToEmployee(selectedAssignment.id!, { employeeId: selectedEmployeeId });
      await loadData();
      setAssignDialogOpen(false);
      setSelectedAssignment(null);
      setSelectedEmployeeId('');
    } catch (error) {
      console.error('Error assigning work:', error);
    }
  };

  const handleUnassign = async (assignmentId: string) => {
    try {
      await assignmentApi.unassignFromEmployee(assignmentId);
      await loadData();
    } catch (error) {
      console.error('Error unassigning work:', error);
    }
  };

  const handleComplete = async () => {
    if (!selectedAssignment) return;

    try {
      await assignmentApi.markAsCompleted(selectedAssignment.id!, {
        completionPercentage,
        actualDurationHours: actualHours,
        completionNotes,
      });
      await loadData();
      setCompleteDialogOpen(false);
      setSelectedAssignment(null);
    } catch (error) {
      console.error('Error completing assignment:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UNASSIGNED':
        return 'default';
      case 'ASSIGNED':
        return 'info';
      case 'IN_PROGRESS':
        return 'warning';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      case 'RESCHEDULED':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'default';
      case 'MEDIUM':
        return 'info';
      case 'HIGH':
        return 'warning';
      case 'URGENT':
        return 'error';
      default:
        return 'default';
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    // Status filter
    if (statusFilter !== 'ALL' && assignment.assignmentStatus !== statusFilter) {
      return false;
    }
    
    // Date filter
    if (dateFilter && format(new Date(assignment.assignmentDate), 'yyyy-MM-dd') !== dateFilter) {
      return false;
    }
    
    // Employee filter
    if (employeeFilter && assignment.employee?.id !== employeeFilter.id) {
      return false;
    }
    
    return true;
  });

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
        <Typography variant="h4">
          All Assignments
        </Typography>
      </Box>

      <Card>
        <Box p={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={statusFilter}
                label="Filter by Status"
                onChange={(e) => setStatusFilter(e.target.value)}
                size="small"
              >
                <MenuItem value="ALL">All</MenuItem>
                <MenuItem value="UNASSIGNED">Unassigned</MenuItem>
                <MenuItem value="ASSIGNED">Assigned</MenuItem>
                <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
              </Select>
            </FormControl>

            <TextField
              type="date"
              label="Filter by Date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{ minWidth: 200 }}
            />

            <Autocomplete
              value={employeeFilter}
              onChange={(_, newValue) => setEmployeeFilter(newValue)}
              options={employees}
              getOptionLabel={(option) => option.name}
              renderInput={(params) => (
                <TextField {...params} label="Filter by Employee" size="small" />
              )}
              sx={{ minWidth: 250 }}
            />

            {(statusFilter !== 'ALL' || dateFilter || employeeFilter) && (
              <Button
                variant="outlined"
                onClick={() => {
                  setStatusFilter('ALL');
                  setDateFilter('');
                  setEmployeeFilter(null);
                }}
                size="small"
              >
                Clear Filters
              </Button>
            )}
          </Stack>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Activity</TableCell>
                <TableCell>Shift</TableCell>
                <TableCell>Employee</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Completion %</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAssignments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="textSecondary">No assignments found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAssignments.map((assignment) => (
                  <TableRow key={assignment.id} hover>
                    <TableCell>
                      {format(new Date(assignment.assignmentDate), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell><strong>{assignment.activityName}</strong></TableCell>
                    <TableCell>
                      <Chip 
                        label={assignment.workShift?.replace('_', ' ')} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      {assignment.employee?.name || '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={assignment.assignmentStatus?.replace('_', ' ')}
                        color={getStatusColor(assignment.assignmentStatus || '')}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={assignment.priority}
                        color={getPriorityColor(assignment.priority || '')}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: '100%', maxWidth: 100 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={assignment.completionPercentage || 0} 
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                        <Typography variant="body2" sx={{ minWidth: 35 }}>
                          {assignment.completionPercentage || 0}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      {assignment.assignmentStatus === 'UNASSIGNED' && (
                        <Tooltip title="Assign to Employee">
                          <IconButton
                            size="small"
                            onClick={() => openAssignDialog(assignment)}
                            color="primary"
                          >
                            <AssignIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {(assignment.assignmentStatus === 'ASSIGNED' || assignment.assignmentStatus === 'IN_PROGRESS') && (
                        <>
                          <Tooltip title="Update Progress %">
                            <IconButton
                              size="small"
                              onClick={() => openProgressDialog(assignment)}
                              color="info"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Unassign">
                            <IconButton
                              size="small"
                              onClick={() => handleUnassign(assignment.id!)}
                              color="warning"
                            >
                              <UnassignIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Mark as Complete">
                            <IconButton
                              size="small"
                              onClick={() => openCompleteDialog(assignment)}
                              color="success"
                            >
                              <CompleteIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign to Employee</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Activity: <strong>{selectedAssignment?.activityName}</strong>
            </Typography>
            <Typography variant="body2" gutterBottom sx={{ mb: 3 }}>
              Date: {selectedAssignment && format(new Date(selectedAssignment.assignmentDate), 'MMM dd, yyyy')}
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Select Employee</InputLabel>
              <Select
                value={selectedEmployeeId}
                label="Select Employee"
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
              >
                {employees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.name} - {emp.department}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAssign} 
            variant="contained" 
            disabled={!selectedEmployeeId}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      {/* Complete Dialog */}
      <Dialog open={completeDialogOpen} onClose={() => setCompleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Complete Assignment</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Activity: <strong>{selectedAssignment?.activityName}</strong>
            </Typography>
            <Typography variant="body2" gutterBottom sx={{ mb: 3 }}>
              Employee: <strong>{selectedAssignment?.employee?.name}</strong>
            </Typography>
            
            <Typography gutterBottom>Completion Percentage: {completionPercentage}%</Typography>
            <Slider
              value={completionPercentage}
              onChange={(_, value) => setCompletionPercentage(value as number)}
              min={0}
              max={100}
              step={5}
              marks
              valueLabelDisplay="auto"
              sx={{ mb: 3 }}
            />

            <TextField
              fullWidth
              type="number"
              label="Actual Hours"
              value={actualHours}
              onChange={(e) => setActualHours(parseFloat(e.target.value) || 0)}
              inputProps={{ min: 0, step: 0.5 }}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Completion Notes"
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleComplete} variant="contained" color="success">
            Mark Complete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Progress Dialog */}
      <Dialog open={progressDialogOpen} onClose={() => setProgressDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Task Progress</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Activity: <strong>{selectedAssignment?.activityName}</strong>
            </Typography>
            <Typography variant="body2" gutterBottom sx={{ mb: 3 }}>
              Employee: <strong>{selectedAssignment?.employee?.name}</strong>
            </Typography>
            
            <Typography gutterBottom>Completion: {completionPercentage}%</Typography>
            <Slider
              value={completionPercentage}
              onChange={(_, value) => setCompletionPercentage(value as number)}
              min={0}
              max={100}
              step={10}
              marks={[
                { value: 0, label: '0%' },
                { value: 25, label: '25%' },
                { value: 50, label: '50%' },
                { value: 75, label: '75%' },
                { value: 100, label: '100%' },
              ]}
              valueLabelDisplay="on"
              sx={{ mb: 3, mt: 4 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProgressDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateProgress} variant="contained" color="primary">
            Update Progress
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssignmentList;

