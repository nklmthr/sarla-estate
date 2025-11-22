import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  Typography,
  Button,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Divider,
  CircularProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  LinearProgress,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  Check as ApproveIcon,
  Payment as PaymentIcon,
  Cancel as CancelIcon,
  Lock as LockIcon,
  LockOpen as UnlockedIcon,
  Add as AddIcon,
  CloudUpload as UploadIcon,
  CloudDownload as DownloadIcon,
  AttachFile as FileIcon,
  Close as CloseIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { paymentApi, Payment, PaymentStatus, PaymentLineItem, PaymentHistory } from '../../api/paymentApi';
import { useError } from '../../contexts/ErrorContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const PaymentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showError, showSuccess } = useError();

  const [payment, setPayment] = useState<Payment | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // Dialog states
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [recordPaymentDialogOpen, setRecordPaymentDialogOpen] = useState(false);
  const [deleteLineItemDialogOpen, setDeleteLineItemDialogOpen] = useState(false);
  const [lineItemToDelete, setLineItemToDelete] = useState<string | null>(null);
  const [deleteDocumentDialogOpen, setDeleteDocumentDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);

  // Form states
  const [remarks, setRemarks] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(false);

  useEffect(() => {
    if (id) {
      loadPayment();
      loadPaymentHistory();
    }
  }, [id]);

  const loadPayment = async () => {
    if (!id) return;
    const isInitial = !payment;
    if (isInitial) {
      setInitialLoading(true);
    }
    try {
      const data = await paymentApi.getPaymentById(id);
      setPayment(data);
    } catch (error: any) {
      showError({
        title: 'Failed to load payment',
        message: error.message || 'Could not fetch payment details',
        severity: 'error',
      });
    } finally {
      if (isInitial) {
        setInitialLoading(false);
      }
    }
  };

  const loadPaymentHistory = async () => {
    if (!id) return;
    try {
      const history = await paymentApi.getPaymentHistory(id);
      setPaymentHistory(history);
    } catch (error: any) {
      console.error('Failed to load payment history:', error);
      // Don't show error to user, just log it
    }
  };

  const handleSubmitForApproval = async () => {
    if (!payment) return;
    setActionLoading(true);
    try {
      const updatedPayment = await paymentApi.submitForApproval(payment.id, { remarks });
      setPayment(updatedPayment);
      showSuccess('Payment submitted for approval. Assignments are now locked.');
      setSubmitDialogOpen(false);
      setRemarks('');
      loadPaymentHistory();
    } catch (error: any) {
      showError({
        title: 'Failed to submit payment',
        message: error.message || 'Could not submit payment for approval',
        severity: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!payment) return;
    setActionLoading(true);
    try {
      const updatedPayment = await paymentApi.approvePayment(payment.id, { remarks });
      setPayment(updatedPayment);
      showSuccess('Payment approved successfully');
      setApproveDialogOpen(false);
      setRemarks('');
      loadPaymentHistory();
    } catch (error: any) {
      showError({
        title: 'Failed to approve payment',
        message: error.message || 'Could not approve payment',
        severity: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!payment || !paymentDate || !referenceNumber) return;
    setActionLoading(true);
    try {
      // First record the payment
      const updatedPayment = await paymentApi.recordPayment(payment.id, {
        paymentDate,
        referenceNumber,
        remarks,
      });
      setPayment(updatedPayment);
      
      // Then upload documents if any
      if (uploadedFiles.length > 0) {
        setUploadProgress(true);
        for (const file of uploadedFiles) {
          const paymentWithDoc = await paymentApi.uploadDocument(
            payment.id,
            file,
            'PAYMENT_RECEIPT', // Default document type
            `Uploaded with payment on ${new Date().toLocaleDateString()}`
          );
          setPayment(paymentWithDoc);
        }
        setUploadProgress(false);
      }
      
      showSuccess(`Payment recorded successfully${uploadedFiles.length > 0 ? ` with ${uploadedFiles.length} document(s)` : ''}`);
      setRecordPaymentDialogOpen(false);
      setPaymentDate('');
      setReferenceNumber('');
      setRemarks('');
      setUploadedFiles([]);
      loadPaymentHistory();
    } catch (error: any) {
      setUploadProgress(false);
      showError({
        title: 'Failed to record payment',
        message: error.message || 'Could not record payment',
        severity: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      setUploadedFiles(prev => [...prev, ...files]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDownloadDocument = async (documentId: string, fileName: string) => {
    if (!payment) return;
    try {
      const blob = await paymentApi.downloadDocument(payment.id, documentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      showError({
        title: 'Failed to download document',
        message: error.message || 'Could not download document',
        severity: 'error',
      });
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    setDocumentToDelete(documentId);
    setDeleteDocumentDialogOpen(true);
  };

  const confirmDeleteDocument = async () => {
    if (!payment || !documentToDelete) return;
    
    try {
      const updatedPayment = await paymentApi.deleteDocument(payment.id, documentToDelete);
      setPayment(updatedPayment);
      // No success message needed - user already confirmed in dialog
      setDeleteDocumentDialogOpen(false);
      setDocumentToDelete(null);
      loadPaymentHistory();
    } catch (error: any) {
      showError({
        title: 'Failed to delete document',
        message: error.message || 'Could not delete document',
        severity: 'error',
      });
    }
  };

  const handleCancel = async () => {
    if (!payment || !cancellationReason) return;
    setActionLoading(true);
    try {
      const updatedPayment = await paymentApi.cancelPayment(payment.id, { cancellationReason });
      setPayment(updatedPayment);
      showSuccess('Payment cancelled. Assignments have been unlocked.');
      setCancelDialogOpen(false);
      setCancellationReason('');
      loadPaymentHistory();
    } catch (error: any) {
      showError({
        title: 'Failed to cancel payment',
        message: error.message || 'Could not cancel payment',
        severity: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!payment) return;
    try {
      await paymentApi.deletePayment(payment.id);
      setDeleteDialogOpen(false);
      navigate('/payments');
    } catch (error: any) {
      showError({
        title: 'Failed to delete payment',
        message: error.message || 'Could not delete payment',
        severity: 'error',
      });
    }
  };

  const handleDeleteLineItem = async (lineItemId: string) => {
    setLineItemToDelete(lineItemId);
    setDeleteLineItemDialogOpen(true);
  };

  const confirmDeleteLineItem = async () => {
    if (!payment || !lineItemToDelete) return;

    try {
      const updatedPayment = await paymentApi.removeLineItem(payment.id, lineItemToDelete);
      setPayment(updatedPayment);
      // No success message needed - user already confirmed in dialog
      setDeleteLineItemDialogOpen(false);
      setLineItemToDelete(null);
      loadPaymentHistory();
    } catch (error: any) {
      showError({
        title: 'Failed to remove line item',
        message: error.message || 'Could not remove line item',
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

  const formatDateTime = (dateTimeString?: string) => {
    if (!dateTimeString) return '-';
    return new Date(dateTimeString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getHistoryColor = (changeType: string) => {
    const colorMap: Record<string, string> = {
      CREATED: '#2196f3',
      REEVALUATED: '#ff9800',
      LINE_ITEM_ADDED: '#4caf50',
      LINE_ITEM_REMOVED: '#f44336',
      LINE_ITEM_UPDATED: '#ff9800',
      SUBMITTED: '#9c27b0',
      APPROVED: '#4caf50',
      PAID: '#4caf50',
      CANCELLED: '#f44336',
      DOCUMENT_ADDED: '#2196f3',
      DOCUMENT_REMOVED: '#f44336',
      REMARKS_UPDATED: '#607d8b',
    };
    return colorMap[changeType] || '#757575';
  };

  const formatChangeType = (changeType: string) => {
    const formatMap: Record<string, string> = {
      CREATED: 'Payment Created',
      REEVALUATED: 'Re-evaluated',
      LINE_ITEM_ADDED: 'Line Item Added',
      LINE_ITEM_REMOVED: 'Line Item Removed',
      LINE_ITEM_UPDATED: 'Line Item Updated',
      SUBMITTED: 'Submitted for Approval',
      APPROVED: 'Payment Approved',
      PAID: 'Payment Recorded',
      CANCELLED: 'Payment Cancelled',
      DOCUMENT_ADDED: 'Document Added',
      DOCUMENT_REMOVED: 'Document Removed',
      REMARKS_UPDATED: 'Remarks Updated',
    };
    return formatMap[changeType] || changeType;
  };

  const isEditable = payment?.status === PaymentStatus.DRAFT;
  const canSubmit = payment?.status === PaymentStatus.DRAFT && (payment?.lineItems?.length || 0) > 0;
  const canApprove = payment?.status === PaymentStatus.PENDING_APPROVAL;
  const canRecordPayment = payment?.status === PaymentStatus.APPROVED;
  const canCancel = payment?.status === PaymentStatus.PENDING_APPROVAL || payment?.status === PaymentStatus.APPROVED;
  const canDelete = payment?.status === PaymentStatus.DRAFT;
  const isLocked = payment?.status !== PaymentStatus.DRAFT && payment?.status !== PaymentStatus.CANCELLED;

  if (initialLoading || !payment) {
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
        <IconButton onClick={() => navigate('/payments')}>
          <BackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4">Payment Details</Typography>
          <Typography variant="body2" color="text.secondary">
            Created {formatDate(payment.createdAt)} by {payment.createdBy}
          </Typography>
        </Box>
        <Chip
          label={paymentApi.getStatusLabel(payment.status)}
          color={paymentApi.getStatusColor(payment.status)}
          icon={isLocked ? <LockIcon /> : <UnlockedIcon />}
        />
      </Box>

      {/* Status Alert */}
      {payment.status === PaymentStatus.DRAFT && (
        <Alert severity="info" sx={{ mb: 3 }}>
          This payment is in DRAFT status. Assignments can still be re-evaluated.
          Click "Submit for Approval" when ready to lock assignments and submit for approval.
        </Alert>
      )}

      {payment.status === PaymentStatus.PENDING_APPROVAL && (
        <Alert severity="warning" icon={<LockIcon />} sx={{ mb: 3 }}>
          Payment submitted for approval. All {payment.lineItems?.length || 0} assignments are now LOCKED.
          To make corrections, cancel this payment request.
        </Alert>
      )}

      {payment.status === PaymentStatus.CANCELLED && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Payment cancelled: {payment.cancellationReason}
          <br />
          Cancelled by {payment.cancelledBy} on {formatDate(payment.cancelledAt)}
        </Alert>
      )}

      {/* Summary Card */}
      <Card sx={{ mb: 3 }}>
        <Box sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Typography variant="caption" color="text.secondary">Period</Typography>
              <Typography variant="h6">
                {new Date(payment.paymentYear || 0, (payment.paymentMonth || 1) - 1).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                })}
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="caption" color="text.secondary">Total Amount</Typography>
              <Typography variant="h6">{formatCurrency(payment.totalAmount)}</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="caption" color="text.secondary">Line Items</Typography>
              <Typography variant="h6">{payment.lineItems?.length || 0}</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="caption" color="text.secondary">Documents</Typography>
              <Typography variant="h6">{payment.documents?.length || 0}</Typography>
            </Grid>
          </Grid>
        </Box>

        <Divider />

        {/* Action Buttons */}
        <Box sx={{ p: 2, display: 'flex', gap: 1, justifyContent: 'flex-end', position: 'relative' }}>
          {actionLoading && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(255, 255, 255, 0.7)',
                zIndex: 1,
              }}
            >
              <CircularProgress size={24} />
            </Box>
          )}
          {canSubmit && (
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={() => setSubmitDialogOpen(true)}
              disabled={actionLoading}
            >
              Submit for Approval
            </Button>
          )}
          {canApprove && (
            <Button
              variant="contained"
              color="success"
              startIcon={<ApproveIcon />}
              onClick={() => setApproveDialogOpen(true)}
              disabled={actionLoading}
            >
              Approve Payment
            </Button>
          )}
          {canRecordPayment && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<PaymentIcon />}
              onClick={() => setRecordPaymentDialogOpen(true)}
              disabled={actionLoading}
            >
              Record Payment
            </Button>
          )}
          {canCancel && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<CancelIcon />}
              onClick={() => setCancelDialogOpen(true)}
              disabled={actionLoading}
            >
              Cancel Payment
            </Button>
          )}
          {canDelete && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteDialogOpen(true)}
              disabled={actionLoading}
            >
              Delete Draft
            </Button>
          )}
        </Box>
      </Card>

      {/* Tabs */}
      <Card>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="Line Items" />
          <Tab label={`Documents (${payment.documents?.length || 0})`} />
          <Tab label="History" />
        </Tabs>

        {/* Line Items Tab */}
        <TabPanel value={tabValue} index={0}>
          {isEditable && (
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate(`/payments/${payment.id}/add-assignments`)}
              >
                Add Assignments
              </Button>
            </Box>
          )}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Activity</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Completion %</TableCell>
                  <TableCell align="right">Rate</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="right">Employee PF (12%)</TableCell>
                  <TableCell align="right">Voluntary PF</TableCell>
                  <TableCell align="right">Employer PF (12%)</TableCell>
                  <TableCell align="right">Total Deduction</TableCell>
                  <TableCell align="right">Net Amount</TableCell>
                  {isEditable && <TableCell align="center">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {payment.lineItems?.map((item: PaymentLineItem) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.employeeName || item.snapshotEmployeeName}</TableCell>
                    <TableCell>{item.workActivityName || item.snapshotActivityName}</TableCell>
                    <TableCell>{formatDate(item.assignmentDate)}</TableCell>
                    <TableCell align="right">
                      {/* Show actual completion % if available (for DRAFT), otherwise show snapshot */}
                      {item.completionPercentage !== null && item.completionPercentage !== undefined
                        ? `${item.completionPercentage}%`
                        : (item.snapshotCompletionPercentage !== null && item.snapshotCompletionPercentage !== undefined)
                        ? `${item.snapshotCompletionPercentage}%`
                        : 'N/A'}
                    </TableCell>
                    <TableCell align="right">{formatCurrency(item.rate)}</TableCell>
                    <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
                    <TableCell align="right">{formatCurrency(item.employeePf || 0)}</TableCell>
                    <TableCell align="right">{formatCurrency(item.voluntaryPf || 0)}</TableCell>
                    <TableCell align="right">{formatCurrency(item.employerPf || 0)}</TableCell>
                    <TableCell align="right">{formatCurrency(item.pfAmount)}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(item.netAmount)}
                      </Typography>
                    </TableCell>
                    {isEditable && (
                      <TableCell align="center">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteLineItem(item.id)}
                          title="Remove line item"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {(!payment.lineItems || payment.lineItems.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={isEditable ? 12 : 11} align="center">
                      <Typography color="text.secondary" sx={{ py: 3 }}>
                        No line items. Add assignments to this payment.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Documents Tab */}
        <TabPanel value={tabValue} index={1}>
          {payment.documents && payment.documents.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>File Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell>Uploaded By</TableCell>
                    <TableCell>Uploaded Date</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payment.documents.map((doc) => (
                    <TableRow key={doc.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FileIcon color="action" />
                          <Typography variant="body2">{doc.fileName}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={doc.documentType || 'Document'} 
                          size="small" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(2)} KB` : '-'}
                      </TableCell>
                      <TableCell>{doc.uploadedBy || '-'}</TableCell>
                      <TableCell>{formatDate(doc.uploadedAt)}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleDownloadDocument(doc.id, doc.fileName)}
                          title="Download"
                        >
                          <DownloadIcon />
                        </IconButton>
                        {canCancel && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteDocument(doc.id)}
                            title="Delete"
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography color="text.secondary" variant="h6" gutterBottom>
                No documents uploaded
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Documents will be uploaded when you record the payment transaction
              </Typography>
            </Box>
          )}
        </TabPanel>

        {/* History Tab */}
        <TabPanel value={tabValue} index={2}>
          {paymentHistory.length > 0 ? (
            <Box>
              {paymentHistory.map((entry, index) => (
                <Box key={entry.id} sx={{ mb: 3, position: 'relative' }}>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      borderLeft: 4,
                      borderColor: getHistoryColor(entry.changeType),
                      bgcolor: 'background.paper',
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box flex={1}>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <HistoryIcon sx={{ fontSize: 20, color: getHistoryColor(entry.changeType) }} />
                          <Typography variant="subtitle1" fontWeight="bold">
                            {formatChangeType(entry.changeType)}
                          </Typography>
                          <Chip
                            label={entry.changeType}
                            size="small"
                            sx={{
                              bgcolor: getHistoryColor(entry.changeType),
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '0.7rem',
                            }}
                          />
                        </Box>
                        
                        {entry.changeDescription && (
                          <Typography variant="body2" color="text.secondary" mb={1}>
                            {entry.changeDescription}
                          </Typography>
                        )}
                        
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          {entry.previousStatus && entry.newStatus && (
                            <Grid item xs={12} sm={6}>
                              <Typography variant="caption" color="text.secondary">
                                Status Change:
                              </Typography>
                              <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                                <Chip label={entry.previousStatus} size="small" variant="outlined" />
                                <Typography variant="caption">→</Typography>
                                <Chip label={entry.newStatus} size="small" color="primary" />
                              </Box>
                            </Grid>
                          )}
                          
                          {(entry.previousAmount !== null && entry.newAmount !== null) && (
                            <Grid item xs={12} sm={6}>
                              <Typography variant="caption" color="text.secondary">
                                Amount Change:
                              </Typography>
                              <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                                <Typography variant="body2">
                                  {formatCurrency(entry.previousAmount)}
                                </Typography>
                                <Typography variant="caption">→</Typography>
                                <Typography variant="body2" fontWeight="bold" color="primary">
                                  {formatCurrency(entry.newAmount)}
                                </Typography>
                              </Box>
                            </Grid>
                          )}
                          
                          {entry.remarks && (
                            <Grid item xs={12}>
                              <Alert severity="info" sx={{ py: 0 }}>
                                <Typography variant="caption">
                                  <strong>Remarks:</strong> {entry.remarks}
                                </Typography>
                              </Alert>
                            </Grid>
                          )}
                        </Grid>
                      </Box>
                      
                      <Box textAlign="right" ml={2}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {formatDateTime(entry.changedAt)}
                        </Typography>
                        <Chip
                          label={entry.changedBy}
                          size="small"
                          variant="outlined"
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    </Box>
                  </Paper>
                  
                  {index < paymentHistory.length - 1 && (
                    <Box
                      sx={{
                        width: 2,
                        height: 20,
                        bgcolor: 'divider',
                        mx: 2,
                        my: 1,
                      }}
                    />
                  )}
                </Box>
              ))}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography color="text.secondary" variant="h6" gutterBottom>
                No history yet
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Payment history will appear here as changes are made
              </Typography>
            </Box>
          )}
        </TabPanel>
      </Card>

      {/* Submit for Approval Dialog */}
      <Dialog open={submitDialogOpen} onClose={() => setSubmitDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Submit Payment for Approval?</DialogTitle>
        <DialogContent>
          <Alert severity="warning" icon={<LockIcon />} sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold">⚠️ Important: This action will LOCK all assignments</Typography>
            <Typography variant="caption" display="block">
              Once submitted, assignments cannot be edited until payment is cancelled.
              A snapshot of all data will be captured.
            </Typography>
          </Alert>
          <Box sx={{ my: 2 }}>
            <Typography variant="body2">• Assignments to lock: <strong>{payment.lineItems?.length || 0}</strong></Typography>
            <Typography variant="body2">• Total amount: <strong>{formatCurrency(payment.totalAmount)}</strong></Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              You can cancel the payment later to make corrections.
            </Typography>
          </Box>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Remarks (Optional)"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmitDialogOpen(false)} disabled={actionLoading}>Cancel</Button>
          <Button onClick={handleSubmitForApproval} variant="contained" color="warning" disabled={actionLoading}>
            {actionLoading ? 'Submitting...' : 'Confirm & Submit'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Approve Payment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Approving this payment of {formatCurrency(payment.totalAmount)} for {payment.lineItems?.length} employees.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Remarks (Optional)"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialogOpen(false)} disabled={actionLoading}>Cancel</Button>
          <Button onClick={handleApprove} variant="contained" color="success" disabled={actionLoading}>
            {actionLoading ? 'Approving...' : 'Approve Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={recordPaymentDialogOpen} onClose={() => setRecordPaymentDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Record Payment Transaction</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {/* Payment Date and Reference in one row */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                type="date"
                label="Payment Date *"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ width: '200px' }}
              />
              <TextField
                fullWidth
                label="Transaction/Challan Reference *"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            </Box>
            
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Remarks (Optional)"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
            
            <Divider sx={{ my: 1 }} />
            
            {/* File Upload Section */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Upload Payment Documents (Optional)
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                Upload payment receipts, challans, or related documents
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                {/* Upload Button */}
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadIcon />}
                  size="small"
                  sx={{ flexShrink: 0 }}
                >
                  Select Files
                  <input
                    type="file"
                    hidden
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileChange}
                  />
                </Button>
                
                {/* Uploaded Files List */}
                {uploadedFiles.length > 0 && (
                  <Box sx={{ flex: 1 }}>
                    <List dense sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, py: 0 }}>
                      {uploadedFiles.map((file, index) => (
                        <ListItem key={index} sx={{ py: 0.5 }}>
                          <FileIcon sx={{ mr: 1, color: 'action.active', fontSize: '1rem' }} />
                          <ListItemText
                            primary={file.name}
                            secondary={`${(file.size / 1024).toFixed(2)} KB`}
                            primaryTypographyProps={{ variant: 'body2' }}
                            secondaryTypographyProps={{ variant: 'caption' }}
                          />
                          <ListItemSecondaryAction>
                            <IconButton edge="end" size="small" onClick={() => handleRemoveFile(index)}>
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
                
                {uploadedFiles.length === 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                    No files selected
                  </Typography>
                )}
              </Box>
              
              {uploadProgress && (
                <Box sx={{ mt: 1 }}>
                  <LinearProgress />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    Uploading documents...
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setRecordPaymentDialogOpen(false);
            setUploadedFiles([]);
          }}>
            Cancel
          </Button>
          <Button
            onClick={handleRecordPayment}
            variant="contained"
            disabled={!paymentDate || !referenceNumber || actionLoading || uploadProgress}
            startIcon={actionLoading || uploadProgress ? <CircularProgress size={20} /> : <PaymentIcon />}
          >
            {uploadProgress ? 'Uploading...' : actionLoading ? 'Recording...' : 'Record Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Payment Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cancel Payment</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Cancelling will unlock all {payment.lineItems?.length || 0} assignments, allowing corrections.
          </Alert>
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
          <Button onClick={() => setCancelDialogOpen(false)} disabled={actionLoading}>Cancel</Button>
          <Button
            onClick={handleCancel}
            variant="contained"
            color="error"
            disabled={!cancellationReason.trim() || actionLoading}
          >
            {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Payment Confirmation Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)} 
        maxWidth="xs" 
        fullWidth
      >
        <DialogTitle>Delete Payment Draft?</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This will permanently delete this payment draft and unlock all {payment?.lineItems?.length || 0} assignments.
          </Alert>
          <Typography variant="body2" color="text.secondary">
            This action cannot be undone. The assignments will become available for other payments.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
          >
            Delete Draft
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Line Item Confirmation Dialog */}
      <Dialog 
        open={deleteLineItemDialogOpen} 
        onClose={() => {
          setDeleteLineItemDialogOpen(false);
          setLineItemToDelete(null);
        }} 
        maxWidth="xs" 
        fullWidth
      >
        <DialogTitle>Remove Line Item?</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This will remove the line item from the payment and unlock the assignment.
          </Alert>
          <Typography variant="body2" color="text.secondary">
            The assignment will become available to be added to other payments.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setDeleteLineItemDialogOpen(false);
              setLineItemToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteLineItem}
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Document Confirmation Dialog */}
      <Dialog 
        open={deleteDocumentDialogOpen} 
        onClose={() => {
          setDeleteDocumentDialogOpen(false);
          setDocumentToDelete(null);
        }} 
        maxWidth="xs" 
        fullWidth
      >
        <DialogTitle>Delete Document?</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone. The document will be permanently deleted.
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete this document?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setDeleteDocumentDialogOpen(false);
              setDocumentToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteDocument}
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentDetailPage;

