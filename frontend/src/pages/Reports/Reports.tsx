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
  Assignment as AssignmentIcon,
  AttachMoney as MoneyIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  AccountBalance as PfIcon,
} from '@mui/icons-material';
import { reportApi } from '../../api/reportApi';
import pfReportApi, { PfReport } from '../../api/pfReportApi';
import { UpcomingAssignmentsReport, PaymentReport, WorkAssignment, AssignmentAuditReport } from '../../types';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import HistoryIcon from '@mui/icons-material/History';
import './Reports.css';

const Reports: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<'assignments' | 'payments' | 'evaluation' | 'pf'>('payments');
  const [loading, setLoading] = useState(false);
  
  // Assignment Report
  const [assignmentsReport, setAssignmentsReport] = useState<UpcomingAssignmentsReport | null>(null);
  const [reportDate, setReportDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // Payment Report
  const [paymentReport, setPaymentReport] = useState<PaymentReport | null>(null);
  const [paymentStartDate, setPaymentStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [paymentEndDate, setPaymentEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  
  // Assignment Audit Report
  const [auditReport, setAuditReport] = useState<AssignmentAuditReport | null>(null);
  const [auditStartDate, setAuditStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [auditEndDate, setAuditEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  // PF Report
  const [pfReport, setPfReport] = useState<PfReport | null>(null);
  const [pfMonth, setPfMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [pfYear, setPfYear] = useState(new Date().getFullYear());

  const loadDailyAssignments = async () => {
    try {
      setLoading(true);
      // Use the same date for both start and end to get single day report
      const data = await reportApi.getUpcomingAssignments(reportDate, reportDate);
      setAssignmentsReport(data);
    } catch (error) {
      // Error handled by global interceptor
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
      // Error handled by global interceptor
    } finally {
      setLoading(false);
    }
  };

  const loadAuditReport = async () => {
    try {
      setLoading(true);
      const data = await reportApi.getAssignmentAuditReport(auditStartDate, auditEndDate);
      setAuditReport(data);
    } catch (error) {
      // Error handled by global interceptor
    } finally {
      setLoading(false);
    }
  };

  const loadPfReport = async () => {
    try {
      setLoading(true);
      const data = await pfReportApi.generatePfReport({ month: pfMonth, year: pfYear });
      setPfReport(data);
    } catch (error) {
      // Error handled by global interceptor
    } finally {
      setLoading(false);
    }
  };

  // Format minutes into readable time duration
  const formatMinutesToDuration = (minutes: number | undefined): string => {
    if (minutes === undefined || minutes === null) return '-';
    
    if (minutes === 0) return '0m';
    
    const days = Math.floor(minutes / (24 * 60));
    const hours = Math.floor((minutes % (24 * 60)) / 60);
    const mins = Math.floor(minutes % 60);
    
    if (days > 0) {
      return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
    } else if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    } else {
      return `${mins}m`;
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
      // Error handled by global interceptor
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
      <Box sx={{ display: 'flex', gap: 3 }}>
        {/* Left Sidebar Navigation */}
        <Paper 
          sx={{ 
            width: 200, 
            minHeight: 'calc(100vh - 200px)',
            position: 'sticky',
            top: 100,
            alignSelf: 'flex-start'
          }}
        >
          <Box sx={{ p: 1.5 }}>
            <Typography variant="subtitle1" fontWeight="600" sx={{ px: 1 }}>
              Reports
            </Typography>
          </Box>
          <Divider />
          <List dense>
            <ListItem disablePadding>
              <ListItemButton
                selected={selectedReport === 'payments'}
                onClick={() => setSelectedReport('payments')}
                sx={{
                  py: 1,
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
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <MoneyIcon fontSize="small" color={selectedReport === 'payments' ? 'inherit' : 'primary'} />
                </ListItemIcon>
                <ListItemText 
                  primary="Payment" 
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                selected={selectedReport === 'assignments'}
                onClick={() => setSelectedReport('assignments')}
                sx={{
                  py: 1,
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
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <AssignmentIcon fontSize="small" color={selectedReport === 'assignments' ? 'inherit' : 'primary'} />
                </ListItemIcon>
                <ListItemText 
                  primary="Assignments" 
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                selected={selectedReport === 'evaluation'}
                onClick={() => setSelectedReport('evaluation')}
                sx={{
                  py: 1,
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
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <HistoryIcon fontSize="small" color={selectedReport === 'evaluation' ? 'inherit' : 'primary'} />
                </ListItemIcon>
                <ListItemText 
                  primary="Evaluation" 
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItemButton>
            </ListItem>
            <Divider sx={{ my: 1 }} />
            <ListItem disablePadding>
              <ListItemButton
                selected={selectedReport === 'pf'}
                onClick={() => setSelectedReport('pf')}
                sx={{
                  py: 1,
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
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <PfIcon fontSize="small" color={selectedReport === 'pf' ? 'inherit' : 'primary'} />
                </ListItemIcon>
                <ListItemText 
                  primary="PF Report" 
                  primaryTypographyProps={{ variant: 'body2' }}
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
            <Paper sx={{ mb: 2, p: 2, backgroundColor: 'primary.light', color: 'primary.contrastText' }}>
              <Box display="flex" alignItems="center">
                <AssignmentIcon sx={{ mr: 1.5, fontSize: 32, color: 'primary.contrastText' }} />
                <Box>
                  <Typography variant="h5" sx={{ color: 'primary.contrastText', mb: 0.5 }}>
                    Assignment Report
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'primary.contrastText', opacity: 0.9 }}>
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
                    <Typography variant="h6" gutterBottom sx={{ px: 1, mt: 1 }}>
                      Summary
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card elevation={3} sx={{ 
                      background: 'linear-gradient(135deg, #64B5F6 0%, #42A5F5 100%)', 
                      color: 'white' 
                    }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                          Total Assignments
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" sx={{ mt: 0.5 }}>
                          {getFilteredAssignments().length}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card elevation={3} sx={{ 
                      background: 'linear-gradient(135deg, #81C784 0%, #66BB6A 100%)', 
                      color: 'white' 
                    }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                          Evaluated
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" sx={{ mt: 0.5 }}>
                          {getEvaluatedCount()}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card elevation={3} sx={{ 
                      background: 'linear-gradient(135deg, #FFB74D 0%, #FFA726 100%)', 
                      color: 'white' 
                    }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                          Pending Evaluation
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" sx={{ mt: 0.5 }}>
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

          {/* Assignment Evaluation Report */}
          {selectedReport === 'evaluation' && (
          <Box>
            <Paper sx={{ mb: 2, p: 2, backgroundColor: 'primary.light', color: 'primary.contrastText' }}>
              <Box display="flex" alignItems="center">
                <HistoryIcon sx={{ mr: 1.5, fontSize: 32, color: 'primary.contrastText' }} />
                <Box>
                  <Typography variant="h5" sx={{ color: 'primary.contrastText', mb: 0.5 }}>
                    Assignment Evaluation Report
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'primary.contrastText', opacity: 0.9 }}>
                    Track assignment creation and evaluation times including deleted assignments
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
                          label="Start Date"
                          value={auditStartDate}
                          onChange={(e) => setAuditStartDate(e.target.value)}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          type="date"
                          label="End Date"
                          value={auditEndDate}
                          onChange={(e) => setAuditEndDate(e.target.value)}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Button
                          variant="contained"
                          onClick={loadAuditReport}
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

              {!loading && auditReport && (
                <>
                  {/* Summary Cards */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ px: 1, mt: 1 }}>
                      Summary
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card elevation={3} sx={{ background: 'linear-gradient(135deg, #64B5F6 0%, #42A5F5 100%)', color: 'white' }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                          Total Evaluated
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" sx={{ mt: 0.5 }}>
                          {auditReport.totalEvaluatedAssignments}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card elevation={3} sx={{ background: 'linear-gradient(135deg, #FFB74D 0%, #FFA726 100%)', color: 'white' }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                          Re-Evaluated
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" sx={{ mt: 0.5 }}>
                          {auditReport.reEvaluatedAssignments}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card elevation={3} sx={{ background: 'linear-gradient(135deg, #E57373 0%, #EF5350 100%)', color: 'white' }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                          Deleted
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" sx={{ mt: 0.5 }}>
                          {auditReport.deletedAssignments}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Audit Details Table */}
                  <Grid item xs={12}>
                    <Card elevation={3}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                          <Typography variant="h6" color="primary">
                            Assignment Evaluation Details
                          </Typography>
                          <Box>
                            <Button
                              startIcon={<PdfIcon />}
                              size="small"
                              sx={{ mr: 1 }}
                              onClick={() => { /* Add export PDF */ }}
                            >
                              Export PDF
                            </Button>
                            <Button
                              startIcon={<ExcelIcon />}
                              size="small"
                              color="success"
                              onClick={() => { /* Add export Excel */ }}
                            >
                              Export Excel
                            </Button>
                          </Box>
                        </Box>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell><strong>Activity</strong></TableCell>
                                <TableCell><strong>Employee</strong></TableCell>
                                <TableCell><strong>Date</strong></TableCell>
                                <TableCell><strong>Created</strong></TableCell>
                                <TableCell><strong>First Eval</strong></TableCell>
                                <TableCell><strong>Last Eval</strong></TableCell>
                                <TableCell><strong>Min Eval Time</strong></TableCell>
                                <TableCell><strong>Max Eval Time</strong></TableCell>
                                <TableCell><strong>Completion %</strong></TableCell>
                                <TableCell><strong>Deleted</strong></TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {auditReport.assignments.map((assignment) => (
                                <TableRow key={assignment.assignmentId} sx={{ bgcolor: assignment.deleted ? 'error.50' : 'inherit' }}>
                                  <TableCell>{assignment.activityName}</TableCell>
                                  <TableCell>{assignment.employeeName}</TableCell>
                                  <TableCell>{format(new Date(assignment.assignmentDate), 'dd-MMM')}</TableCell>
                                  <TableCell>{assignment.assignedAt ? format(new Date(assignment.assignedAt), 'dd-MMM HH:mm') : '-'}</TableCell>
                                  <TableCell>{assignment.firstEvaluatedAt ? format(new Date(assignment.firstEvaluatedAt), 'dd-MMM HH:mm') : '-'}</TableCell>
                                  <TableCell>
                                    {assignment.lastEvaluatedAt ? (
                                      <Box>
                                        <Typography variant="body2">{format(new Date(assignment.lastEvaluatedAt), 'dd-MMM HH:mm')}</Typography>
                                        {assignment.evaluationCount > 1 && (
                                          <Chip 
                                            label={`${assignment.evaluationCount}x`}
                                            size="small" 
                                            color="warning"
                                            sx={{ mt: 0.5 }}
                                          />
                                        )}
                                      </Box>
                                    ) : (
                                      <Typography variant="body2" color="text.secondary">-</Typography>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Chip 
                                      label={formatMinutesToDuration(assignment.minEvalTimeMinutes)}
                                      size="small"
                                      variant="outlined"
                                      color="success"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Chip 
                                      label={formatMinutesToDuration(assignment.maxEvalTimeMinutes)}
                                      size="small"
                                      variant="outlined"
                                      color={assignment.evaluationCount > 1 ? 'warning' : 'success'}
                                    />
                                  </TableCell>
                                  <TableCell align="center">{assignment.completionPercentage ?? '-'}</TableCell>
                                  <TableCell>
                                    {assignment.deleted ? (
                                      <Chip label="DELETED" size="small" color="error" />
                                    ) : (
                                      <Chip label="ACTIVE" size="small" color="success" />
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
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
            <Paper sx={{ mb: 2, p: 2, backgroundColor: 'primary.light', color: 'primary.contrastText' }}>
              <Box display="flex" alignItems="center">
                <MoneyIcon sx={{ mr: 1.5, fontSize: 32, color: 'primary.contrastText' }} />
                <Box>
                  <Typography variant="h5" sx={{ color: 'primary.contrastText', mb: 0.5 }}>
                    Payment Report
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'primary.contrastText', opacity: 0.9 }}>
                    Calculate and analyze employee payments based on completed assignments
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
                    <Typography variant="h6" gutterBottom sx={{ px: 1, mt: 1 }}>
                      Summary
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card elevation={3} sx={{ 
                      background: 'linear-gradient(135deg, #64B5F6 0%, #42A5F5 100%)', 
                      color: 'white' 
                    }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.9)' }}>
                          Total Employees
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" sx={{ mt: 0.5, color: 'white' }}>
                          {paymentReport.totalEmployees}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card elevation={3} sx={{ 
                      background: 'linear-gradient(135deg, #7E57C2 0%, #5E35B1 100%)', 
                      color: 'white' 
                    }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.9)' }}>
                          Report Period
                        </Typography>
                        <Typography variant="body2" fontWeight="medium" sx={{ mt: 0.5, color: 'white' }}>
                          {format(new Date(paymentReport.periodStartDate), 'MMM dd, yyyy')}
                        </Typography>
                        <Typography variant="body2" fontWeight="medium" sx={{ color: 'white' }}>
                          to {format(new Date(paymentReport.periodEndDate), 'MMM dd, yyyy')}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card elevation={3} sx={{ 
                      background: 'linear-gradient(135deg, #66BB6A 0%, #43A047 100%)', 
                      color: 'white' 
                    }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.9)' }}>
                          Total Net Payment
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" sx={{ mt: 0.5, color: 'white' }}>
                          ₹{paymentReport.totalPaymentAmount ? paymentReport.totalPaymentAmount.toLocaleString() : '0'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Export Buttons */}
                  <Grid item xs={12}>
                    <Card elevation={3}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="h6" color="primary">
                            Employee Payment Breakdown
                          </Typography>
                          <Box>
                            <Button
                              startIcon={<PdfIcon />}
                              size="small"
                              sx={{ mr: 1 }}
                              onClick={exportPaymentReportAsPDF}
                            >
                              Export PDF
                            </Button>
                            <Button
                              startIcon={<ExcelIcon />}
                              size="small"
                              color="success"
                              onClick={exportPaymentReportAsExcel}
                            >
                              Export Excel
                            </Button>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Employee Payments Table */}
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
                                      <Typography variant="body2" fontWeight="bold" color="success.main">
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

          {/* PF Report */}
          {selectedReport === 'pf' && (
          <Box>
            <Paper sx={{ mb: 2, p: 2, backgroundColor: 'primary.light', color: 'primary.contrastText' }}>
              <Box display="flex" alignItems="center">
                <PfIcon sx={{ mr: 1.5, fontSize: 32, color: 'primary.contrastText' }} />
                <Box>
                  <Typography variant="h5" sx={{ color: 'primary.contrastText', mb: 0.5 }}>
                    Monthly PF Report
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'primary.contrastText', opacity: 0.9 }}>
                    Provident Fund report for paid payments
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
                        <FormControl fullWidth>
                          <InputLabel>Month</InputLabel>
                          <Select
                            value={pfMonth}
                            label="Month"
                            onChange={(e) => setPfMonth(Number(e.target.value))}
                          >
                            <MenuItem value={1}>January</MenuItem>
                            <MenuItem value={2}>February</MenuItem>
                            <MenuItem value={3}>March</MenuItem>
                            <MenuItem value={4}>April</MenuItem>
                            <MenuItem value={5}>May</MenuItem>
                            <MenuItem value={6}>June</MenuItem>
                            <MenuItem value={7}>July</MenuItem>
                            <MenuItem value={8}>August</MenuItem>
                            <MenuItem value={9}>September</MenuItem>
                            <MenuItem value={10}>October</MenuItem>
                            <MenuItem value={11}>November</MenuItem>
                            <MenuItem value={12}>December</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <FormControl fullWidth>
                          <InputLabel>Year</InputLabel>
                          <Select
                            value={pfYear}
                            label="Year"
                            onChange={(e) => setPfYear(Number(e.target.value))}
                          >
                            {[2025, 2024, 2023, 2022, 2021].map((y) => (
                              <MenuItem key={y} value={y}>{y}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Button
                          variant="contained"
                          onClick={loadPfReport}
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

              {!loading && pfReport && pfReport.employees.length === 0 && (
                <Grid item xs={12}>
                  <Card elevation={3}>
                    <CardContent>
                      <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                        <PfIcon sx={{ fontSize: 60, mb: 2 }} />
                        <Typography variant="h6">No paid payments found</Typography>
                        <Typography variant="body2">
                          No paid payments found for {pfReport.monthName} {pfReport.year}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {!loading && pfReport && pfReport.employees.length > 0 && (
                <>
                  {/* Printable Report Wrapper */}
                  <div className="printable-report">
                    {/* Print Header - visible only when printing */}
                    <div className="print-header" style={{ display: 'none' }}>
                      <h1>Sarla Tea Estates CRM</h1>
                      <h2>Monthly PF Report</h2>
                      <p>Provident Fund report for paid payments</p>
                      <p><strong>{pfReport.monthName} {pfReport.year}</strong></p>
                    </div>

                    {/* Print Summary - visible only when printing */}
                    <div className="print-summary" style={{ display: 'none' }}>
                      <div className="print-summary-item">
                        <div className="print-summary-label">Total Employees</div>
                        <div className="print-summary-value">{pfReport.totals.totalEmployees}</div>
                      </div>
                      <div className="print-summary-item">
                        <div className="print-summary-label">Employee PF (12%)</div>
                        <div className="print-summary-value">₹{pfReport.totals.totalEmployeePf.toLocaleString()}</div>
                      </div>
                      <div className="print-summary-item">
                        <div className="print-summary-label">Voluntary PF</div>
                        <div className="print-summary-value">₹{pfReport.totals.totalVoluntaryPf.toLocaleString()}</div>
                      </div>
                      <div className="print-summary-item">
                        <div className="print-summary-label">Employer PF (12%)</div>
                        <div className="print-summary-value">₹{pfReport.totals.totalEmployerPf.toLocaleString()}</div>
                      </div>
                      <div className="print-summary-item">
                        <div className="print-summary-label">Total PF to Govt</div>
                        <div className="print-summary-value">₹{(pfReport.totals.totalEmployeePf + pfReport.totals.totalVoluntaryPf + pfReport.totals.totalEmployerPf).toLocaleString()}</div>
                      </div>
                    </div>

                  {/* Summary Cards - hide in print */}
                  <Grid item xs={12} className="no-print">
                    <Typography variant="h6" gutterBottom sx={{ px: 1, mt: 1 }}>
                      Summary - {pfReport.monthName} {pfReport.year}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={2.4} className="no-print">
                    <Card elevation={3} sx={{ 
                      background: 'linear-gradient(135deg, #64B5F6 0%, #42A5F5 100%)', 
                      color: 'white' 
                    }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'white' }}>
                          Total Employees
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" sx={{ mt: 0.5, color: 'white' }}>
                          {pfReport.totals.totalEmployees}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={2.4} className="no-print">
                    <Card elevation={3} sx={{ 
                      background: 'linear-gradient(135deg, #EF5350 0%, #E53935 100%)', 
                      color: 'white' 
                    }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'white' }}>
                          Employee PF (12%)
                        </Typography>
                        <Typography variant="h5" fontWeight="bold" sx={{ mt: 0.5, color: 'white' }}>
                          ₹{pfReport.totals.totalEmployeePf.toLocaleString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={2.4} className="no-print">
                    <Card elevation={3} sx={{ 
                      background: 'linear-gradient(135deg, #FFA726 0%, #FF9800 100%)', 
                      color: 'white' 
                    }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'white' }}>
                          Voluntary PF
                        </Typography>
                        <Typography variant="h5" fontWeight="bold" sx={{ mt: 0.5, color: 'white' }}>
                          ₹{pfReport.totals.totalVoluntaryPf.toLocaleString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={2.4} className="no-print">
                    <Card elevation={3} sx={{ 
                      background: 'linear-gradient(135deg, #66BB6A 0%, #4CAF50 100%)', 
                      color: 'white' 
                    }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'white' }}>
                          Employer PF (12%)
                        </Typography>
                        <Typography variant="h5" fontWeight="bold" sx={{ mt: 0.5, color: 'white' }}>
                          ₹{pfReport.totals.totalEmployerPf.toLocaleString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={2.4} className="no-print">
                    <Card elevation={3} sx={{ 
                      background: 'linear-gradient(135deg, #7E57C2 0%, #673AB7 100%)', 
                      color: 'white',
                      border: '2px solid #FFD700'
                    }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'white' }}>
                          Total PF to Govt
                        </Typography>
                        <Typography variant="h5" fontWeight="bold" sx={{ mt: 0.5, color: 'white' }}>
                          ₹{(pfReport.totals.totalEmployeePf + pfReport.totals.totalVoluntaryPf + pfReport.totals.totalEmployerPf).toLocaleString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Export Buttons - hide in print */}
                  <Grid item xs={12} className="no-print">
                    <Card elevation={3}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="h6" color="primary">
                            Employee-wise PF Details
                          </Typography>
                          <Box>
                            <Button
                              startIcon={<PdfIcon />}
                              size="small"
                              sx={{ mr: 1 }}
                              onClick={() => window.print()}
                            >
                              Print/PDF
                            </Button>
                            <Button
                              startIcon={<ExcelIcon />}
                              size="small"
                              color="success"
                            >
                              Export Excel
                            </Button>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Employee-wise PF Table */}
                  <Grid item xs={12}>
                    <Card elevation={3}>
                      <CardContent>
                        <TableContainer sx={{ overflowX: 'auto' }}>
                          <Table size="small" sx={{ minWidth: 1000 }} className="printable-table">
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Employee</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem', minWidth: 100 }}>PF Acc ID</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem', display: { xs: 'none', md: 'table-cell' } }}>Phone</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Gross</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Emp PF</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>VPF</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Empr PF</TableCell>
                                <TableCell align="right" sx={{ backgroundColor: '#FFF3E0', fontWeight: 'bold', fontSize: '0.875rem' }} className="print-highlight">
                                  Total PF
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Net Amt</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {pfReport.employees.map((emp) => (
                                <TableRow key={emp.employeeId} hover>
                                  <TableCell sx={{ fontSize: '0.813rem' }}>
                                    <strong>{emp.employeeName}</strong>
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>
                                    <Chip label={emp.pfAccountId} size="small" color="primary" variant="outlined" sx={{ fontSize: '0.7rem', height: 20 }} />
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem', display: { xs: 'none', md: 'table-cell' } }}>
                                    {emp.phoneNumber || '-'}
                                  </TableCell>
                                  <TableCell align="right" sx={{ fontSize: '0.813rem' }}>
                                    ₹{emp.totals.totalGrossAmount.toLocaleString()}
                                  </TableCell>
                                  <TableCell align="right" sx={{ color: 'error.main', fontSize: '0.813rem' }}>
                                    ₹{emp.totals.totalEmployeePf.toLocaleString()}
                                  </TableCell>
                                  <TableCell align="right" sx={{ color: 'warning.main', fontSize: '0.813rem' }}>
                                    ₹{emp.totals.totalVoluntaryPf.toLocaleString()}
                                  </TableCell>
                                  <TableCell align="right" sx={{ color: 'success.main', fontSize: '0.813rem' }}>
                                    ₹{emp.totals.totalEmployerPf.toLocaleString()}
                                  </TableCell>
                                  <TableCell align="right" sx={{ backgroundColor: '#FFF3E0', fontWeight: 'bold', fontSize: '0.875rem' }} className="print-highlight">
                                    <Typography variant="body2" fontWeight="bold" color="primary">
                                      ₹{(emp.totals.totalEmployeePf + emp.totals.totalVoluntaryPf + emp.totals.totalEmployerPf).toLocaleString()}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right" sx={{ fontSize: '0.813rem' }}>
                                    <Typography variant="body2" fontWeight="bold">
                                      ₹{emp.totals.totalNetAmount.toLocaleString()}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              ))}
                              {/* Grand Total Row */}
                              <TableRow sx={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }} className="print-total-row">
                                <TableCell colSpan={3} sx={{ fontSize: '0.938rem' }}>
                                  <Typography variant="subtitle1" fontWeight="bold">TOTAL</Typography>
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
                                  ₹{pfReport.totals.totalGrossAmount.toLocaleString()}
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold', color: 'error.main', fontSize: '0.875rem' }}>
                                  ₹{pfReport.totals.totalEmployeePf.toLocaleString()}
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold', color: 'warning.main', fontSize: '0.875rem' }}>
                                  ₹{pfReport.totals.totalVoluntaryPf.toLocaleString()}
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main', fontSize: '0.875rem' }}>
                                  ₹{pfReport.totals.totalEmployerPf.toLocaleString()}
                                </TableCell>
                                <TableCell align="right" sx={{ backgroundColor: '#FFE082', fontWeight: 'bold' }} className="print-highlight">
                                  <Typography variant="subtitle1" color="primary" fontWeight="bold">
                                    ₹{(pfReport.totals.totalEmployeePf + pfReport.totals.totalVoluntaryPf + pfReport.totals.totalEmployerPf).toLocaleString()}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="subtitle1" color="primary" fontWeight="bold">
                                    ₹{pfReport.totals.totalNetAmount.toLocaleString()}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Print Footer - visible only when printing */}
                  <div className="print-footer" style={{ display: 'none' }}>
                    <p>Generated on: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
                    <p>Sarla Tea Estates CRM - Confidential Document</p>
                  </div>
                  </div>
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


