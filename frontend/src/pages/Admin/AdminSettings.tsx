import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
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
  Switch,
  FormControlLabel,
  Chip,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { EmployeeType, EmployeeStatus } from '../../types';
import { employeeTypeApi } from '../../api/employeeTypeApi';
import { employeeStatusApi } from '../../api/employeeStatusApi';
import { useError } from '../../contexts/ErrorContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AdminSettings() {
  const { showSuccess, showWarning } = useError();
  const [tabValue, setTabValue] = useState(0);
  const [employeeTypes, setEmployeeTypes] = useState<EmployeeType[]>([]);
  const [employeeStatuses, setEmployeeStatuses] = useState<EmployeeStatus[]>([]);
  const [openTypeDialog, setOpenTypeDialog] = useState(false);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [editingType, setEditingType] = useState<EmployeeType | null>(null);
  const [editingStatus, setEditingStatus] = useState<EmployeeStatus | null>(null);

  // Form states for Type
  const [typeForm, setTypeForm] = useState({
    code: '',
    name: '',
    description: '',
    isActive: true,
    displayOrder: 0,
  });

  // Form states for Status
  const [statusForm, setStatusForm] = useState({
    code: '',
    name: '',
    description: '',
    isActive: true,
    displayOrder: 0,
  });

  useEffect(() => {
    loadEmployeeTypes();
    loadEmployeeStatuses();
  }, []);

  const loadEmployeeTypes = async () => {
    try {
      const data = await employeeTypeApi.getAll();
      setEmployeeTypes(data);
    } catch (err) {
      // Error handled by global interceptor
      // Error handled by global interceptor
    }
  };

  const loadEmployeeStatuses = async () => {
    try {
      const data = await employeeStatusApi.getAll();
      setEmployeeStatuses(data);
    } catch (err) {
      // Error handled by global interceptor
      // Error handled by global interceptor
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Employee Type Handlers
  const handleOpenTypeDialog = (type?: EmployeeType) => {
    if (type) {
      setEditingType(type);
      setTypeForm({
        code: type.code,
        name: type.name,
        description: type.description || '',
        isActive: type.isActive ?? true,
        displayOrder: type.displayOrder || 0,
      });
    } else {
      setEditingType(null);
      setTypeForm({
        code: '',
        name: '',
        description: '',
        isActive: true,
        displayOrder: employeeTypes.length > 0 
          ? Math.max(...employeeTypes.map(t => t.displayOrder || 0)) + 1 
          : 1,
      });
    }
    setOpenTypeDialog(true);
    // Error handled by global interceptor
  };

  const handleCloseTypeDialog = () => {
    setOpenTypeDialog(false);
    setEditingType(null);
  };

  const handleSaveType = async () => {
    try {
      if (!typeForm.code || !typeForm.name) {
        showWarning('Code and Name are required');
        return;
      }

      if (editingType) {
        await employeeTypeApi.update(editingType.id!, typeForm);
        showSuccess('Employee type updated successfully');
      } else {
        await employeeTypeApi.create(typeForm);
        showSuccess('Employee type created successfully');
      }
      
      handleCloseTypeDialog();
      loadEmployeeTypes();
    } catch (err) {
      // Error handled by global interceptor
    }
  };

  const handleDeleteType = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this employee type?')) {
      return;
    }

    try {
      await employeeTypeApi.delete(id);
      showSuccess('Employee type deleted successfully');
      loadEmployeeTypes();
    } catch (err) {
      // Error handled by global interceptor
    }
  };

  const handleToggleTypeActive = async (id: string) => {
    try {
      await employeeTypeApi.toggleActive(id);
      loadEmployeeTypes();
    } catch (err) {
      // Error handled by global interceptor
      // Error handled by global interceptor
    }
  };

  // Employee Status Handlers
  const handleOpenStatusDialog = (status?: EmployeeStatus) => {
    if (status) {
      setEditingStatus(status);
      setStatusForm({
        code: status.code,
        name: status.name,
        description: status.description || '',
        isActive: status.isActive ?? true,
        displayOrder: status.displayOrder || 0,
      });
    } else {
      setEditingStatus(null);
      setStatusForm({
        code: '',
        name: '',
        description: '',
        isActive: true,
        displayOrder: employeeStatuses.length > 0 
          ? Math.max(...employeeStatuses.map(s => s.displayOrder || 0)) + 1 
          : 1,
      });
    }
    setOpenStatusDialog(true);
    // Error handled by global interceptor
  };

  const handleCloseStatusDialog = () => {
    setOpenStatusDialog(false);
    setEditingStatus(null);
  };

  const handleSaveStatus = async () => {
    try {
      if (!statusForm.code || !statusForm.name) {
        showWarning('Code and Name are required');
        return;
      }

      if (editingStatus) {
        await employeeStatusApi.update(editingStatus.id!, statusForm);
        showSuccess('Employee status updated successfully');
      } else {
        await employeeStatusApi.create(statusForm);
        showSuccess('Employee status created successfully');
      }
      
      handleCloseStatusDialog();
      loadEmployeeStatuses();
    } catch (err) {
      // Error handled by global interceptor
    }
  };

  const handleDeleteStatus = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this employee status?')) {
      return;
    }

    try {
      await employeeStatusApi.delete(id);
      showSuccess('Employee status deleted successfully');
      loadEmployeeStatuses();
    } catch (err) {
      // Error handled by global interceptor
    }
  };

  const handleToggleStatusActive = async (id: string) => {
    try {
      await employeeStatusApi.toggleActive(id);
      loadEmployeeStatuses();
    } catch (err) {
      // Error handled by global interceptor
      // Error handled by global interceptor
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <SettingsIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" color="primary">
            Master Data Settings
          </Typography>
        </Box>
      </Box>

      <Paper elevation={2}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            px: 2,
          }}
        >
          <Tab label="Employee Types" />
          <Tab label="Employee Statuses" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box px={3} pb={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Employee Types</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenTypeDialog()}
              >
                Add Type
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Display Order</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employeeTypes.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {type.code}
                        </Typography>
                      </TableCell>
                      <TableCell>{type.name}</TableCell>
                      <TableCell>{type.description || '-'}</TableCell>
                      <TableCell>{type.displayOrder || 0}</TableCell>
                      <TableCell>
                        <Chip
                          label={type.isActive ? 'Active' : 'Inactive'}
                          color={type.isActive ? 'success' : 'default'}
                          size="small"
                          onClick={() => handleToggleTypeActive(type.id!)}
                          sx={{ cursor: 'pointer' }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenTypeDialog(type)}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteType(type.id!)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box px={3} pb={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Employee Statuses</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenStatusDialog()}
              >
                Add Status
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Display Order</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employeeStatuses.map((status) => (
                    <TableRow key={status.id}>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {status.code}
                        </Typography>
                      </TableCell>
                      <TableCell>{status.name}</TableCell>
                      <TableCell>{status.description || '-'}</TableCell>
                      <TableCell>{status.displayOrder || 0}</TableCell>
                      <TableCell>
                        <Chip
                          label={status.isActive ? 'Active' : 'Inactive'}
                          color={status.isActive ? 'success' : 'default'}
                          size="small"
                          onClick={() => handleToggleStatusActive(status.id!)}
                          sx={{ cursor: 'pointer' }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenStatusDialog(status)}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteStatus(status.id!)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>
      </Paper>

      {/* Employee Type Dialog */}
      <Dialog open={openTypeDialog} onClose={handleCloseTypeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingType ? 'Edit Employee Type' : 'Add Employee Type'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Code"
              value={typeForm.code}
              onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value.toUpperCase() })}
              required
              fullWidth
              helperText="Unique identifier (e.g., PERMANENT, CONTRACT)"
            />
            <TextField
              label="Name"
              value={typeForm.name}
              onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
              required
              fullWidth
              helperText="Display name (e.g., Permanent Employee, Contract Worker)"
            />
            <TextField
              label="Description"
              value={typeForm.description}
              onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
            <TextField
              label="Display Order"
              type="number"
              value={typeForm.displayOrder}
              onChange={(e) => setTypeForm({ ...typeForm, displayOrder: parseInt(e.target.value) || 0 })}
              fullWidth
              helperText="Lower numbers appear first"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={typeForm.isActive}
                  onChange={(e) => setTypeForm({ ...typeForm, isActive: e.target.checked })}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTypeDialog}>Cancel</Button>
          <Button onClick={handleSaveType} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Employee Status Dialog */}
      <Dialog open={openStatusDialog} onClose={handleCloseStatusDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingStatus ? 'Edit Employee Status' : 'Add Employee Status'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Code"
              value={statusForm.code}
              onChange={(e) => setStatusForm({ ...statusForm, code: e.target.value.toUpperCase() })}
              required
              fullWidth
              helperText="Unique identifier (e.g., ACTIVE, ON_LEAVE)"
            />
            <TextField
              label="Name"
              value={statusForm.name}
              onChange={(e) => setStatusForm({ ...statusForm, name: e.target.value })}
              required
              fullWidth
              helperText="Display name (e.g., Active, On Leave, Resigned)"
            />
            <TextField
              label="Description"
              value={statusForm.description}
              onChange={(e) => setStatusForm({ ...statusForm, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
            <TextField
              label="Display Order"
              type="number"
              value={statusForm.displayOrder}
              onChange={(e) => setStatusForm({ ...statusForm, displayOrder: parseInt(e.target.value) || 0 })}
              fullWidth
              helperText="Lower numbers appear first"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={statusForm.isActive}
                  onChange={(e) => setStatusForm({ ...statusForm, isActive: e.target.checked })}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStatusDialog}>Cancel</Button>
          <Button onClick={handleSaveStatus} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

