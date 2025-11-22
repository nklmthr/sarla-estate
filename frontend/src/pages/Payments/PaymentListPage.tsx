import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Check as ApproveIcon,
  Payment as PaymentIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { paymentApi, Payment, PaymentStatus } from '../../api/paymentApi';
import { useError } from '../../contexts/ErrorContext';

const PaymentListPage: React.FC = () => {
  const navigate = useNavigate();
  const { showError, showSuccess } = useError();
  
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  
  // Dialog states
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');

  useEffect(() => {
    loadPayments();
  }, []);

  useEffect(() => {
    filterPayments();
  }, [tabValue, payments]);

  const loadPayments = async () => {
    const isInitial = payments.length === 0;
    if (isInitial) {
      setInitialLoading(true);
    }
    try {
      const data = await paymentApi.getAllPayments();
      setPayments(data);
    } catch (error: any) {
      showError({
        title: 'Failed to load payments',
        message: error.message || 'Could not fetch payments',
        severity: 'error',
      });
    } finally {
      if (isInitial) {
        setInitialLoading(false);
      }
    }
  };

  const handleCreatePayment = async () => {
    setCreateLoading(true);
    try {
      // Get current month and year
      const now = new Date();
      const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
      const currentYear = now.getFullYear();
      
      // Create a new draft payment
      const newPayment = await paymentApi.createDraft({
        paymentMonth: currentMonth,
        paymentYear: currentYear,
        description: `Payment for ${now.toLocaleString('en-US', { month: 'long', year: 'numeric' })}`,
        assignmentIds: [], // Start with empty, user will add assignments later
      });
      // Navigate directly to the detail page - user can see the created draft there
      navigate(`/payments/${newPayment.id}`);
    } catch (error: any) {
      showError({
        title: 'Failed to create payment',
        message: error.message || 'Could not create payment draft',
        severity: 'error',
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const filterPayments = () => {
    let filtered = payments;
    
    switch (tabValue) {
      case 1: // Draft
        filtered = payments.filter(p => p.status === PaymentStatus.DRAFT);
        break;
      case 2: // Pending Approval
        filtered = payments.filter(p => p.status === PaymentStatus.PENDING_APPROVAL);
        break;
      case 3: // Approved
        filtered = payments.filter(p => p.status === PaymentStatus.APPROVED);
        break;
      case 4: // Paid
        filtered = payments.filter(p => p.status === PaymentStatus.PAID);
        break;
      default: // All
        filtered = payments;
    }
    
    setFilteredPayments(filtered);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, payment: Payment) => {
    setAnchorEl(event.currentTarget);
    setSelectedPayment(payment);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleViewPayment = () => {
    if (selectedPayment) {
      navigate(`/payments/${selectedPayment.id}`);
    }
    handleMenuClose();
  };

  const handleCancelPayment = () => {
    setCancelDialogOpen(true);
    handleMenuClose();
  };

  const confirmCancelPayment = async () => {
    if (!selectedPayment || !cancellationReason.trim()) {
      showError({
        title: 'Validation Error',
        message: 'Cancellation reason is required',
        severity: 'error',
      });
      return;
    }

    try {
      await paymentApi.cancelPayment(selectedPayment.id, {
        cancellationReason: cancellationReason,
      });
      showSuccess('Payment cancelled successfully. Assignments are now unlocked.');
      setCancelDialogOpen(false);
      setCancellationReason('');
      setSelectedPayment(null);
      loadPayments();
    } catch (error: any) {
      showError({
        title: 'Failed to cancel payment',
        message: error.message || 'Could not cancel payment',
        severity: 'error',
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatMonthYear = (month?: number, year?: number) => {
    if (!month || !year) return '-';
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
    });
  };

  const canEdit = (payment: Payment) => payment.status === PaymentStatus.DRAFT;
  const canCancel = (payment: Payment) => 
    payment.status === PaymentStatus.PENDING_APPROVAL || 
    payment.status === PaymentStatus.APPROVED;

  if (initialLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Payments</Typography>
        <Button
          variant="contained"
          startIcon={createLoading ? <CircularProgress size={20} /> : <AddIcon />}
          onClick={handleCreatePayment}
          disabled={createLoading}
        >
          {createLoading ? 'Creating...' : 'Create Payment Draft'}
        </Button>
      </Box>

      <Card>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label={`All (${payments.length})`} />
          <Tab label={`Draft (${payments.filter(p => p.status === PaymentStatus.DRAFT).length})`} />
          <Tab label={`Pending (${payments.filter(p => p.status === PaymentStatus.PENDING_APPROVAL).length})`} />
          <Tab label={`Approved (${payments.filter(p => p.status === PaymentStatus.APPROVED).length})`} />
          <Tab label={`Paid (${payments.filter(p => p.status === PaymentStatus.PAID).length})`} />
        </Tabs>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Period</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Total Amount</TableCell>
                <TableCell>Payment Date</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="text.secondary" sx={{ py: 3 }}>
                      No payments found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((payment) => (
                  <TableRow key={payment.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {formatMonthYear(payment.paymentMonth, payment.paymentYear)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={paymentApi.getStatusLabel(payment.status)}
                        color={paymentApi.getStatusColor(payment.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(payment.totalAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                    <TableCell>{payment.referenceNumber || '-'}</TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(payment.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, payment)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewPayment}>
          <ViewIcon fontSize="small" sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        {selectedPayment && canEdit(selectedPayment) && (
          <MenuItem onClick={handleViewPayment}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Edit Draft
          </MenuItem>
        )}
        {selectedPayment && canCancel(selectedPayment) && (
          <MenuItem onClick={handleCancelPayment}>
            <CancelIcon fontSize="small" sx={{ mr: 1 }} />
            Cancel Payment
          </MenuItem>
        )}
      </Menu>

      {/* Cancel Payment Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cancel Payment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Cancelling this payment will unlock all associated assignments, allowing you to make corrections.
            This action will be recorded in the payment history.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Cancellation Reason *"
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            placeholder="Please explain why this payment is being cancelled..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmCancelPayment}
            variant="contained"
            color="error"
            disabled={!cancellationReason.trim()}
          >
            Confirm Cancellation
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentListPage;

