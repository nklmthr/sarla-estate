import React, { useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  Grid,
  TextField,
  MenuItem,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Chip,
  Alert,
} from '@mui/material';
import {
  Assessment as ReportIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  AccountBalance as BankIcon,
} from '@mui/icons-material';
import pfReportApi, { PfReport } from '../../api/pfReportApi';
import { useError } from '../../contexts/ErrorContext';

const PfReportPage: React.FC = () => {
  const { showError, showSuccess } = useError();
  const currentDate = new Date();
  
  const [month, setMonth] = useState(currentDate.getMonth() + 1); // 1-12
  const [year, setYear] = useState(currentDate.getFullYear());
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<PfReport | null>(null);

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const data = await pfReportApi.generatePfReport({ month, year });
      setReport(data);
      showSuccess('PF Report generated successfully');
    } catch (error: any) {
      showError({
        title: 'Failed to generate report',
        message: error.message || 'Could not generate PF report',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === '-') return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box display="flex" alignItems="center" gap={2}>
          <BankIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Monthly PF Report
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Provident Fund report for paid payments
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3, p: 3 }} className="no-print">
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              select
              label="Month"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {months.map((m) => (
                <MenuItem key={m.value} value={m.value}>
                  {m.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              select
              label="Year"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {years.map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              fullWidth
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <ReportIcon />}
              onClick={handleGenerateReport}
              disabled={loading}
              size="large"
            >
              Generate Report
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Report Display */}
      {report && (
        <>
          {/* Actions */}
          <Box sx={{ mb: 2, display: 'flex', gap: 2 }} className="no-print">
            <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>
              Print
            </Button>
            <Button variant="outlined" startIcon={<DownloadIcon />}>
              Export to Excel
            </Button>
          </Box>

          {/* Report Header */}
          <Card sx={{ mb: 3, p: 3 }}>
            <Box textAlign="center" mb={2}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Provident Fund Report
              </Typography>
              <Typography variant="h6" color="primary">
                {report.monthName} {report.year}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Generated on {new Date().toLocaleDateString('en-IN', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Typography>
            </Box>

            {/* Summary Cards */}
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                  <Typography variant="caption">Total Employees</Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {report.totals.totalEmployees}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                  <Typography variant="caption">Total Payments</Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {report.totals.totalPayments}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                  <Typography variant="caption">Total PF Deduction</Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {formatCurrency(report.totals.totalPfDeduction)}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
                  <Typography variant="caption">Net Amount Paid</Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {formatCurrency(report.totals.totalNetAmount)}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Card>

          {/* Employee-wise Details */}
          {report.employees.length === 0 ? (
            <Alert severity="info" sx={{ mb: 3 }}>
              No paid payments found for {report.monthName} {report.year}
            </Alert>
          ) : (
            report.employees.map((employee, index) => (
              <Card key={employee.employeeId} sx={{ mb: 3, pageBreakInside: 'avoid' }}>
                {/* Employee Header */}
                <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                      <Typography variant="h6" fontWeight="bold">
                        {index + 1}. {employee.employeeName}
                      </Typography>
                      <Box display="flex" gap={2} mt={1}>
                        <Chip 
                          label={`PF A/C: ${employee.pfAccountId}`} 
                          size="small" 
                          sx={{ bgcolor: 'white', fontWeight: 'bold' }}
                        />
                        {employee.phoneNumber && (
                          <Chip 
                            label={`Ph: ${employee.phoneNumber}`} 
                            size="small" 
                            sx={{ bgcolor: 'white' }}
                          />
                        )}
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4} textAlign={{ xs: 'left', md: 'right' }}>
                      <Typography variant="body2">Total Payments: {employee.totals.totalPayments}</Typography>
                      <Typography variant="body2">Total Assignments: {employee.totals.totalAssignments}</Typography>
                    </Grid>
                  </Grid>
                </Box>

                {/* Payment Details Table */}
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.100' }}>
                        <TableCell>Payment Date</TableCell>
                        <TableCell>Reference #</TableCell>
                        <TableCell align="right">Assignments</TableCell>
                        <TableCell align="right">Gross Amount</TableCell>
                        <TableCell align="right">Employee PF (12%)</TableCell>
                        <TableCell align="right">Voluntary PF</TableCell>
                        <TableCell align="right">Employer PF (12%)</TableCell>
                        <TableCell align="right">Total Deduction</TableCell>
                        <TableCell align="right">Net Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {employee.payments.map((payment) => (
                        <TableRow key={payment.paymentId}>
                          <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                          <TableCell>{payment.referenceNumber}</TableCell>
                          <TableCell align="right">{payment.assignmentCount}</TableCell>
                          <TableCell align="right">{formatCurrency(payment.grossAmount)}</TableCell>
                          <TableCell align="right">{formatCurrency(payment.employeePf)}</TableCell>
                          <TableCell align="right">{formatCurrency(payment.voluntaryPf)}</TableCell>
                          <TableCell align="right">{formatCurrency(payment.employerPf)}</TableCell>
                          <TableCell align="right">{formatCurrency(payment.totalPf)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            {formatCurrency(payment.netAmount)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Employee Totals Row */}
                      <TableRow sx={{ bgcolor: 'primary.light' }}>
                        <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>
                          TOTAL
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          {employee.totals.totalAssignments}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          {formatCurrency(employee.totals.totalGrossAmount)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          {formatCurrency(employee.totals.totalEmployeePf)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          {formatCurrency(employee.totals.totalVoluntaryPf)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          {formatCurrency(employee.totals.totalEmployerPf)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          {formatCurrency(employee.totals.totalPfDeduction)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          {formatCurrency(employee.totals.totalNetAmount)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            ))
          )}

          {/* Grand Total */}
          {report.employees.length > 0 && (
            <Card sx={{ p: 3, bgcolor: 'success.light' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                GRAND TOTAL - All Employees
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6} sm={4} md={3}>
                  <Typography variant="caption" color="text.secondary">
                    Total Gross Amount
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {formatCurrency(report.totals.totalGrossAmount)}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={4} md={3}>
                  <Typography variant="caption" color="text.secondary">
                    Total Employee PF (12%)
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {formatCurrency(report.totals.totalEmployeePf)}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={4} md={3}>
                  <Typography variant="caption" color="text.secondary">
                    Total Voluntary PF
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {formatCurrency(report.totals.totalVoluntaryPf)}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={4} md={3}>
                  <Typography variant="caption" color="text.secondary">
                    Total Employer PF (12%)
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {formatCurrency(report.totals.totalEmployerPf)}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={4} md={3}>
                  <Typography variant="caption" color="text.secondary">
                    Total PF Deduction
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="error">
                    {formatCurrency(report.totals.totalPfDeduction)}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={4} md={3}>
                  <Typography variant="caption" color="text.secondary">
                    Total Net Amount Paid
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="success.main">
                    {formatCurrency(report.totals.totalNetAmount)}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={4} md={3}>
                  <Typography variant="caption" color="text.secondary">
                    Total Employees
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {report.totals.totalEmployees}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={4} md={3}>
                  <Typography variant="caption" color="text.secondary">
                    Total Assignments
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {report.totals.totalAssignments}
                  </Typography>
                </Grid>
              </Grid>
            </Card>
          )}
        </>
      )}

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          @page {
            margin: 1cm;
          }
        }
      `}</style>
    </Box>
  );
};

export default PfReportPage;

