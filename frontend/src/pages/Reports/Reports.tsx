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
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Assessment as ReportIcon,
  Assignment as AssignmentIcon,
  AttachMoney as MoneyIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
} from '@mui/icons-material';
import { reportApi } from '../../api/reportApi';
import { UpcomingAssignmentsReport, PaymentReport, WorkAssignment } from '../../types';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const Reports: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<'assignments' | 'payments'>('assignments');
  const [loading, setLoading] = useState(false);
  
  // Assignment Report
  const [assignmentsReport, setAssignmentsReport] = useState<UpcomingAssignmentsReport | null>(null);
  const [reportDate, setReportDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // Payment Report
  const [paymentReport, setPaymentReport] = useState<PaymentReport | null>(null);
  const [paymentStartDate, setPaymentStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [paymentEndDate, setPaymentEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  const loadDailyAssignments = async () => {
    try {
      setLoading(true);
      // Use the same date for both start and end to get single day report
      const data = await reportApi.getUpcomingAssignments(reportDate, reportDate);
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

  const loadLastMonthPayment = async () => {
    try {
      setLoading(true);
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const startDate = format(startOfMonth(lastMonth), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(lastMonth), 'yyyy-MM-dd');
      const data = await reportApi.getPaymentReport(startDate, endDate);
      setPaymentReport(data);
    } catch (error) {
      console.error('Error loading payment report:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group assignments by activity
  interface ActivityGroup {
    activityName: string;
    totalEmployees: number;
    assignedCount: number;
    completedCount: number;
    assignments: WorkAssignment[];
  }

  const groupAssignmentsByActivity = (assignments: any[]): ActivityGroup[] => {
    const grouped = new Map<string, ActivityGroup>();

    // Filter by status first
    const filteredAssignments = statusFilter === 'ALL' 
      ? assignments 
      : assignments.filter(a => a.status === statusFilter);

    filteredAssignments.forEach((assignment) => {
      const activityName = assignment.activityName || 'Unknown';
      
      if (!grouped.has(activityName)) {
        grouped.set(activityName, {
          activityName,
          totalEmployees: 0,
          assignedCount: 0,
          completedCount: 0,
          assignments: [],
        });
      }

      const group = grouped.get(activityName)!;
      group.assignments.push(assignment);
      group.totalEmployees++;
      
      if (assignment.status === 'ASSIGNED') {
        group.assignedCount++;
      } else if (assignment.status === 'COMPLETED') {
        group.completedCount++;
      }
    });

    return Array.from(grouped.values()).sort((a, b) => 
      a.activityName.localeCompare(b.activityName)
    );
  };

  const getFilteredAssignments = () => {
    if (!assignmentsReport?.assignments) return [];
    return statusFilter === 'ALL'
      ? assignmentsReport.assignments
      : assignmentsReport.assignments.filter(a => a.status === statusFilter);
  };

  const getEvaluatedCount = () => {
    return assignmentsReport?.assignments.filter(a => a.status === 'COMPLETED').length || 0;
  };

  const getNotEvaluatedCount = () => {
    return assignmentsReport?.assignments.filter(a => a.status === 'ASSIGNED').length || 0;
  };

  // Export Payment Report as PDF
  const exportPaymentReportAsPDF = () => {
    if (!paymentReport) return;

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Report', 14, 20);
    
    // Report Details
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Period: ${format(new Date(paymentReport.periodStartDate), 'MMM dd, yyyy')} to ${format(new Date(paymentReport.periodEndDate), 'MMM dd, yyyy')}`, 14, 30);
    doc.text(`Generated: ${format(new Date(paymentReport.reportGeneratedDate), 'MMM dd, yyyy')}`, 14, 36);
    doc.text(`Total Employees: ${paymentReport.totalEmployees}`, 14, 42);
    doc.text(`Total Payment: ₹${paymentReport.totalPaymentAmount ? paymentReport.totalPaymentAmount.toLocaleString() : '0'}`, 14, 48);
    
    // Employee Payment Table
    const tableData = paymentReport.employeePayments.map((payment) => [
      payment.employeeName + ((payment.voluntaryPfPercentage ?? 0) > 0 ? ` (+${payment.voluntaryPfPercentage}% VPF)` : ''),
      `${payment.currency} ${payment.baseSalary ? payment.baseSalary.toLocaleString() : '0'}`,
      `-₹${payment.employeePfContribution ? payment.employeePfContribution.toLocaleString() : '0'}`,
      (payment.voluntaryPfContribution && payment.voluntaryPfContribution > 0) 
        ? `-₹${payment.voluntaryPfContribution.toLocaleString()}` 
        : '-',
      `+₹${payment.employerPfContribution ? payment.employerPfContribution.toLocaleString() : '0'}`,
      payment.totalAssignments || 0,
      `${payment.averageCompletionPercentage ? payment.averageCompletionPercentage.toFixed(0) : '0'}%`,
      `₹${payment.calculatedPayment ? payment.calculatedPayment.toLocaleString() : '0'}`,
      `₹${payment.netPayment ? payment.netPayment.toLocaleString() : '0'}`,
    ]);

    autoTable(doc, {
      startY: 55,
      head: [['Employee', 'Base', 'EPF (12%)', 'VPF', 'Emp PF (12%)', 'Assgn', 'Avg %', 'Gross', 'Net']],
      body: tableData,
      foot: [['Total', '', 
        `-₹${paymentReport.totalEmployeePfContribution ? paymentReport.totalEmployeePfContribution.toLocaleString() : '0'}`,
        `-₹${paymentReport.totalVoluntaryPfContribution ? paymentReport.totalVoluntaryPfContribution.toLocaleString() : '0'}`,
        `+₹${paymentReport.totalEmployerPfContribution ? paymentReport.totalEmployerPfContribution.toLocaleString() : '0'}`,
        '', '', 
        `₹${paymentReport.employeePayments.reduce((sum, p) => sum + (p.calculatedPayment || 0), 0).toLocaleString()}`,
        `₹${paymentReport.totalPaymentAmount ? paymentReport.totalPaymentAmount.toLocaleString() : '0'}`]],
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [76, 175, 80], fontStyle: 'bold' },
      footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 18 },
        2: { cellWidth: 18, halign: 'right' },
        3: { cellWidth: 15, halign: 'right' },
        4: { cellWidth: 18, halign: 'right' },
        5: { cellWidth: 13, halign: 'center' },
        6: { cellWidth: 13, halign: 'center' },
        7: { cellWidth: 18, halign: 'right' },
        8: { cellWidth: 20, halign: 'right', fontStyle: 'bold' },
      },
    });
    
    // Save PDF
    const filename = `Payment_Report_${format(new Date(paymentReport.periodStartDate), 'yyyy-MM-dd')}_to_${format(new Date(paymentReport.periodEndDate), 'yyyy-MM-dd')}.pdf`;
    doc.save(filename);
  };

  // Export Payment Report as Excel
  const exportPaymentReportAsExcel = () => {
    if (!paymentReport) return;

    // Prepare data
    const data = paymentReport.employeePayments.map((payment) => ({
      'Employee': payment.employeeName,
      'Voluntary PF %': (payment.voluntaryPfPercentage ?? 0) > 0 ? `${payment.voluntaryPfPercentage}%` : '-',
      'Base Salary': payment.baseSalary || 0,
      'Employee PF': payment.employeePfContribution || 0,
      'VPF': payment.voluntaryPfContribution || 0,
      'Employer PF': payment.employerPfContribution || 0,
      'Total Assignments': payment.totalAssignments || 0,
      'Avg Completion %': payment.averageCompletionPercentage ? payment.averageCompletionPercentage.toFixed(2) : '0',
      'Gross Payment': payment.calculatedPayment || 0,
      'Net Payment': payment.netPayment || 0,
    }));

    // Add totals row
    const totalGrossPayment = paymentReport.employeePayments.reduce((sum, p) => sum + (p.calculatedPayment || 0), 0);
    data.push({
      'Employee': 'TOTAL',
      'Voluntary PF %': '-',
      'Base Salary': 0,
      'Employee PF': paymentReport.totalEmployeePfContribution || 0,
      'VPF': paymentReport.totalVoluntaryPfContribution || 0,
      'Employer PF': paymentReport.totalEmployerPfContribution || 0,
      'Total Assignments': 0,
      'Avg Completion %': '-',
      'Gross Payment': totalGrossPayment,
      'Net Payment': paymentReport.totalPaymentAmount || 0,
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 25 }, // Employee
      { wch: 15 }, // Voluntary PF %
      { wch: 15 }, // Base Salary
      { wch: 15 }, // Employee PF
      { wch: 15 }, // VPF
      { wch: 15 }, // Employer PF
      { wch: 18 }, // Total Assignments
      { wch: 18 }, // Avg Completion %
      { wch: 15 }, // Gross Payment
      { wch: 15 }, // Net Payment
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payment Report');

    // Add report metadata sheet
    const metaData = [
      ['Payment Report'],
      [''],
      ['Period Start:', format(new Date(paymentReport.periodStartDate), 'MMM dd, yyyy')],
      ['Period End:', format(new Date(paymentReport.periodEndDate), 'MMM dd, yyyy')],
      ['Generated:', format(new Date(paymentReport.reportGeneratedDate), 'MMM dd, yyyy')],
      ['Total Employees:', paymentReport.totalEmployees],
      ['Total Payment:', paymentReport.totalPaymentAmount || 0],
      ['Currency:', paymentReport.currency],
    ];
    const metaWs = XLSX.utils.aoa_to_sheet(metaData);
    XLSX.utils.book_append_sheet(wb, metaWs, 'Report Info');

    // Save file
    const filename = `Payment_Report_${format(new Date(paymentReport.periodStartDate), 'yyyy-MM-dd')}_to_${format(new Date(paymentReport.periodEndDate), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <ReportIcon sx={{ mr: 2, fontSize: 32 }} />
        <Typography variant="h4">Reports</Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 3 }}>
        {/* Left Sidebar Navigation */}
        <Paper 
          sx={{ 
            width: 280, 
            minHeight: 'calc(100vh - 200px)',
            position: 'sticky',
            top: 100,
            alignSelf: 'flex-start'
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ px: 2, pt: 1 }}>
              Report Types
            </Typography>
          </Box>
          <Divider />
          <List>
            <ListItem disablePadding>
              <ListItemButton
                selected={selectedReport === 'assignments'}
                onClick={() => setSelectedReport('assignments')}
                sx={{
                  py: 2,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.light',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.main',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText',
                    },
                  },
                }}
              >
                <ListItemIcon>
                  <AssignmentIcon color={selectedReport === 'assignments' ? 'inherit' : 'primary'} />
                </ListItemIcon>
                <ListItemText 
                  primary="Assignment Report" 
                  secondary="Daily assignments overview"
                  secondaryTypographyProps={{
                    sx: { 
                      color: selectedReport === 'assignments' ? 'rgba(255,255,255,0.7)' : 'text.secondary' 
                    }
                  }}
                />
              </ListItemButton>
            </ListItem>
            <Divider />
            <ListItem disablePadding>
              <ListItemButton
                selected={selectedReport === 'payments'}
                onClick={() => setSelectedReport('payments')}
                sx={{
                  py: 2,
                  '&.Mui-selected': {
                    backgroundColor: 'success.light',
                    color: 'success.contrastText',
                    '&:hover': {
                      backgroundColor: 'success.main',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'success.contrastText',
                    },
                  },
                }}
              >
                <ListItemIcon>
                  <MoneyIcon color={selectedReport === 'payments' ? 'inherit' : 'success'} />
                </ListItemIcon>
                <ListItemText 
                  primary="Payment Report" 
                  secondary="Employee payment summary"
                  secondaryTypographyProps={{
                    sx: { 
                      color: selectedReport === 'payments' ? 'rgba(255,255,255,0.7)' : 'text.secondary' 
                    }
                  }}
                />
              </ListItemButton>
            </ListItem>
          </List>
        </Paper>

        {/* Main Content Area */}
        <Box sx={{ flex: 1 }}>
          {/* Assignment Report */}
          {selectedReport === 'assignments' && (
          <Box>
            <Paper sx={{ mb: 3, p: 3, backgroundColor: 'primary.main', color: 'white' }}>
              <Box display="flex" alignItems="center">
                <AssignmentIcon sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" gutterBottom>
                    Assignment Report
                  </Typography>
                  <Typography variant="body1">
                    View and analyze daily work assignments and their evaluation status
                  </Typography>
                </Box>
              </Box>
            </Paper>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card elevation={3}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Report Parameters
                    </Typography>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          type="date"
                          label="Date"
                          value={reportDate}
                          onChange={(e) => setReportDate(e.target.value)}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <FormControl fullWidth>
                          <InputLabel>Status</InputLabel>
                          <Select
                            value={statusFilter}
                            label="Status"
                            onChange={(e) => setStatusFilter(e.target.value)}
                          >
                            <MenuItem value="ALL">All</MenuItem>
                            <MenuItem value="ASSIGNED">Not Yet Evaluated</MenuItem>
                            <MenuItem value="COMPLETED">Evaluated</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Button
                          variant="contained"
                          onClick={loadDailyAssignments}
                          disabled={loading}
                        >
                          Generate Report
                        </Button>
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
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ px: 1, mt: 2 }}>
                      Summary
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card elevation={3} sx={{ backgroundColor: 'info.light', color: 'white' }}>
                      <CardContent>
                        <Typography variant="body2" sx={{ opacity: 0.9 }} gutterBottom>
                          Total Assignments
                        </Typography>
                        <Typography variant="h3" fontWeight="bold">
                          {getFilteredAssignments().length}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card elevation={3} sx={{ backgroundColor: 'success.main', color: 'white' }}>
                      <CardContent>
                        <Typography variant="body2" sx={{ opacity: 0.9 }} gutterBottom>
                          Evaluated
                        </Typography>
                        <Typography variant="h3" fontWeight="bold">
                          {getEvaluatedCount()}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card elevation={3} sx={{ backgroundColor: 'warning.main', color: 'white' }}>
                      <CardContent>
                        <Typography variant="body2" sx={{ opacity: 0.9 }} gutterBottom>
                          Pending Evaluation
                        </Typography>
                        <Typography variant="h3" fontWeight="bold">
                          {getNotEvaluatedCount()}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Grouped Assignments Table */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ px: 1, mt: 3 }}>
                      Assignment Details
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Card elevation={3}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                          <Typography variant="h6" color="primary">
                            Activity Breakdown
                          </Typography>
                          <Chip 
                            label={format(new Date(reportDate), 'MMMM dd, yyyy')}
                            color="primary"
                            variant="outlined"
                          />
                        </Box>
                        <TableContainer>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>Activity</TableCell>
                                <TableCell>Count</TableCell>
                                <TableCell>Status</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {getFilteredAssignments().length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={3} align="center">
                                    <Typography color="textSecondary">
                                      No assignments found for this date
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              ) : (
                                groupAssignmentsByActivity(assignmentsReport.assignments).map((group, idx) => (
                                  <TableRow key={idx} hover>
                                    <TableCell>
                                      <Typography variant="body1" fontWeight="bold">
                                        {group.activityName}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      {group.completedCount === group.totalEmployees ? (
                                        <Chip
                                          label={group.totalEmployees}
                                          color="success"
                                          sx={{ minWidth: 60, fontWeight: 'bold', fontSize: '1rem' }}
                                        />
                                      ) : group.assignedCount === group.totalEmployees ? (
                                        <Chip
                                          label={group.totalEmployees}
                                          color="info"
                                          sx={{ minWidth: 60, fontWeight: 'bold', fontSize: '1rem' }}
                                        />
                                      ) : (
                                        <Chip
                                          label={group.totalEmployees}
                                          color="warning"
                                          sx={{ minWidth: 60, fontWeight: 'bold', fontSize: '1rem' }}
                                        />
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {group.completedCount === group.totalEmployees ? (
                                        <Chip label="All Evaluated" color="success" size="small" />
                                      ) : group.assignedCount === group.totalEmployees ? (
                                        <Chip label="Pending Evaluation" color="info" size="small" />
                                      ) : (
                                        <Chip label="Partially Evaluated" color="warning" size="small" />
                                      )}
                                    </TableCell>
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
          )}

          {/* Payment Report */}
          {selectedReport === 'payments' && (
          <Box>
            <Paper sx={{ mb: 3, p: 3, backgroundColor: 'success.main', color: 'white' }}>
              <Box display="flex" alignItems="center">
                <MoneyIcon sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" gutterBottom>
                    Payment Report
                  </Typography>
                  <Typography variant="body1">
                    Calculate and analyze employee payments based on completed assignments
                  </Typography>
                </Box>
              </Box>
            </Paper>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card elevation={3}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="success.main">
                      Report Parameters
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
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ px: 1, mt: 2 }}>
                      Summary
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card elevation={3} sx={{ backgroundColor: 'info.light', color: 'white' }}>
                      <CardContent>
                        <Typography variant="body2" sx={{ opacity: 0.9 }} gutterBottom>
                          Total Employees
                        </Typography>
                        <Typography variant="h3" fontWeight="bold">
                          {paymentReport.totalEmployees}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card elevation={3} sx={{ backgroundColor: 'primary.main', color: 'white' }}>
                      <CardContent>
                        <Typography variant="body2" sx={{ opacity: 0.9 }} gutterBottom>
                          Report Period
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {format(new Date(paymentReport.periodStartDate), 'MMM dd, yyyy')}
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          to {format(new Date(paymentReport.periodEndDate), 'MMM dd, yyyy')}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card elevation={3} sx={{ backgroundColor: 'success.dark', color: 'white' }}>
                      <CardContent>
                        <Typography variant="body2" sx={{ opacity: 0.9 }} gutterBottom>
                          Total Net Payment
                        </Typography>
                        <Typography variant="h3" fontWeight="bold">
                          ₹{paymentReport.totalPaymentAmount ? paymentReport.totalPaymentAmount.toLocaleString() : '0'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Export Buttons */}
                  <Grid item xs={12}>
                    <Box display="flex" gap={2} justifyContent="flex-end" sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<PdfIcon />}
                        onClick={exportPaymentReportAsPDF}
                      >
                        Download PDF
                      </Button>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<ExcelIcon />}
                        onClick={exportPaymentReportAsExcel}
                      >
                        Download Excel
                      </Button>
                    </Box>
                  </Grid>

                  {/* Employee Payments Table */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ px: 1, mt: 3 }}>
                      Employee Payment Breakdown
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Card elevation={3}>
                      <CardContent>
                        <TableContainer>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>Employee</TableCell>
                                <TableCell>Base Salary</TableCell>
                                <TableCell>Employee PF (12%)</TableCell>
                                <TableCell>VPF</TableCell>
                                <TableCell>Employer PF (12%)</TableCell>
                                <TableCell>Assignments</TableCell>
                                <TableCell>Avg Completion</TableCell>
                                <TableCell align="right">Gross Payment</TableCell>
                                <TableCell align="right">Net Payment</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {paymentReport.employeePayments.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={9} align="center">
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
                                      {(payment.voluntaryPfPercentage ?? 0) > 0 && (
                                        <Typography variant="caption" display="block" color="primary" fontWeight="medium">
                                          +{payment.voluntaryPfPercentage}% VPF (Total: {12 + (payment.voluntaryPfPercentage || 0)}% EPF)
                                        </Typography>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {payment.currency} {payment.baseSalary ? payment.baseSalary.toLocaleString() : '0'}
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2" fontWeight="bold" sx={{ color: '#d32f2f' }}>
                                        -₹{payment.employeePfContribution ? payment.employeePfContribution.toLocaleString() : '0'}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2" fontWeight="bold" sx={{ color: '#ff5722' }}>
                                        {(payment.voluntaryPfContribution && payment.voluntaryPfContribution > 0) 
                                          ? `-₹${payment.voluntaryPfContribution.toLocaleString()}` 
                                          : '-'}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2" fontWeight="bold" sx={{ color: '#2e7d32' }}>
                                        +₹{payment.employerPfContribution ? payment.employerPfContribution.toLocaleString() : '0'}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>{payment.totalAssignments || 0}</TableCell>
                                    <TableCell>
                                      <Chip
                                        label={`${payment.averageCompletionPercentage ? payment.averageCompletionPercentage.toFixed(0) : '0'}%`}
                                        color={
                                          (payment.averageCompletionPercentage || 0) >= 90
                                            ? 'success'
                                            : (payment.averageCompletionPercentage || 0) >= 70
                                            ? 'primary'
                                            : 'warning'
                                        }
                                        size="small"
                                      />
                                    </TableCell>
                                    <TableCell align="right">
                                      <Typography variant="body1">
                                        ₹{payment.calculatedPayment ? payment.calculatedPayment.toLocaleString() : '0'}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                      <Typography variant="h6" color="primary">
                                        ₹{payment.netPayment ? payment.netPayment.toLocaleString() : '0'}
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                              {paymentReport.employeePayments.length > 0 && (
                                <TableRow sx={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>
                                  <TableCell colSpan={2}>
                                    <Typography variant="h6" fontWeight="bold">Total:</Typography>
                                  </TableCell>
                                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                    <Typography variant="body1" fontWeight="bold" color="error">
                                      -₹{paymentReport.totalEmployeePfContribution ? paymentReport.totalEmployeePfContribution.toLocaleString() : '0'}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                    <Typography variant="body1" fontWeight="bold" sx={{ color: '#ff5722' }}>
                                      -₹{paymentReport.totalVoluntaryPfContribution ? paymentReport.totalVoluntaryPfContribution.toLocaleString() : '0'}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                    <Typography variant="body1" fontWeight="bold" color="success.main">
                                      +₹{paymentReport.totalEmployerPfContribution ? paymentReport.totalEmployerPfContribution.toLocaleString() : '0'}
                                    </Typography>
                                  </TableCell>
                                  <TableCell colSpan={2}></TableCell>
                                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                    <Typography variant="body1" fontWeight="bold">
                                      ₹{paymentReport.employeePayments.reduce((sum, p) => sum + (p.calculatedPayment || 0), 0).toLocaleString()}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                    <Typography variant="h6" color="primary" fontWeight="bold">
                                      ₹{paymentReport.totalPaymentAmount ? paymentReport.totalPaymentAmount.toLocaleString() : '0'}
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
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Reports;


