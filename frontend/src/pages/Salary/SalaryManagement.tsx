import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  History as HistoryIcon,
  AttachMoney as MoneyIcon,
  Search as SearchIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { employeeApi } from '../../api/employeeApi';
import { salaryApi } from '../../api/salaryApi';
import { Employee, EmployeeSalary } from '../../types';
import { format } from 'date-fns';

const SalaryManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [currentSalary, setCurrentSalary] = useState<EmployeeSalary | null>(null);
  const [salaryHistory, setSalaryHistory] = useState<EmployeeSalary[]>([]);
  const [loading, setLoading] = useState(false);

  // Dialog states
  const [initialSalaryDialogOpen, setInitialSalaryDialogOpen] = useState(false);
  const [updateSalaryDialogOpen, setUpdateSalaryDialogOpen] = useState(false);
  
  // Form data
  const [salaryFormData, setSalaryFormData] = useState({
    amount: 0,
    currency: 'INR',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    salaryType: 'BASE_SALARY',
    paymentFrequency: 'MONTHLY',
    reasonForChange: '',
    approvedBy: '',
    notes: '',
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      loadEmployeeSalary();
    }
  }, [selectedEmployee]);

  const loadEmployees = async () => {
    try {
      const data = await employeeApi.getAllEmployees();
      const employeesArray = Array.isArray(data) ? data : [];
      setEmployees(employeesArray.filter(e => e.status === 'ACTIVE'));
    } catch (error) {
      console.error('Error loading employees:', error);
      setEmployees([]);
    }
  };

  const loadEmployeeSalary = async () => {
    if (!selectedEmployee?.id) return;

    try {
      setLoading(true);
      const [current, history] = await Promise.all([
        salaryApi.getCurrent(selectedEmployee.id).catch(() => null),
        salaryApi.getHistory(selectedEmployee.id).catch(() => []),
      ]);
      
      setCurrentSalary(current);
      const historyArray = Array.isArray(history) ? history : [];
      setSalaryHistory(historyArray);
    } catch (error) {
      console.error('Error loading salary data:', error);
      setCurrentSalary(null);
      setSalaryHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const openInitialSalaryDialog = () => {
    setSalaryFormData({
      amount: 0,
      currency: 'INR',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      salaryType: 'BASE_SALARY',
      paymentFrequency: 'MONTHLY',
      reasonForChange: 'Initial salary',
      approvedBy: '',
      notes: '',
    });
    setInitialSalaryDialogOpen(true);
  };

  const openUpdateSalaryDialog = () => {
    if (!currentSalary) return;
    
    setSalaryFormData({
      amount: currentSalary.amount,
      currency: currentSalary.currency || 'INR',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      salaryType: currentSalary.salaryType || 'BASE_SALARY',
      paymentFrequency: currentSalary.paymentFrequency || 'MONTHLY',
      reasonForChange: '',
      approvedBy: '',
      notes: '',
    });
    setUpdateSalaryDialogOpen(true);
  };

  const handleCreateInitialSalary = async () => {
    if (!selectedEmployee?.id) return;

    try {
      await salaryApi.createInitial(selectedEmployee.id, salaryFormData);
      await loadEmployeeSalary();
      setInitialSalaryDialogOpen(false);
    } catch (error) {
      console.error('Error creating initial salary:', error);
    }
  };

  const handleUpdateSalary = async () => {
    if (!selectedEmployee?.id) return;

    try {
      await salaryApi.update(selectedEmployee.id, salaryFormData);
      await loadEmployeeSalary();
      setUpdateSalaryDialogOpen(false);
    } catch (error) {
      console.error('Error updating salary:', error);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSalaryFormData((prev) => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value,
    }));
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Salary Management
      </Typography>

      <Grid container spacing={3}>
        {/* Employee Selection */}
        <Grid item xs={12}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(25, 118, 210, 0.02) 100%)',
            border: '1px solid rgba(25, 118, 210, 0.1)'
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <SearchIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">
                  Search Employee
                </Typography>
              </Box>
              <Autocomplete
                value={selectedEmployee}
                onChange={(_, newValue) => setSelectedEmployee(newValue)}
                options={employees}
                getOptionLabel={(option) => 
                  `${option.name} ${option.employeeId ? `(ID: ${option.employeeId})` : ''}`
                }
                groupBy={(option) => option.department || 'No Department'}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    placeholder="Start typing employee name or ID..." 
                    variant="outlined"
                    helperText="Select an employee to view and manage their salary information"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <PersonIcon sx={{ ml: 1, mr: -0.5, color: 'action.active' }} />
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option.id}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                      <Typography variant="body1" fontWeight={500}>
                        {option.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                        {option.employeeId && (
                          <Typography variant="caption" color="text.secondary">
                            ID: {option.employeeId}
                          </Typography>
                        )}
                        {option.department && (
                          <Typography variant="caption" color="text.secondary">
                            • {option.department}
                          </Typography>
                        )}
                        {option.role && (
                          <Typography variant="caption" color="text.secondary">
                            • {option.role}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                )}
                noOptionsText="No employees found"
                clearText="Clear selection"
                openText="Open"
                closeText="Close"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Current Salary */}
        {selectedEmployee && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Current Salary</Typography>
                  {currentSalary ? (
                    <Button
                      variant="contained"
                      startIcon={<MoneyIcon />}
                      onClick={openUpdateSalaryDialog}
                    >
                      Update Salary
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={openInitialSalaryDialog}
                    >
                      Set Initial Salary
                    </Button>
                  )}
                </Box>

                {loading ? (
                  <Box display="flex" justifyContent="center" py={3}>
                    <CircularProgress />
                  </Box>
                ) : currentSalary ? (
                  <Box>
                    <Typography variant="h4" color="primary" gutterBottom>
                      {currentSalary.currency} {currentSalary.amount.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Type: {currentSalary.salaryType?.replace('_', ' ')}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Frequency: {currentSalary.paymentFrequency}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Start Date: {format(new Date(currentSalary.startDate), 'MMM dd, yyyy')}
                    </Typography>
                    {currentSalary.reasonForChange && (
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        Reason: {currentSalary.reasonForChange}
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Typography color="textSecondary">
                    No salary record found for this employee
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Salary History */}
        {selectedEmployee && salaryHistory.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <HistoryIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">Salary History</Typography>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Amount</TableCell>
                        <TableCell>Start Date</TableCell>
                        <TableCell>End Date</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {salaryHistory.map((salary) => (
                        <TableRow key={salary.id}>
                          <TableCell>
                            {salary.currency} {salary.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {format(new Date(salary.startDate), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            {salary.endDate 
                              ? format(new Date(salary.endDate), 'MMM dd, yyyy')
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={salary.isActive ? 'Active' : 'Historical'}
                              color={salary.isActive ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Initial Salary Dialog */}
      <Dialog 
        open={initialSalaryDialogOpen} 
        onClose={() => setInitialSalaryDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Set Initial Salary</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Amount"
                  name="amount"
                  value={salaryFormData.amount}
                  onChange={handleFormChange}
                  inputProps={{ min: 0, step: 100 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  select
                  label="Currency"
                  name="currency"
                  value={salaryFormData.currency}
                  onChange={handleFormChange}
                >
                  <MenuItem value="INR">INR</MenuItem>
                  <MenuItem value="USD">USD</MenuItem>
                  <MenuItem value="EUR">EUR</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="date"
                  label="Start Date"
                  name="startDate"
                  value={salaryFormData.startDate}
                  onChange={handleFormChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Salary Type"
                  name="salaryType"
                  value={salaryFormData.salaryType}
                  onChange={handleFormChange}
                >
                  <MenuItem value="BASE_SALARY">Base Salary</MenuItem>
                  <MenuItem value="HOURLY_RATE">Hourly Rate</MenuItem>
                  <MenuItem value="DAILY_WAGE">Daily Wage</MenuItem>
                  <MenuItem value="PIECE_RATE">Piece Rate</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Payment Frequency"
                  name="paymentFrequency"
                  value={salaryFormData.paymentFrequency}
                  onChange={handleFormChange}
                >
                  <MenuItem value="DAILY">Daily</MenuItem>
                  <MenuItem value="WEEKLY">Weekly</MenuItem>
                  <MenuItem value="BIWEEKLY">Bi-weekly</MenuItem>
                  <MenuItem value="MONTHLY">Monthly</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Reason"
                  name="reasonForChange"
                  value={salaryFormData.reasonForChange}
                  onChange={handleFormChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  name="notes"
                  multiline
                  rows={2}
                  value={salaryFormData.notes}
                  onChange={handleFormChange}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInitialSalaryDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateInitialSalary} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Salary Dialog */}
      <Dialog 
        open={updateSalaryDialogOpen} 
        onClose={() => setUpdateSalaryDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update Salary</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Current: {currentSalary?.currency} {currentSalary?.amount.toLocaleString()}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="New Amount"
                  name="amount"
                  value={salaryFormData.amount}
                  onChange={handleFormChange}
                  inputProps={{ min: 0, step: 100 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  select
                  label="Currency"
                  name="currency"
                  value={salaryFormData.currency}
                  onChange={handleFormChange}
                >
                  <MenuItem value="INR">INR</MenuItem>
                  <MenuItem value="USD">USD</MenuItem>
                  <MenuItem value="EUR">EUR</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="date"
                  label="Effective From"
                  name="startDate"
                  value={salaryFormData.startDate}
                  onChange={handleFormChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Reason for Change"
                  name="reasonForChange"
                  value={salaryFormData.reasonForChange}
                  onChange={handleFormChange}
                  placeholder="e.g., Annual increment, Promotion"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Approved By"
                  name="approvedBy"
                  value={salaryFormData.approvedBy}
                  onChange={handleFormChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  name="notes"
                  multiline
                  rows={2}
                  value={salaryFormData.notes}
                  onChange={handleFormChange}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateSalaryDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateSalary} variant="contained" color="primary">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SalaryManagement;

