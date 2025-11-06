import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import {
  Assessment as ReportIcon,
  Assignment as AssignmentIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { reportApi } from '../../api/reportApi';
import { UpcomingAssignmentsReport, PaymentReport } from '../../types';
import { format, addDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

const Reports: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Upcoming Assignments Report
  const [assignmentsReport, setAssignmentsReport] = useState<UpcomingAssignmentsReport | null>(null);
  const [assignmentsStartDate, setAssignmentsStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [assignmentsEndDate, setAssignmentsEndDate] = useState(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
  
  // Payment Report
  const [paymentReport, setPaymentReport] = useState<PaymentReport | null>(null);
  const [paymentStartDate, setPaymentStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [paymentEndDate, setPaymentEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const loadUpcomingAssignments = async () => {
    try {
      setLoading(true);
      const data = await reportApi.getUpcomingAssignments(assignmentsStartDate, assignmentsEndDate);
      setAssignmentsReport(data);
    } catch (error) {
      console.error('Error loading assignments report:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNextWeekAssignments = async () => {
    try {
      setLoading(true);
      const data = await reportApi.getUpcomingAssignmentsNextWeek();
      setAssignmentsReport(data);
    } catch (error) {
      console.error('Error loading assignments report:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentReport = async () => {
    try {
      setLoading(true);
      const data = await reportApi.getPaymentReport(paymentStartDate, paymentEndDate);
      setPaymentReport(data);
    } catch (error) {
      console.error('Error loading payment report:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentMonthPayment = async () => {
    try {
      setLoading(true);
      const data = await reportApi.getPaymentReportCurrentMonth();
      setPaymentReport(data);
    } catch (error) {
      console.error('Error loading payment report:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLastMonthPayment = async () => {
    try {
      setLoading(true);
      const data = await reportApi.getPaymentReportLastMonth();
      setPaymentReport(data);
    } catch (error) {
      console.error('Error loading payment report:', error);
    } finally {
      setLoading(false);
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
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <ReportIcon sx={{ mr: 2, fontSize: 32 }} />
        <Typography variant="h4">Reports</Typography>
      </Box>

      <Paper>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab icon={<AssignmentIcon />} label="Upcoming Assignments" />
          <Tab icon={<MoneyIcon />} label="Payment Report" />
        </Tabs>

        {/* Upcoming Assignments Report */}
        <TabPanel value={tabValue} index={0}>
          <Box p={3}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Generate Upcoming Assignments Report
                    </Typography>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          type="date"
                          label="Start Date"
                          value={assignmentsStartDate}
                          onChange={(e) => setAssignmentsStartDate(e.target.value)}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          type="date"
                          label="End Date"
                          value={assignmentsEndDate}
                          onChange={(e) => setAssignmentsEndDate(e.target.value)}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box display="flex" gap={2}>
                          <Button
                            variant="contained"
                            onClick={loadUpcomingAssignments}
                            disabled={loading}
                          >
                            Generate Report
                          </Button>
                          <Button
                            variant="outlined"
                            onClick={loadNextWeekAssignments}
                            disabled={loading}
                          >
                            Next Week
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {loading && (
                <Grid item xs={12}>
                  <Box display="flex" justifyContent="center" py={5}>
                    <CircularProgress />
                  </Box>
                </Grid>
              )}

              {!loading && assignmentsReport && (
                <>
                  {/* Summary Cards */}
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          Total Assignments
                        </Typography>
                        <Typography variant="h4">
                          {assignmentsReport.totalAssignments}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          Unassigned
                        </Typography>
                        <Typography variant="h4" color="warning.main">
                          {assignmentsReport.unassignedCount}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          Assigned
                        </Typography>
                        <Typography variant="h4" color="success.main">
                          {assignmentsReport.assignedCount}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Assignments Table */}
                  <Grid item xs={12}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Assignment Details
                        </Typography>
                        <TableContainer>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>Activity</TableCell>
                                <TableCell>Shift</TableCell>
                                <TableCell>Employee</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Completion %</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {assignmentsReport.assignments.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={6} align="center">
                                    <Typography color="textSecondary">
                                      No assignments found
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              ) : (
                                assignmentsReport.assignments.map((assignment, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell>
                                      {format(new Date(assignment.assignmentDate), 'MMM dd, yyyy')}
                                    </TableCell>
                                    <TableCell>{assignment.activityName}</TableCell>
                                    <TableCell>{assignment.workShift?.replace('_', ' ')}</TableCell>
                                    <TableCell>{assignment.employeeName || '-'}</TableCell>
                                    <TableCell>
                                      <Chip
                                        label={assignment.status?.replace('_', ' ')}
                                        color={getStatusColor(assignment.status || '')}
                                        size="small"
                                      />
                                    </TableCell>
                                    <TableCell>{assignment.completionPercentage || 0}%</TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                </>
              )}
            </Grid>
          </Box>
        </TabPanel>

        {/* Payment Report */}
        <TabPanel value={tabValue} index={1}>
          <Box p={3}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Generate Payment Report
                    </Typography>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          type="date"
                          label="Start Date"
                          value={paymentStartDate}
                          onChange={(e) => setPaymentStartDate(e.target.value)}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          type="date"
                          label="End Date"
                          value={paymentEndDate}
                          onChange={(e) => setPaymentEndDate(e.target.value)}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box display="flex" gap={2}>
                          <Button
                            variant="contained"
                            onClick={loadPaymentReport}
                            disabled={loading}
                          >
                            Generate Report
                          </Button>
                          <Button
                            variant="outlined"
                            onClick={loadCurrentMonthPayment}
                            disabled={loading}
                          >
                            Current Month
                          </Button>
                          <Button
                            variant="outlined"
                            onClick={loadLastMonthPayment}
                            disabled={loading}
                          >
                            Last Month
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {loading && (
                <Grid item xs={12}>
                  <Box display="flex" justifyContent="center" py={5}>
                    <CircularProgress />
                  </Box>
                </Grid>
              )}

              {!loading && paymentReport && (
                <>
                  {/* Summary Cards */}
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          Total Employees
                        </Typography>
                        <Typography variant="h4">
                          {paymentReport.totalEmployees}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          Period
                        </Typography>
                        <Typography variant="body1">
                          {format(new Date(paymentReport.periodStartDate), 'MMM dd, yyyy')}
                        </Typography>
                        <Typography variant="body1">
                          to {format(new Date(paymentReport.periodEndDate), 'MMM dd, yyyy')}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card sx={{ backgroundColor: 'success.light' }}>
                      <CardContent>
                        <Typography color="white" gutterBottom>
                          Total Payment
                        </Typography>
                        <Typography variant="h4" color="white">
                          ₹{paymentReport.totalPaymentAmount.toLocaleString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Employee Payments Table */}
                  <Grid item xs={12}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Employee Payment Breakdown
                        </Typography>
                        <TableContainer>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>Employee</TableCell>
                                <TableCell>Base Salary</TableCell>
                                <TableCell>Assignments</TableCell>
                                <TableCell>Avg Completion</TableCell>
                                <TableCell align="right">Payment Amount</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {paymentReport.employeePayments.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={5} align="center">
                                    <Typography color="textSecondary">
                                      No payment data found
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              ) : (
                                paymentReport.employeePayments.map((payment, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell>
                                      <strong>{payment.employeeName}</strong>
                                      <br />
                                      <Typography variant="caption" color="textSecondary">
                                        {payment.department}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      {payment.currency} {payment.baseSalary.toLocaleString()}
                                    </TableCell>
                                    <TableCell>{payment.totalAssignments}</TableCell>
                                    <TableCell>
                                      <Chip
                                        label={`${payment.averageCompletionPercentage.toFixed(0)}%`}
                                        color={
                                          payment.averageCompletionPercentage >= 90
                                            ? 'success'
                                            : payment.averageCompletionPercentage >= 70
                                            ? 'primary'
                                            : 'warning'
                                        }
                                        size="small"
                                      />
                                    </TableCell>
                                    <TableCell align="right">
                                      <Typography variant="h6" color="primary">
                                        ₹{payment.calculatedPayment.toLocaleString()}
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                              {paymentReport.employeePayments.length > 0 && (
                                <TableRow>
                                  <TableCell colSpan={4} align="right">
                                    <strong>Total:</strong>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography variant="h6" color="primary">
                                      <strong>₹{paymentReport.totalPaymentAmount.toLocaleString()}</strong>
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                </>
              )}
            </Grid>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Reports;

