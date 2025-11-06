import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { employeeApi } from '../../api/employeeApi';
import { Employee } from '../../types';

const EmployeeList: React.FC = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [searchTerm, employees]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await employeeApi.getAllEmployees();
      const employeesArray = Array.isArray(data) ? data : [];
      setEmployees(employeesArray);
      setFilteredEmployees(employeesArray);
    } catch (error) {
      console.error('Error loading employees:', error);
      setEmployees([]);
      setFilteredEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const filterEmployees = () => {
    if (!Array.isArray(employees)) {
      setFilteredEmployees([]);
      return;
    }

    if (!searchTerm.trim()) {
      setFilteredEmployees(employees);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(term) ||
        emp.email?.toLowerCase().includes(term) ||
        emp.department?.toLowerCase().includes(term)
    );
    setFilteredEmployees(filtered);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'default';
      case 'ON_LEAVE':
        return 'warning';
      case 'TERMINATED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'FULL_TIME':
        return 'primary';
      case 'PART_TIME':
        return 'secondary';
      case 'CONTRACT':
        return 'info';
      case 'SEASONAL':
        return 'warning';
      default:
        return 'default';
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
            placeholder="Search by name, email, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
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
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{employee.phone}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>
                      <Chip
                        label={employee.employeeType?.replace('_', ' ')}
                        color={getTypeColor(employee.employeeType || '')}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={employee.status}
                        color={getStatusColor(employee.status || '')}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/employees/${employee.id}/edit`)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => openDeleteDialog(employee)}
                        color="error"
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

