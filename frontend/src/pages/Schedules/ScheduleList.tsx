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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as GenerateIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { scheduleApi } from '../../api/scheduleApi';
import { OperationSchedule } from '../../types';
import { format } from 'date-fns';

const ScheduleList: React.FC = () => {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<OperationSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<OperationSchedule | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const data = await scheduleApi.getAllSchedules();
      const schedulesArray = Array.isArray(data) ? data : [];
      setSchedules(schedulesArray);
    } catch (error) {
      console.error('Error loading schedules:', error);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!scheduleToDelete) return;

    try {
      await scheduleApi.deleteSchedule(scheduleToDelete.id!);
      setSchedules(schedules.filter((s) => s.id !== scheduleToDelete.id));
      setDeleteDialogOpen(false);
      setScheduleToDelete(null);
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  const handleGenerateAssignments = async (scheduleId: string) => {
    try {
      setGenerating(scheduleId);
      const result = await scheduleApi.generateAssignments(scheduleId);
      console.log('Generate assignments result:', result);
      
      // Reload schedules to get updated status and assignment count
      await loadSchedules();
      
      // Safely extract count from result
      const count = typeof result === 'object' && result !== null 
        ? (result.totalAssignmentsCount || 0) 
        : 0;
      
      if (count > 0) {
        alert(`✅ Success! Generated ${count} work assignment${count !== 1 ? 's' : ''}\n\nClick the 👁️ icon to view assignments.`);
      } else {
        alert('⚠️ No assignments were generated.\n\nThis could be because:\n- No work activities match the schedule filters\n- The date range is too short\n- Activity frequencies don\'t align with the schedule period\n\nTry creating a schedule with "Include all schedulable activities" checked.');
      }
    } catch (error) {
      console.error('Error generating assignments:', error);
      alert('❌ Failed to generate assignments. Please try again.');
    } finally {
      setGenerating(null);
    }
  };

  const openDeleteDialog = (schedule: OperationSchedule) => {
    setScheduleToDelete(schedule);
    setDeleteDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'default';
      case 'GENERATED':
        return 'info';
      case 'PUBLISHED':
        return 'success';
      case 'IN_PROGRESS':
        return 'primary';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'error';
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
        <Typography variant="h4">Operation Schedules</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/schedules/new')}
        >
          Create Schedule
        </Button>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Period Name</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Period Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Assignments</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {schedules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="textSecondary">No schedules yet</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                schedules.map((schedule) => (
                  <TableRow key={schedule.id} hover>
                    <TableCell><strong>{schedule.periodName}</strong></TableCell>
                    <TableCell>{format(new Date(schedule.startDate), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{format(new Date(schedule.endDate), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{schedule.periodType?.replace('_', ' ')}</TableCell>
                    <TableCell>
                      <Chip
                        label={schedule.status}
                        color={getStatusColor(schedule.status || '')}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={schedule.totalAssignmentsCount || 0}
                        color={schedule.totalAssignmentsCount ? 'success' : 'default'}
                        size="small"
                        sx={{ 
                          fontWeight: 'bold',
                          minWidth: '40px',
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/schedules/${schedule.id}/assignments`)}
                        color="primary"
                        title="View Assignments"
                      >
                        <ViewIcon />
                      </IconButton>
                      {schedule.status === 'DRAFT' && (
                        <IconButton
                          size="small"
                          onClick={() => handleGenerateAssignments(schedule.id!)}
                          color="success"
                          disabled={generating === schedule.id}
                          title="Generate Assignments"
                        >
                          <GenerateIcon />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/schedules/${schedule.id}/edit`)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => openDeleteDialog(schedule)}
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
            Are you sure you want to delete schedule "{scheduleToDelete?.periodName}"?
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

export default ScheduleList;

