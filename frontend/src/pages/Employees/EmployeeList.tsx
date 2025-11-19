import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  MenuItem,
  TablePagination,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  AccountBalanceWallet as MoneyIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { employeeApi } from '../../api/employeeApi';
import { salaryApi } from '../../api/salaryApi';
import { Employee, EmployeeSalary } from '../../types';
import { format } from 'date-fns';

const EmployeeList: React.FC = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalEmployees, setTotalEmployees] = useState(0);
  
  // Salary management states
  const [salaryDialogOpen, setSalaryDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [currentSalary, setCurrentSalary] = useState<EmployeeSalary | null>(null);
  const [salaryHistory, setSalaryHistory] = useState<EmployeeSalary[]>([]);
  const [salaryFormDialogOpen, setSalaryFormDialogOpen] = useState(false);
  const [isInitialSalary, setIsInitialSalary] = useState(false);
  const [loadingSalary, setLoadingSalary] = useState(false);
  
  const [salaryFormData, setSalaryFormData] = useState({
    amount: 0,
    currency: 'INR',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    voluntaryPfPercentage: 0,
    reasonForChange: '',
    notes: '',
  });

  useEffect(() => {
    loadEmployees();
  }, [page, rowsPerPage, searchTerm]);

  useEffect(() => {
    filterEmployees();
  }, [searchTerm, employees]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      
      let paginatedData;
      if (searchTerm.trim()) {
        // Use backend search with pagination
        paginatedData = await employeeApi.searchEmployeesPaginated(searchTerm, page, rowsPerPage);
      } else {
        // Use regular pagination
        paginatedData = await employeeApi.getEmployeesPaginated(page, rowsPerPage);
      }
      
      setEmployees(paginatedData.content);
      setTotalEmployees(paginatedData.totalElements);
      setFilteredEmployees(paginatedData.content);
    } catch (error) {
      console.error('Error loading employees:', error);
      setEmployees([]);
      setFilteredEmployees([]);
      setTotalEmployees(0);
    } finally {
      setLoading(false);
    }
  };

  const filterEmployees = () => {
    // Backend handles all filtering, just update filtered list
    if (!Array.isArray(employees)) {
      setFilteredEmployees([]);
      return;
    }
    setFilteredEmployees(employees);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0); // Reset to first page when searching
  };

  const handleDelete = async () => {
    if (!employeeToDelete) return;

    try {
      await employeeApi.deleteEmployee(employeeToDelete.id!);
      setEmployees(employees.filter((e) => e.id !== employeeToDelete.id));
      setDeleteDialogOpen(false);
      setEmployeeToDelete(null);
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  };

  const openDeleteDialog = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setDeleteDialogOpen(true);
  };

  const openSalaryDialog = async (employee: Employee) => {
    setSelectedEmployee(employee);
    setSalaryDialogOpen(true);
    await loadEmployeeSalary(employee.id!);
  };

  const loadEmployeeSalary = async (employeeId: string) => {
    try {
      setLoadingSalary(true);
      const [currentResponse, historyResponse] = await Promise.all([
        salaryApi.getCurrent(employeeId).catch(() => null),
        salaryApi.getHistory(employeeId).catch(() => null),
      ]);
      
      const current = currentResponse ? (currentResponse as any).data || currentResponse : null;
      const history = historyResponse ? (historyResponse as any).data || historyResponse : [];
      
      setCurrentSalary(current);
      const historyArray = Array.isArray(history) ? history : [];
      setSalaryHistory(historyArray);
    } catch (error) {
      console.error('Error loading salary data:', error);
      setCurrentSalary(null);
      setSalaryHistory([]);
    } finally {
      setLoadingSalary(false);
    }
  };

  const openSalaryFormDialog = (initial: boolean) => {
    setIsInitialSalary(initial);
    if (initial) {
      setSalaryFormData({
        amount: 0,
        currency: 'INR',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        voluntaryPfPercentage: 0,
        reasonForChange: 'Initial salary',
        notes: '',
      });
    } else if (currentSalary) {
      setSalaryFormData({
        amount: currentSalary.amount,
        currency: currentSalary.currency || 'INR',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        voluntaryPfPercentage: currentSalary.voluntaryPfPercentage || 0,
        reasonForChange: '',
        notes: '',
      });
    }
    setSalaryFormDialogOpen(true);
  };

  const handleSalaryFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSalaryFormData((prev) => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSaveSalary = async () => {
    if (!selectedEmployee?.id) return;

    try {
      if (isInitialSalary) {
        await salaryApi.createInitial(selectedEmployee.id, salaryFormData);
      } else {
        await salaryApi.update(selectedEmployee.id, salaryFormData);
      }
      await loadEmployeeSalary(selectedEmployee.id);
      setSalaryFormDialogOpen(false);
    } catch (error) {
      console.error('Error saving salary:', error);
      alert('Error saving salary. Please try again.');
    }
  };

  const getIdCardTypeLabel = (type?: string) => {
    switch (type) {
      case 'AADHAAR':
        return 'Aadhaar';
      case 'PAN':
        return 'PAN Card';
      case 'PASSPORT':
        return 'Passport';
      case 'DRIVING_LICENSE':
        return 'Driving License';
      default:
        return type || '-';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Employees</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/employees/new')}
        >
          Add Employee
        </Button>
      </Box>

      <Card>
        <Box p={2}>
          <TextField
            fullWidth
            placeholder="Search by name, phone, PF account, or ID card..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>PF Account ID</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>ID Card Type</TableCell>
                <TableCell>ID Card Number</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="textSecondary">
                      {searchTerm ? 'No employees found' : 'No employees yet'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((employee) => (
                  <TableRow key={employee.id} hover>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{employee.phone || '-'}</TableCell>
                    <TableCell>{employee.pfAccountId || '-'}</TableCell>
                    <TableCell>
                      {employee.employeeTypeName ? (
                        <Chip
                          label={employee.employeeTypeName}
                          color="info"
                          size="small"
                          variant="outlined"
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {employee.employeeStatusName ? (
                        <Chip
                          label={employee.employeeStatusName}
                          color="success"
                          size="small"
                          variant="outlined"
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getIdCardTypeLabel(employee.idCardType)}
                        color="primary"
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{employee.idCardValue || '-'}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => openSalaryDialog(employee)}
                        color="success"
                        title="Manage Salary"
                      >
                        <MoneyIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/employees/${employee.id}/edit`)}
                        color="primary"
                        title="Edit Employee"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => openDeleteDialog(employee)}
                        color="error"
                        title="Delete Employee"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalEmployees}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete employee "{employeeToDelete?.name}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Salary Management Dialog */}
      <Dialog 
        open={salaryDialogOpen} 
        onClose={() => setSalaryDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <MoneyIcon color="success" />
            <span>Salary Management - {selectedEmployee?.name}</span>
          </Box>
        </DialogTitle>
        <DialogContent>
          {loadingSalary ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              {/* Current Salary Section */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">Current Salary</Typography>
                    {currentSalary ? (
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<MoneyIcon />}
                        onClick={() => openSalaryFormDialog(false)}
                      >
                        Update
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => openSalaryFormDialog(true)}
                      >
                        Set Salary
                      </Button>
                    )}
                  </Box>

                  {currentSalary ? (
                    <Box>
                      <Typography variant="h4" color="success.main" gutterBottom>
                        {currentSalary.currency} {currentSalary.amount.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Start Date: {format(new Date(currentSalary.startDate), 'MMM dd, yyyy')}
                      </Typography>
                      {currentSalary.reasonForChange && (
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                          Reason: {currentSalary.reasonForChange}
                        </Typography>
                      )}
                      {currentSalary.notes && (
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                          Notes: {currentSalary.notes}
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

              {/* Salary History Section */}
              {salaryHistory.length > 0 && (
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
                            <TableCell>Voluntary PF</TableCell>
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
                                {salary.voluntaryPfPercentage 
                                  ? `${salary.voluntaryPfPercentage}%` 
                                  : '0%'}
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
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSalaryDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Salary Form Dialog (Add/Update) */}
      <Dialog 
        open={salaryFormDialogOpen} 
        onClose={() => setSalaryFormDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {isInitialSalary ? 'Set Initial Salary' : 'Update Salary'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {!isInitialSalary && currentSalary && (
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Current: {currentSalary.currency} {currentSalary.amount.toLocaleString()}
              </Typography>
            )}
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={8}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Amount"
                  name="amount"
                  value={salaryFormData.amount}
                  onChange={handleSalaryFormChange}
                  inputProps={{ min: 0, step: 100 }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  select
                  label="Currency"
                  name="currency"
                  value={salaryFormData.currency}
                  onChange={handleSalaryFormChange}
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
                  label={isInitialSalary ? "Start Date" : "Effective From"}
                  name="startDate"
                  value={salaryFormData.startDate}
                  onChange={handleSalaryFormChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Voluntary PF Percentage"
                  name="voluntaryPfPercentage"
                  value={salaryFormData.voluntaryPfPercentage}
                  onChange={handleSalaryFormChange}
                  inputProps={{ min: 0, max: 100, step: 0.5 }}
                  helperText="Additional PF contribution beyond mandatory 12% (e.g., 0, 2, 3)"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Reason"
                  name="reasonForChange"
                  value={salaryFormData.reasonForChange}
                  onChange={handleSalaryFormChange}
                  placeholder="e.g., Initial salary, Annual increment"
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
                  onChange={handleSalaryFormChange}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSalaryFormDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveSalary} variant="contained" color="primary">
            {isInitialSalary ? 'Create' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeList;

