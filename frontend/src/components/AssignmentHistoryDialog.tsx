import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Chip,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  List,
  ListItem,
  Avatar,
} from '@mui/material';
import {
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Payment as PaymentIcon,
  Assignment as AssignmentIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { assignmentApi, AssignmentHistory, AuditLogEntry } from '../api/assignmentApi';
import { format } from 'date-fns';

interface AssignmentHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  assignmentId: string;
}

const AssignmentHistoryDialog: React.FC<AssignmentHistoryDialogProps> = ({
  open,
  onClose,
  assignmentId,
}) => {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<AssignmentHistory | null>(null);

  useEffect(() => {
    if (open && assignmentId) {
      loadHistory();
    }
  }, [open, assignmentId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await assignmentApi.getAssignmentHistory(assignmentId);
      setHistory(data);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOperationIcon = (operation: string) => {
    switch (operation.toUpperCase()) {
      case 'CREATE':
        return <AssignmentIcon />;
      case 'UPDATE':
      case 'EDIT':
        return <EditIcon />;
      case 'DELETE':
        return <DeleteIcon />;
      case 'EVALUATE':
        return <CheckCircleIcon />;
      case 'PAYMENT_ADD':
      case 'PAYMENT_REMOVE':
        return <PaymentIcon />;
      default:
        return <HistoryIcon />;
    }
  };

  const getOperationColor = (operation: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (operation.toUpperCase()) {
      case 'CREATE':
        return 'info';
      case 'UPDATE':
      case 'EDIT':
        return 'warning';
      case 'DELETE':
        return 'error';
      case 'EVALUATE':
        return 'success';
      case 'PAYMENT_ADD':
      case 'PAYMENT_REMOVE':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'MMM d, yyyy h:mm a');
    } catch {
      return timestamp;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <HistoryIcon sx={{ mr: 1 }} />
            Assignment History
          </Box>
          <Button onClick={onClose} color="inherit" size="small">
            <CloseIcon />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading && (
          <Box display="flex" justifyContent="center" py={5}>
            <CircularProgress />
          </Box>
        )}

        {!loading && history && (
          <Box>
            {/* Assignment Summary */}
            <Paper elevation={2} sx={{ p: 2, mb: 3, backgroundColor: '#f5f5f5' }}>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', width: '150px' }}>Activity:</TableCell>
                      <TableCell>{history.activityName}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Employee:</TableCell>
                      <TableCell>{history.employeeName}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Assignment Date:</TableCell>
                      <TableCell>{history.assignmentDate}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Status:</TableCell>
                      <TableCell>
                        <Chip
                          label={history.assignmentStatus}
                          size="small"
                          color={history.assignmentStatus === 'COMPLETED' ? 'success' : 'info'}
                        />
                      </TableCell>
                    </TableRow>
                    {history.completionPercentage !== null && (
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Completion:</TableCell>
                        <TableCell>{history.completionPercentage}%</TableCell>
                      </TableRow>
                    )}
                    {history.evaluationCount !== null && history.evaluationCount > 0 && (
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Evaluations:</TableCell>
                        <TableCell>{history.evaluationCount}</TableCell>
                      </TableRow>
                    )}
                    {history.includedInPaymentReferenceNumber && (
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Payment:</TableCell>
                        <TableCell>
                          <Chip
                            label={history.includedInPaymentReferenceNumber}
                            size="small"
                            color="secondary"
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            <Divider sx={{ mb: 2 }}>
              <Chip label="Change History" />
            </Divider>

            {/* List of Changes */}
            {history.auditLogs && history.auditLogs.length > 0 ? (
              <List sx={{ width: '100%' }}>
                {history.auditLogs.map((log, index) => (
                  <ListItem
                    key={index}
                    alignItems="flex-start"
                    sx={{
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      mb: 2,
                      p: 0,
                    }}
                  >
                    <Paper elevation={2} sx={{ p: 2, width: '100%' }}>
                      <Box display="flex" alignItems="flex-start" gap={2}>
                        <Avatar
                          sx={{
                            bgcolor: `${getOperationColor(log.operation)}.main`,
                            width: 40,
                            height: 40,
                          }}
                        >
                          {getOperationIcon(log.operation)}
                        </Avatar>
                        <Box flex={1}>
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                            <Box>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {log.description}
                              </Typography>
                              <Typography variant="caption" color="textSecondary" display="block">
                                by {log.userFullName || log.username}
                                {log.ipAddress && ` • ${log.ipAddress}`}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="textSecondary" sx={{ whiteSpace: 'nowrap', ml: 2 }}>
                              {formatTimestamp(log.timestamp)}
                            </Typography>
                          </Box>
                          {log.status && (
                            <Chip
                              label={log.status}
                              size="small"
                              color={log.status === 'SUCCESS' ? 'success' : 'error'}
                              sx={{ mt: 0.5 }}
                            />
                          )}
                        </Box>
                      </Box>
                    </Paper>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box textAlign="center" py={5}>
                <Typography variant="body2" color="textSecondary">
                  No change history available
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignmentHistoryDialog;
