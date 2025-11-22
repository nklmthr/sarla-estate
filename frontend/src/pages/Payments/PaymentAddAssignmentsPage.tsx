import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  Typography,
  Button,
  Grid,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Paper,
  Chip,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  ArrowForward as ForwardIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { paymentApi, Payment } from '../../api/paymentApi';
import { assignmentApi } from '../../api/assignmentApi';
import { useError } from '../../contexts/ErrorContext';

interface EmployeeWithAssignments {
  id: string;
  fullName: string;
  employeeCode: string;
  assignmentCount: number;
}

interface AssignmentForPayment {
  id: string;
  employee: {
    id: string;
    fullName: string;
    employeeCode: string;
  };
  workActivity: {
    id: string;
    name: string;
    completionCriteria?: {
      unit: string;
    };
  };
  startDate: string;
  endDate: string;
  status: string;
  evaluation: {
    actualValue: number;
    evaluatedBy: string;
    evaluatedAt: string;
    evaluationScore?: number;
    comments?: string;
  };
  calculatedAmount?: number;
}

const steps = ['Select Date Range', 'Select Employees', 'Select Assignments', 'Review & Submit'];

const PaymentAddAssignmentsPage: React.FC = () => {
  const { paymentId } = useParams<{ paymentId: string }>();
  const navigate = useNavigate();
  const { showError, showSuccess } = useError();

  const [activeStep, setActiveStep] = useState(0);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(false);

  // Step 1: Date Range
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  // Step 2: Employees
  const [allAssignments, setAllAssignments] = useState<AssignmentForPayment[]>([]);
  const [employeesWithAssignments, setEmployeesWithAssignments] = useState<EmployeeWithAssignments[]>([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(new Set());

  // Step 3: Assignments
  const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPayment();
    initializeDateRange();
  }, [paymentId]);

  const initializeDateRange = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    setDateRange({
      startDate: monday.toISOString().split('T')[0],
      endDate: sunday.toISOString().split('T')[0],
    });
  };

  const loadPayment = async () => {
    if (!paymentId) return;
    setLoading(true);
    try {
      const data = await paymentApi.getPaymentById(paymentId);
      setPayment(data);
    } catch (error: any) {
      showError({
        title: 'Failed to load payment',
        message: error.message || 'Could not fetch payment details',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchAssignments = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      showError({
        title: 'Date range required',
        message: 'Please select both start and end dates',
        severity: 'warning',
      });
      return;
    }

    setLoading(true);
    try {
      const assignments: any[] = await assignmentApi.getAssignmentsByDateRange(
        dateRange.startDate,
        dateRange.endDate
      );

      console.log('Raw assignments from backend:', assignments);

      // Filter only COMPLETED assignments with evaluations that are not locked
      const existingAssignmentIds = new Set(payment?.lineItems?.map(li => li.assignmentId) || []);
      const evaluatedAssignments = assignments.filter((a: any) => {
        const isCompleted = a.status === 'COMPLETED' || a.assignmentStatus === 'COMPLETED';
        const hasEvaluation = (a.evaluationCount && a.evaluationCount > 0) || a.lastEvaluatedAt !== null;
        const notInPayment = !existingAssignmentIds.has(a.id);
        const isUnpaid = !a.paymentStatus || a.paymentStatus === 'UNPAID';

        console.log(`Filtering assignment ${a.id}:`, {
          isCompleted,
          hasEvaluation,
          notInPayment,
          isUnpaid,
          status: a.status || a.assignmentStatus,
          evaluationCount: a.evaluationCount,
          lastEvaluatedAt: a.lastEvaluatedAt,
          paymentStatus: a.paymentStatus,
          employee: a.assignedEmployeeName || a.employee?.fullName,
          activity: a.activityName || a.workActivity?.name,
        });

        return isCompleted && hasEvaluation && notInPayment && isUnpaid;
      });

      console.log('Filtered evaluated assignments:', evaluatedAssignments);

      if (evaluatedAssignments.length === 0) {
        showError({
          title: 'No evaluated assignments found',
          message: `No completed and evaluated assignments found in the date range ${dateRange.startDate} to ${dateRange.endDate}`,
          severity: 'info',
        });
        return;
      }

      // Map to our AssignmentForPayment type
      const mappedAssignments: AssignmentForPayment[] = evaluatedAssignments.map((a: any) => ({
        id: a.id,
        employee: {
          id: a.assignedEmployeeId || a.employee?.id,
          fullName: a.assignedEmployeeName || a.employee?.fullName || a.employee?.name,
          employeeCode: a.employee?.employeeCode || '',
        },
        workActivity: {
          id: a.workActivityId || a.workActivity?.id,
          name: a.activityName || a.workActivity?.name,
          completionCriteria: {
            unit: a.workActivity?.completionCriteria?.unit || a.workActivity?.unit || 'Units',
          },
        },
        startDate: a.assignmentDate || a.startDate,
        endDate: a.assignmentDate || a.endDate, // WorkAssignmentDTO uses single assignmentDate
        status: a.assignmentStatus || a.status,
        evaluation: {
          actualValue: a.actualValue || 0,
          evaluatedBy: 'System', // WorkAssignmentDTO doesn't track who evaluated
          evaluatedAt: a.lastEvaluatedAt || new Date().toISOString(),
          evaluationScore: a.completionPercentage,
          comments: a.completionNotes,
        },
        calculatedAmount: a.calculatedAmount || 0,
      }));

      // Group by employee
      const employeeMap = new Map<string, EmployeeWithAssignments>();
      mappedAssignments.forEach((assignment) => {
        const empId = assignment.employee.id;
        const empName = assignment.employee.fullName;
        const empCode = assignment.employee.employeeCode;

        if (empId && !employeeMap.has(empId)) {
          employeeMap.set(empId, {
            id: empId,
            fullName: empName,
            employeeCode: empCode,
            assignmentCount: 0,
          });
        }
        if (empId) {
          employeeMap.get(empId)!.assignmentCount++;
        }
      });

      const employees = Array.from(employeeMap.values());
      console.log('Employees with evaluated assignments:', employees);

      setAllAssignments(mappedAssignments);
      setEmployeesWithAssignments(employees);
      showSuccess(`Found ${evaluatedAssignments.length} evaluated assignment(s) for ${employees.length} employee(s)`);
      setActiveStep(1); // Move to employee selection step
    } catch (error: any) {
      console.error('Error fetching assignments:', error);
      showError({
        title: 'Failed to load assignments',
        message: error.message || 'Could not fetch assignments for date range',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeToggle = (employeeId: string) => {
    const newSelected = new Set(selectedEmployeeIds);
    if (newSelected.has(employeeId)) {
      newSelected.delete(employeeId);
      // Also deselect all assignments for this employee
      const assignmentsToRemove = allAssignments
        .filter(a => a.employee.id === employeeId)
        .map(a => a.id);
      const newSelectedAssignments = new Set(selectedAssignmentIds);
      assignmentsToRemove.forEach(id => newSelectedAssignments.delete(id));
      setSelectedAssignmentIds(newSelectedAssignments);
    } else {
      newSelected.add(employeeId);
    }
    setSelectedEmployeeIds(newSelected);
  };

  const handleAssignmentToggle = (assignmentId: string) => {
    const newSelected = new Set(selectedAssignmentIds);
    if (newSelected.has(assignmentId)) {
      newSelected.delete(assignmentId);
    } else {
      newSelected.add(assignmentId);
    }
    setSelectedAssignmentIds(newSelected);
  };

  const handleSelectAllEmployees = () => {
    if (selectedEmployeeIds.size === employeesWithAssignments.length) {
      setSelectedEmployeeIds(new Set());
      setSelectedAssignmentIds(new Set());
    } else {
      setSelectedEmployeeIds(new Set(employeesWithAssignments.map(e => e.id)));
    }
  };

  const handleSelectAllAssignmentsForSelectedEmployees = () => {
    const assignmentsForSelectedEmployees = allAssignments.filter(a =>
      selectedEmployeeIds.has(a.employee.id)
    );
    if (selectedAssignmentIds.size === assignmentsForSelectedEmployees.length) {
      setSelectedAssignmentIds(new Set());
    } else {
      setSelectedAssignmentIds(new Set(assignmentsForSelectedEmployees.map(a => a.id)));
    }
  };

  const handleNext = () => {
    if (activeStep === 0) {
      handleSearchAssignments();
    } else if (activeStep === 1) {
      if (selectedEmployeeIds.size === 0) {
        showError({
          title: 'No employees selected',
          message: 'Please select at least one employee',
          severity: 'warning',
        });
        return;
      }
      setActiveStep(2);
    } else if (activeStep === 2) {
      if (selectedAssignmentIds.size === 0) {
        showError({
          title: 'No assignments selected',
          message: 'Please select at least one assignment',
          severity: 'warning',
        });
        return;
      }
      setActiveStep(3);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!payment || selectedAssignmentIds.size === 0) return;

    setLoading(true);
    try {
      // Add assignments one by one using the line item endpoint
      const assignmentIdsArray = Array.from(selectedAssignmentIds);
      
      for (const assignmentId of assignmentIdsArray) {
        await paymentApi.addLineItem(payment.id, assignmentId);
      }

      showSuccess(`Successfully added ${selectedAssignmentIds.size} assignment(s) to payment`);
      navigate(`/payments/${payment.id}`);
    } catch (error: any) {
      showError({
        title: 'Failed to add assignments',
        message: error.message || 'Could not add assignments to payment',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getFilteredAssignments = () => {
    return allAssignments.filter(a => selectedEmployeeIds.has(a.employee.id));
  };

  const getSelectedAssignments = () => {
    return allAssignments.filter(a => selectedAssignmentIds.has(a.id));
  };

  const calculateTotalAmount = () => {
    return getSelectedAssignments().reduce((sum, a) => sum + (a.calculatedAmount || 0), 0);
  };

  if (loading && !payment) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate(`/payments/${paymentId}`)}>
          <BackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4">Add Assignments to Payment</Typography>
          <Typography variant="body2" color="text.secondary">
            Payment for {payment && new Date(payment.paymentYear || 0, (payment.paymentMonth || 1) - 1).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
            })}
          </Typography>
        </Box>
      </Box>

      {/* Stepper */}
      <Card sx={{ mb: 3, p: 3 }}>
        <Stepper activeStep={activeStep}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Card>

      {/* Step Content */}
      <Card sx={{ p: 3 }}>
        {/* Step 0: Date Range Selection */}
        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Date Range for Evaluated Assignments
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Choose the date range to search for completed and evaluated assignments.
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  type="date"
                  label="Start Date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  type="date"
                  label="End Date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleSearchAssignments}
                  disabled={!dateRange.startDate || !dateRange.endDate || loading}
                  sx={{ height: '56px' }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Search'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Step 1: Employee Selection */}
        {activeStep === 1 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6">
                  Select Employees ({employeesWithAssignments.length} found)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Date Range: {formatDate(dateRange.startDate)} to {formatDate(dateRange.endDate)}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                onClick={handleSelectAllEmployees}
              >
                {selectedEmployeeIds.size === employeesWithAssignments.length ? 'Deselect All' : 'Select All'}
              </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox"></TableCell>
                    <TableCell>Employee Code</TableCell>
                    <TableCell>Full Name</TableCell>
                    <TableCell align="right">Evaluated Assignments</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employeesWithAssignments.map((employee) => (
                    <TableRow
                      key={employee.id}
                      hover
                      onClick={() => handleEmployeeToggle(employee.id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedEmployeeIds.has(employee.id)}
                          onChange={() => handleEmployeeToggle(employee.id)}
                        />
                      </TableCell>
                      <TableCell>{employee.employeeCode}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {employee.fullName}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip label={employee.assignmentCount} size="small" color="primary" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {selectedEmployeeIds.size > 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                {selectedEmployeeIds.size} employee(s) selected
              </Alert>
            )}
          </Box>
        )}

        {/* Step 2: Assignment Selection */}
        {activeStep === 2 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6">
                  Select Assignments ({getFilteredAssignments().length} available)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedEmployeeIds.size} employee(s) selected
                </Typography>
              </Box>
              <Button
                variant="outlined"
                onClick={handleSelectAllAssignmentsForSelectedEmployees}
              >
                {selectedAssignmentIds.size === getFilteredAssignments().length ? 'Deselect All' : 'Select All'}
              </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 500 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox"></TableCell>
                    <TableCell>Employee</TableCell>
                    <TableCell>Activity</TableCell>
                    <TableCell>Week</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell>Evaluated By</TableCell>
                    <TableCell>Evaluated On</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getFilteredAssignments().map((assignment) => (
                    <TableRow
                      key={assignment.id}
                      hover
                      onClick={() => handleAssignmentToggle(assignment.id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedAssignmentIds.has(assignment.id)}
                          onChange={() => handleAssignmentToggle(assignment.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {assignment.employee.fullName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {assignment.employee.employeeCode}
                        </Typography>
                      </TableCell>
                      <TableCell>{assignment.workActivity.name}</TableCell>
                      <TableCell>
                        <Typography variant="caption" display="block">
                          {formatDate(assignment.startDate)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          to {formatDate(assignment.endDate)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {assignment.evaluation.actualValue} {assignment.workActivity.completionCriteria?.unit}
                      </TableCell>
                      <TableCell>{assignment.evaluation.evaluatedBy}</TableCell>
                      <TableCell>{formatDate(assignment.evaluation.evaluatedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {selectedAssignmentIds.size > 0 && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {selectedAssignmentIds.size} assignment(s) selected
              </Alert>
            )}
          </Box>
        )}

        {/* Step 3: Review & Submit */}
        {activeStep === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Selected Assignments
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Please review the selected assignments before adding them to the payment.
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Employees
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {selectedEmployeeIds.size}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Assignments
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {selectedAssignmentIds.size}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Estimated Total
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {formatCurrency(calculateTotalAmount())}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Activity</TableCell>
                    <TableCell>Week</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell>Evaluated By</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getSelectedAssignments().map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <Typography variant="body2">
                          {assignment.employee.fullName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {assignment.employee.employeeCode}
                        </Typography>
                      </TableCell>
                      <TableCell>{assignment.workActivity.name}</TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {formatDate(assignment.startDate)} - {formatDate(assignment.endDate)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {assignment.evaluation.actualValue} {assignment.workActivity.completionCriteria?.unit}
                      </TableCell>
                      <TableCell>{assignment.evaluation.evaluatedBy}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2" fontWeight="bold">
                Ready to add assignments
              </Typography>
              <Typography variant="caption">
                These {selectedAssignmentIds.size} assignments will be added to the payment draft.
                You can review the payment calculations on the payment details page.
              </Typography>
            </Alert>
          </Box>
        )}

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            onClick={handleBack}
            disabled={activeStep === 0 || loading}
            startIcon={<BackIcon />}
          >
            Back
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => navigate(`/payments/${paymentId}`)}
            >
              Cancel
            </Button>
            {activeStep < steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<ForwardIcon />}
                disabled={loading}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleSubmit}
                startIcon={<SaveIcon />}
                disabled={loading || selectedAssignmentIds.size === 0}
              >
                {loading ? <CircularProgress size={24} /> : `Add ${selectedAssignmentIds.size} Assignment(s)`}
              </Button>
            )}
          </Box>
        </Box>
      </Card>
    </Box>
  );
};

export default PaymentAddAssignmentsPage;


