import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  TextField,
  Button,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Collapse,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Info as InfoIcon,
  LocationOn as LocationIcon,
  Public as GlobeIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { auditLogApi, AuditLog, AuditLogFilters } from '../../api/auditLogApi';
import { useError } from '../../contexts/ErrorContext';

const AuditLogPage: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalElements, setTotalElements] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const { showError } = useError();

  // Filter state
  const [filters, setFilters] = useState<AuditLogFilters>({
    username: '',
    entityType: '',
    operation: undefined,
    ipAddress: '',
    startDate: '',
    endDate: '',
    status: undefined,
    sortBy: 'timestamp',
    sortDirection: 'DESC',
  });

  useEffect(() => {
    loadAuditLogs();
  }, [page, rowsPerPage]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await auditLogApi.getAuditLogs({
        ...filters,
        page,
        size: rowsPerPage,
      });
      setAuditLogs(response.content);
      setTotalElements(response.totalElements);
    } catch (error: any) {
      showError({
        title: 'Failed to load audit logs',
        message: error.message || 'An error occurred while loading audit logs',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: keyof AuditLogFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value === '' ? undefined : value,
    }));
  };

  const handleApplyFilters = () => {
    setPage(0);
    loadAuditLogs();
  };

  const handleClearFilters = () => {
    setFilters({
      username: '',
      entityType: '',
      operation: undefined,
      ipAddress: '',
      startDate: '',
      endDate: '',
      status: undefined,
      sortBy: 'timestamp',
      sortDirection: 'DESC',
    });
    setPage(0);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRowClick = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  const handleToggleExpand = (logId: string) => {
    setExpandedRow(expandedRow === logId ? null : logId);
  };

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case 'VIEW':
        return 'info';
      case 'CREATE':
        return 'success';
      case 'EDIT':
        return 'warning';
      case 'DELETE':
        return 'error';
      case 'LOGIN':
        return 'primary';
      case 'LOGOUT':
        return 'default';
      case 'EXPORT':
        return 'secondary';
      case 'IMPORT':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'success';
      case 'FAILURE':
        return 'error';
      case 'UNAUTHORIZED':
        return 'warning';
      case 'FORBIDDEN':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'MMM dd, yyyy HH:mm:ss');
    } catch {
      return timestamp;
    }
  };

  const formatJson = (jsonString?: string) => {
    if (!jsonString) return 'N/A';
    try {
      return JSON.stringify(JSON.parse(jsonString), null, 2);
    } catch {
      return jsonString;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon sx={{ fontSize: 32 }} />
          <Typography variant="h4">Audit Logs</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={loadAuditLogs}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Filters Section */}
      <Collapse in={showFilters}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Filters
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Username"
                  value={filters.username}
                  onChange={(e) => handleFilterChange('username', e.target.value)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Entity Type"
                  value={filters.entityType}
                  onChange={(e) => handleFilterChange('entityType', e.target.value)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Operation</InputLabel>
                  <Select
                    value={filters.operation || ''}
                    label="Operation"
                    onChange={(e) => handleFilterChange('operation', e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="VIEW">View</MenuItem>
                    <MenuItem value="CREATE">Create</MenuItem>
                    <MenuItem value="EDIT">Edit</MenuItem>
                    <MenuItem value="DELETE">Delete</MenuItem>
                    <MenuItem value="LOGIN">Login</MenuItem>
                    <MenuItem value="LOGOUT">Logout</MenuItem>
                    <MenuItem value="EXPORT">Export</MenuItem>
                    <MenuItem value="IMPORT">Import</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status || ''}
                    label="Status"
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="SUCCESS">Success</MenuItem>
                    <MenuItem value="FAILURE">Failure</MenuItem>
                    <MenuItem value="UNAUTHORIZED">Unauthorized</MenuItem>
                    <MenuItem value="FORBIDDEN">Forbidden</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="IP Address"
                  value={filters.ipAddress}
                  onChange={(e) => handleFilterChange('ipAddress', e.target.value)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="datetime-local"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="datetime-local"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button fullWidth variant="contained" onClick={handleApplyFilters}>
                    Apply
                  </Button>
                  <Button fullWidth variant="outlined" onClick={handleClearFilters}>
                    Clear
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Collapse>

      {/* Audit Logs Table */}
      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : auditLogs.length === 0 ? (
            <Alert severity="info">No audit logs found</Alert>
          ) : (
            <>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                      <TableCell width="40px"></TableCell>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Operation</TableCell>
                      <TableCell>Entity</TableCell>
                      <TableCell>Entity ID</TableCell>
                      <TableCell>IP Address</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell width="50px">Details</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <React.Fragment key={log.id}>
                        <TableRow
                          hover
                          sx={{ 
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'action.hover' }
                          }}
                        >
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleExpand(log.id);
                              }}
                            >
                              {expandedRow === log.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                          </TableCell>
                          <TableCell>{formatTimestamp(log.timestamp)}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {log.username}
                            </Typography>
                            {log.userFullName && (
                              <Typography variant="caption" color="text.secondary">
                                {log.userFullName}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={log.operation}
                              color={getOperationColor(log.operation) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{log.entityType}</Typography>
                            {log.entityName && (
                              <Typography variant="caption" color="text.secondary">
                                {log.entityName}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                              {log.entityId || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block' }}>
                                {log.ipAddress}
                              </Typography>
                              {log.city && log.country && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                  <LocationIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                                  <Typography variant="caption" color="text.secondary">
                                    {log.city}, {log.countryCode}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={log.status}
                              color={getStatusColor(log.status) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRowClick(log);
                                }}
                              >
                                <InfoIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={9} sx={{ py: 0, borderBottom: 'none' }}>
                            <Collapse in={expandedRow === log.id} timeout="auto" unmountOnExit>
                              <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                                <Grid container spacing={2}>
                                  <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" gutterBottom>
                                      Request Details
                                    </Typography>
                                    <Typography variant="body2">
                                      <strong>Method:</strong> {log.requestMethod}
                                    </Typography>
                                    <Typography variant="body2">
                                      <strong>URL:</strong> {log.requestUrl}
                                    </Typography>
                                    {log.userAgent && (
                                      <Typography variant="caption" color="text.secondary">
                                        {log.userAgent}
                                      </Typography>
                                    )}
                                  </Grid>
                                  <Grid item xs={12} md={6}>
                                    {log.errorMessage && (
                                      <Alert severity="error" sx={{ mb: 1 }}>
                                        {log.errorMessage}
                                      </Alert>
                                    )}
                                    {(log.city || log.country) && (
                                      <Box sx={{ mt: 1 }}>
                                        <Typography variant="subtitle2" gutterBottom>
                                          Location Information
                                        </Typography>
                                        {log.city && (
                                          <Typography variant="body2">
                                            <strong>City:</strong> {log.city}
                                          </Typography>
                                        )}
                                        {log.regionName && (
                                          <Typography variant="body2">
                                            <strong>Region:</strong> {log.regionName}
                                          </Typography>
                                        )}
                                        {log.country && (
                                          <Typography variant="body2">
                                            <strong>Country:</strong> {log.country} ({log.countryCode})
                                          </Typography>
                                        )}
                                        {log.isp && (
                                          <Typography variant="body2">
                                            <strong>ISP:</strong> {log.isp}
                                          </Typography>
                                        )}
                                      </Box>
                                    )}
                                  </Grid>
                                </Grid>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50, 100]}
                component="div"
                count={totalElements}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Audit Log Details
        </DialogTitle>
        <DialogContent dividers>
          {selectedLog && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  User
                </Typography>
                <Typography variant="body1">
                  {selectedLog.username}
                  {selectedLog.userFullName && ` (${selectedLog.userFullName})`}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Timestamp
                </Typography>
                <Typography variant="body1">
                  {formatTimestamp(selectedLog.timestamp)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Operation
                </Typography>
                <Chip
                  label={selectedLog.operation}
                  color={getOperationColor(selectedLog.operation) as any}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Chip
                  label={selectedLog.status}
                  color={getStatusColor(selectedLog.status) as any}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Entity Type
                </Typography>
                <Typography variant="body1">{selectedLog.entityType}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Entity ID
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  {selectedLog.entityId || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Entity Name
                </Typography>
                <Typography variant="body1">{selectedLog.entityName || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  IP Address
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                  {selectedLog.ipAddress}
                </Typography>
              </Grid>
              {/* Geolocation Information */}
              {(selectedLog.city || selectedLog.country) && (
                <>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, mb: 1 }}>
                      <GlobeIcon color="primary" />
                      <Typography variant="h6">Location Information</Typography>
                    </Box>
                  </Grid>
                  {selectedLog.city && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        City
                      </Typography>
                      <Typography variant="body1">{selectedLog.city}</Typography>
                    </Grid>
                  )}
                  {selectedLog.regionName && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Region
                      </Typography>
                      <Typography variant="body1">{selectedLog.regionName}</Typography>
                    </Grid>
                  )}
                  {selectedLog.country && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Country
                      </Typography>
                      <Typography variant="body1">
                        {selectedLog.country} ({selectedLog.countryCode})
                      </Typography>
                    </Grid>
                  )}
                  {selectedLog.timezone && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Timezone
                      </Typography>
                      <Typography variant="body1">{selectedLog.timezone}</Typography>
                    </Grid>
                  )}
                  {selectedLog.isp && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        ISP
                      </Typography>
                      <Typography variant="body1">{selectedLog.isp}</Typography>
                    </Grid>
                  )}
                  {selectedLog.organization && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Organization
                      </Typography>
                      <Typography variant="body1">{selectedLog.organization}</Typography>
                    </Grid>
                  )}
                  {selectedLog.latitude && selectedLog.longitude && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Coordinates
                      </Typography>
                      <Typography variant="body1">
                        {selectedLog.latitude.toFixed(6)}, {selectedLog.longitude.toFixed(6)}
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<LocationIcon />}
                        href={`https://www.google.com/maps?q=${selectedLog.latitude},${selectedLog.longitude}`}
                        target="_blank"
                        sx={{ mt: 1 }}
                      >
                        View on Map
                      </Button>
                    </Grid>
                  )}
                </>
              )}
              {/* End Geolocation Information */}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Request Method
                </Typography>
                <Typography variant="body1">{selectedLog.requestMethod}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Request URL
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {selectedLog.requestUrl}
                </Typography>
              </Grid>
              {selectedLog.userAgent && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    User Agent
                  </Typography>
                  <Typography variant="caption" sx={{ wordBreak: 'break-all' }}>
                    {selectedLog.userAgent}
                  </Typography>
                </Grid>
              )}
              {selectedLog.errorMessage && (
                <Grid item xs={12}>
                  <Alert severity="error">
                    <Typography variant="subtitle2">Error Message</Typography>
                    <Typography variant="body2">{selectedLog.errorMessage}</Typography>
                  </Alert>
                </Grid>
              )}
              {(selectedLog.oldValue || selectedLog.newValue) && (
                <>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Old Value
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 1, maxHeight: 200, overflow: 'auto' }}>
                      <pre style={{ margin: 0, fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
                        {formatJson(selectedLog.oldValue)}
                      </pre>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      New Value
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 1, maxHeight: 200, overflow: 'auto' }}>
                      <pre style={{ margin: 0, fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
                        {formatJson(selectedLog.newValue)}
                      </pre>
                    </Paper>
                  </Grid>
                </>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuditLogPage;

