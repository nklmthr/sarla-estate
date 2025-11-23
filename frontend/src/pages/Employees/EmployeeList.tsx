import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TablePagination,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { employeeApi } from '../../api/employeeApi';
import { Employee } from '../../types';
import { useError } from '../../contexts/ErrorContext';

const EmployeeList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess } = useError();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalEmployees, setTotalEmployees] = useState(0);

  // Debounce search term
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 400);

    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);

  // Reload employees whenever page changes or when navigating to this route
  useEffect(() => {
    loadEmployees();
  }, [page, rowsPerPage, debouncedSearchTerm, location.pathname]);

  useEffect(() => {
    filterEmployees();
  }, [searchTerm, employees]);

  const loadEmployees = async () => {
    try {
      setLoading(true);

      let paginatedData;
      if (debouncedSearchTerm.trim().length >= 2) {
        // Use backend search with pagination
        paginatedData = await employeeApi.searchEmployeesPaginated(debouncedSearchTerm, page, rowsPerPage);
      } else if (debouncedSearchTerm.trim().length === 0) {
        // Use regular pagination
        paginatedData = await employeeApi.getEmployeesPaginated(page, rowsPerPage);
      } else {
        // Length is 1, do not trigger search, just return (loading will be set to false in finally)
        return;
      }

      setEmployees(paginatedData.content);
      setTotalEmployees(paginatedData.totalElements);
      setFilteredEmployees(paginatedData.content);
    } catch (error) {
      // Error handled by global interceptor
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
      showSuccess('Employee deleted successfully!');
    } catch (error) {
      // Error handled by global interceptor
    } finally {
      // Always close dialog and reset state, whether success or error
      setDeleteDialogOpen(false);
      setEmployeeToDelete(null);
    }
  };

  const openDeleteDialog = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setDeleteDialogOpen(true);
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
        {loading && <LinearProgress />}
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
                  <TableCell colSpan={7} align="center">
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
    </Box>
  );
};

export default EmployeeList;

