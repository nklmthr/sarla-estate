import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Card,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  TextField,
  MenuItem,
  Avatar,
  IconButton,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { employeeApi } from '../../api/employeeApi';
import { employeeTypeApi } from '../../api/employeeTypeApi';
import { employeeStatusApi } from '../../api/employeeStatusApi';
import { salaryApi } from '../../api/salaryApi';
import apiClient from '../../api/apiClient';
import { Employee, EmployeeType, EmployeeStatus, EmployeeSalary } from '../../types';
import { useError } from '../../contexts/ErrorContext';
import { format } from 'date-fns';

const steps = ['Employee Details', 'Salary Management', 'Review & Save'];

interface EmployeeFormData {
  name: string;
  phone: string;
  pfAccountId: string;
  idCardType: string;
  idCardValue: string;
  employeeTypeId: string;
  employeeStatusId: string;
}

interface SalaryFormData {
  amount: number;
  salaryType: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  currency: string;
  startDate: string;
  voluntaryPfPercentage: number;
  notes: string;
}

const EmployeeWizard: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const { showSuccess, showWarning } = useError();

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [employeeTypes, setEmployeeTypes] = useState<EmployeeType[]>([]);
  const [employeeStatuses, setEmployeeStatuses] = useState<EmployeeStatus[]>([]);
  const [currentSalary, setCurrentSalary] = useState<EmployeeSalary | null>(null);
  const [salaryHistory, setSalaryHistory] = useState<EmployeeSalary[]>([]);
  const [showSalaryForm, setShowSalaryForm] = useState(false);
  const [isInitialSalary, setIsInitialSalary] = useState(false);

  const [employeeData, setEmployeeData] = useState<EmployeeFormData>({
    name: '',
    phone: '',
    pfAccountId: '',
    idCardType: 'AADHAAR',
    idCardValue: '',
    employeeTypeId: '',
    employeeStatusId: '',
  });

  const [salaryFormData, setSalaryFormData] = useState<SalaryFormData>({
    amount: 0,
    salaryType: 'MONTHLY',
    currency: 'INR',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    voluntaryPfPercentage: 0,
    notes: '',
  });

  useEffect(() => {
    loadMasterData();
    if (isEditMode && id) {
      loadEmployee(id);
      loadEmployeeSalary(id);
    }
  }, [id, isEditMode]);

  const loadMasterData = async () => {
    try {
      const [types, statuses] = await Promise.all([
        employeeTypeApi.getActive(),
        employeeStatusApi.getActive(),
      ]);
      setEmployeeTypes(types);
      setEmployeeStatuses(statuses);
    } catch (error) {
      // Error handled by global interceptor
    }
  };

  const loadEmployee = async (employeeId: string) => {
    try {
      const employee = await employeeApi.getEmployeeById(employeeId);
      setEmployeeData({
        name: employee.name,
        phone: employee.phone || '',
        pfAccountId: employee.pfAccountId || '',
        idCardType: employee.idCardType || 'AADHAAR',
        idCardValue: employee.idCardValue || '',
        employeeTypeId: employee.employeeTypeId || '',
        employeeStatusId: employee.employeeStatusId || '',
      });

      // Load photo if exists
      try {
        const photoBlob = await employeeApi.getEmployeePhoto(employeeId);
        if (photoBlob && photoBlob instanceof Blob && photoBlob.size > 0) {
          const photoUrl = URL.createObjectURL(photoBlob);
          setPhotoPreview(photoUrl);
        }
      } catch (photoError) {
        // Photo not found - that's okay
      }
    } catch (error) {
      // Error handled by global interceptor
    }
  };

  const loadEmployeeSalary = async (employeeId: string) => {
    try {
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
      // Error handled by global interceptor
      setCurrentSalary(null);
      setSalaryHistory([]);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showWarning('Please select an image file (JPG, PNG, GIF, etc.)');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showWarning('File size must be less than 5MB. Please choose a smaller image.');
        return;
      }

      setPhotoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const openSalaryFormDialog = (initial: boolean) => {
    setIsInitialSalary(initial);
    if (initial) {
      setSalaryFormData({
        amount: 0,
        salaryType: 'MONTHLY',
        currency: 'INR',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        voluntaryPfPercentage: 0,
        notes: '',
      });
    } else if (currentSalary) {
      setSalaryFormData({
        amount: currentSalary.amount,
        salaryType: currentSalary.salaryType || 'MONTHLY',
        currency: currentSalary.currency || 'INR',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        voluntaryPfPercentage: currentSalary.voluntaryPfPercentage || 0,
        notes: '',
      });
    }
    setShowSalaryForm(true);
  };

  const handleSaveSalary = async () => {
    if (!id) {
      showWarning('Please save the employee first before adding salary');
      return;
    }

    try {
      if (isInitialSalary) {
        await salaryApi.createInitial(id, salaryFormData);
      } else {
        await salaryApi.update(id, salaryFormData);
      }
      await loadEmployeeSalary(id);
      showSuccess('Salary saved successfully!');
      setShowSalaryForm(false);
    } catch (error) {
      // Error handled by global interceptor
    }
  };

  const handleNext = async () => {
    // Validate current step
    if (activeStep === 0) {
      if (!employeeData.name.trim()) {
        showWarning('Please enter employee name');
        return;
      }
      if (!employeeData.idCardType) {
        showWarning('Please select ID card type');
        return;
      }
      if (!employeeData.employeeTypeId) {
        showWarning('Please select employee type');
        return;
      }
      if (!employeeData.employeeStatusId) {
        showWarning('Please select employee status');
        return;
      }

      // Save employee if creating new
      if (!isEditMode) {
        try {
          setLoading(true);
          const formData = employeeData as Employee;
          
          let savedEmployee: any;
          if (photoFile) {
            const submitData = new FormData();
            submitData.append('employee', JSON.stringify(formData));
            submitData.append('idCardPhoto', photoFile);
            const response: any = await apiClient.post('/employees', submitData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            savedEmployee = response.data;
          } else {
            savedEmployee = await employeeApi.createEmployee(formData);
          }

          // Navigate to edit mode with the new employee ID
          navigate(`/employees/${savedEmployee.id}/edit`, { replace: true });
          showSuccess('Employee created successfully!');
          return; // The useEffect will reload the data
        } catch (error) {
          // Error handled by global interceptor
          return;
        } finally {
          setLoading(false);
        }
      }
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async () => {
    if (!isEditMode || !id) {
      showWarning('Cannot update employee');
      return;
    }

    try {
      setLoading(true);
      const formData = employeeData as Employee;

      // Update employee
      if (photoFile) {
        const submitData = new FormData();
        submitData.append('employee', JSON.stringify(formData));
        submitData.append('idCardPhoto', photoFile);
        await apiClient.put(`/employees/${id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await employeeApi.updateEmployee(id, formData);
      }

      showSuccess('Employee updated successfully!');
      navigate('/employees');
    } catch (error) {
      // Error handled by global interceptor
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeTypeName = (typeId: string) => {
    const type = employeeTypes.find((t) => t.id === typeId);
    return type ? type.name : '-';
  };

  const getEmployeeStatusName = (statusId: string) => {
    const status = employeeStatuses.find((s) => s.id === statusId);
    return status ? status.name : '-';
  };

  const getIdCardTypeLabel = (type: string) => {
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
        return type;
    }
  };

  const getSalaryTypeLabel = (type: string) => {
    switch (type) {
      case 'DAILY':
        return 'Daily Wage';
      case 'WEEKLY':
        return 'Weekly Wage';
      case 'MONTHLY':
        return 'Monthly Salary';
      default:
        return type;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/employees')}>
          Back
        </Button>
        <Typography variant="h4">
          {isEditMode ? 'Edit Employee' : 'Add New Employee'}
        </Typography>
      </Box>

      {/* Stepper */}
      <Card sx={{ mb: 3 }}>
        <Box sx={{ p: 3 }}>
          <Stepper activeStep={activeStep}>
            {steps.map((label, index) => (
              <Step key={label} completed={activeStep > index}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
      </Card>

      {/* Step Content */}
      <Card>
        <Box sx={{ p: 3, minHeight: '400px' }}>
          {/* Step 1: Employee Details */}
          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ mb: 1 }}>
                Employee Details
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Enter all employee information
              </Typography>

              <Grid container spacing={2}>
                {/* Row 1: Name, Phone, PF Account ID */}
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    required
                    label="Name"
                    value={employeeData.name}
                    onChange={(e) => setEmployeeData({ ...employeeData, name: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={employeeData.phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setEmployeeData({ ...employeeData, phone: value });
                    }}
                    inputProps={{ maxLength: 10 }}
                    helperText="10 digits only"
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="PF Account ID"
                    value={employeeData.pfAccountId}
                    onChange={(e) => {
                      const value = e.target.value.slice(0, 12);
                      setEmployeeData({ ...employeeData, pfAccountId: value });
                    }}
                    inputProps={{ maxLength: 12 }}
                    helperText="Max 12 characters"
                  />
                </Grid>

                {/* Row 2: Employee Type, Employee Status, ID Card Type, ID Card Number */}
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    select
                    required
                    label="Employee Type"
                    value={employeeData.employeeTypeId}
                    onChange={(e) =>
                      setEmployeeData({ ...employeeData, employeeTypeId: e.target.value })
                    }
                    helperText="Select classification"
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {employeeTypes.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    select
                    required
                    label="Employee Status"
                    value={employeeData.employeeStatusId}
                    onChange={(e) =>
                      setEmployeeData({ ...employeeData, employeeStatusId: e.target.value })
                    }
                    helperText="Select status"
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {employeeStatuses.map((status) => (
                      <MenuItem key={status.id} value={status.id}>
                        {status.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    select
                    label="ID Card Type *"
                    value={employeeData.idCardType}
                    onChange={(e) => setEmployeeData({ ...employeeData, idCardType: e.target.value })}
                    helperText="Select ID type"
                  >
                    <MenuItem value="AADHAAR">Aadhaar</MenuItem>
                    <MenuItem value="PAN">PAN Card</MenuItem>
                    <MenuItem value="PASSPORT">Passport</MenuItem>
                    <MenuItem value="DRIVING_LICENSE">Driving License</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="ID Card Number"
                    value={employeeData.idCardValue}
                    onChange={(e) => setEmployeeData({ ...employeeData, idCardValue: e.target.value })}
                    helperText="Enter ID number"
                  />
                </Grid>

                {/* Row 3: Photo Upload Section */}
                <Grid item xs={12}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom sx={{ mb: 1 }}>
                      ID Card Photo
                    </Typography>

                    <Box display="flex" alignItems="center" gap={2}>
                      {photoPreview ? (
                        <Box position="relative">
                          <Avatar
                            src={photoPreview}
                            variant="rounded"
                            sx={{ width: 100, height: 75, objectFit: 'cover' }}
                          />
                          <IconButton
                            size="small"
                            color="error"
                            onClick={handleRemovePhoto}
                            sx={{
                              position: 'absolute',
                              top: -8,
                              right: -8,
                              backgroundColor: 'white',
                              '&:hover': { backgroundColor: 'white' },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            width: 100,
                            height: 75,
                            border: '2px dashed',
                            borderColor: 'grey.400',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'grey.50',
                          }}
                        >
                          <Typography color="textSecondary" variant="caption">
                            No photo
                          </Typography>
                        </Box>
                      )}

                      <Box>
                        <Button
                          variant="outlined"
                          component="label"
                          startIcon={<UploadIcon />}
                          size="small"
                        >
                          {photoPreview ? 'Change' : 'Upload'}
                          <input type="file" hidden accept="image/*" onChange={handlePhotoChange} />
                        </Button>
                        <Typography
                          variant="caption"
                          color="textSecondary"
                          sx={{ mt: 0.5, display: 'block' }}
                        >
                          JPG, PNG. Max 5MB
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Step 2: Salary Management */}
          {activeStep === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ mb: 1 }}>
                Salary Management
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {!isEditMode
                  ? 'Employee must be saved before managing salary. Click Next to continue.'
                  : 'Manage employee salary and view history'}
              </Typography>

              {isEditMode ? (
                <>
                  {!showSalaryForm ? (
                    <>
                      {/* Current Salary Section */}
                      <Card sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="flex-start"
                        >
                          <Box flex={1}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Current Salary
                            </Typography>
                            {currentSalary ? (
                              <Box display="flex" gap={3} flexWrap="wrap" alignItems="baseline">
                                <Typography variant="h5" color="success.main">
                                  {currentSalary.currency} {currentSalary.amount.toLocaleString()}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {getSalaryTypeLabel(currentSalary.salaryType || 'MONTHLY')}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  From {format(new Date(currentSalary.startDate), 'MMM dd, yyyy')}
                                </Typography>
                              </Box>
                            ) : (
                              <Typography color="text.secondary">
                                No salary record found
                              </Typography>
                            )}
                          </Box>
                          {currentSalary ? (
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<EditIcon />}
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
                      </Card>

                      {/* Salary History Section */}
                      {salaryHistory.length > 0 && (
                        <Card sx={{ p: 2, bgcolor: 'grey.50' }}>
                          <Typography variant="subtitle2" gutterBottom color="text.secondary">
                            Salary History ({salaryHistory.length} records)
                          </Typography>
                          <TableContainer sx={{ mt: 1, maxHeight: 300, overflow: 'auto' }}>
                            <Table size="small" stickyHeader>
                              <TableHead>
                                <TableRow>
                                  <TableCell sx={{ bgcolor: 'grey.50', fontWeight: 'bold', py: 1 }}>Amount</TableCell>
                                  <TableCell sx={{ bgcolor: 'grey.50', fontWeight: 'bold', py: 1 }}>Type</TableCell>
                                  <TableCell sx={{ bgcolor: 'grey.50', fontWeight: 'bold', py: 1 }}>Vol. PF</TableCell>
                                  <TableCell sx={{ bgcolor: 'grey.50', fontWeight: 'bold', py: 1 }}>Start Date</TableCell>
                                  <TableCell sx={{ bgcolor: 'grey.50', fontWeight: 'bold', py: 1 }}>End Date</TableCell>
                                  <TableCell sx={{ bgcolor: 'grey.50', fontWeight: 'bold', py: 1 }}>Status</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {salaryHistory.map((salary) => (
                                  <TableRow key={salary.id}>
                                    <TableCell sx={{ py: 1 }}>
                                      {salary.currency} {salary.amount.toLocaleString()}
                                    </TableCell>
                                    <TableCell sx={{ py: 1 }}>
                                      {getSalaryTypeLabel(salary.salaryType || 'MONTHLY')}
                                    </TableCell>
                                    <TableCell sx={{ py: 1 }}>
                                      {salary.voluntaryPfPercentage
                                        ? `${salary.voluntaryPfPercentage}%`
                                        : '0%'}
                                    </TableCell>
                                    <TableCell sx={{ py: 1 }}>
                                      {format(new Date(salary.startDate), 'MMM dd, yyyy')}
                                    </TableCell>
                                    <TableCell sx={{ py: 1 }}>
                                      {salary.endDate
                                        ? format(new Date(salary.endDate), 'MMM dd, yyyy')
                                        : '-'}
                                    </TableCell>
                                    <TableCell sx={{ py: 1 }}>
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
                        </Card>
                      )}
                    </>
                  ) : (
                    // Salary Form
                    <Card sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="subtitle1" gutterBottom fontWeight="bold" sx={{ mb: 1 }}>
                        {isInitialSalary ? 'Set Initial Salary' : 'Update Salary'}
                      </Typography>
                      <Grid container spacing={2} sx={{ mt: 0 }}>
                        {/* Single Row: All salary fields */}
                        <Grid item xs={12} md={2.4}>
                          <TextField
                            fullWidth
                            type="date"
                            label="Effective From"
                            value={salaryFormData.startDate}
                            onChange={(e) =>
                              setSalaryFormData({ ...salaryFormData, startDate: e.target.value })
                            }
                            InputLabelProps={{ shrink: true }}
                            helperText="Start date"
                          />
                        </Grid>
                        
                        <Grid item xs={12} md={2.4}>
                          <TextField
                            fullWidth
                            select
                            label="Salary Type"
                            value={salaryFormData.salaryType}
                            onChange={(e) =>
                              setSalaryFormData({
                                ...salaryFormData,
                                salaryType: e.target.value as 'DAILY' | 'WEEKLY' | 'MONTHLY',
                              })
                            }
                            helperText="Daily/Weekly/Monthly"
                          >
                            <MenuItem value="DAILY">Daily</MenuItem>
                            <MenuItem value="WEEKLY">Weekly</MenuItem>
                            <MenuItem value="MONTHLY">Monthly</MenuItem>
                          </TextField>
                        </Grid>
                        
                        <Grid item xs={12} md={2.4}>
                          <TextField
                            fullWidth
                            required
                            type="number"
                            label="Amount *"
                            value={salaryFormData.amount}
                            onChange={(e) =>
                              setSalaryFormData({ ...salaryFormData, amount: parseFloat(e.target.value) || 0 })
                            }
                            inputProps={{ min: 0, step: 100 }}
                            helperText="Salary amount"
                          />
                        </Grid>
                        
                        <Grid item xs={12} md={2.4}>
                          <TextField
                            fullWidth
                            select
                            label="Currency"
                            value={salaryFormData.currency}
                            onChange={(e) =>
                              setSalaryFormData({ ...salaryFormData, currency: e.target.value })
                            }
                            helperText="Select currency"
                          >
                            <MenuItem value="INR">INR</MenuItem>
                            <MenuItem value="USD">USD</MenuItem>
                            <MenuItem value="EUR">EUR</MenuItem>
                          </TextField>
                        </Grid>
                        
                        <Grid item xs={12} md={2.4}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Voluntary PF %"
                            value={salaryFormData.voluntaryPfPercentage}
                            onChange={(e) =>
                              setSalaryFormData({
                                ...salaryFormData,
                                voluntaryPfPercentage: parseFloat(e.target.value) || 0,
                              })
                            }
                            inputProps={{ min: 0, max: 100, step: 0.5 }}
                            helperText="Beyond 12%"
                          />
                        </Grid>
                        
                        {/* Row 2: Notes */}
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Notes"
                            multiline
                            rows={2}
                            value={salaryFormData.notes}
                            onChange={(e) =>
                              setSalaryFormData({ ...salaryFormData, notes: e.target.value })
                            }
                          />
                        </Grid>
                      </Grid>
                      
                      {/* Action Buttons at Bottom */}
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
                        <Button 
                          onClick={() => setShowSalaryForm(false)}
                          sx={{ minWidth: 80 }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          variant="contained" 
                          onClick={handleSaveSalary}
                          sx={{ minWidth: 80 }}
                        >
                          {isInitialSalary ? 'Create' : 'Update'}
                        </Button>
                      </Box>
                    </Card>
                  )}
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    Save the employee first to manage salary information
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Step 3: Review & Save */}
          {activeStep === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                Review & Confirm
              </Typography>

              <Grid container spacing={2}>
                {/* Left Column - Employee Details */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 2, bgcolor: 'grey.50', height: '100%' }}>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold" sx={{ mb: 1 }}>
                      Employee Details
                    </Typography>
                    <Grid container spacing={1.5} sx={{ mt: 0 }}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Name
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {employeeData.name}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Phone
                        </Typography>
                        <Typography variant="body2">{employeeData.phone || '-'}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          PF Account ID
                        </Typography>
                        <Typography variant="body2">{employeeData.pfAccountId || '-'}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Employee Type
                        </Typography>
                        <Typography variant="body2">
                          {getEmployeeTypeName(employeeData.employeeTypeId)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Employee Status
                        </Typography>
                        <Typography variant="body2">
                          {getEmployeeStatusName(employeeData.employeeStatusId)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          ID Card Type
                        </Typography>
                        <Typography variant="body2">
                          {getIdCardTypeLabel(employeeData.idCardType)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary">
                          ID Card Number
                        </Typography>
                        <Typography variant="body2">{employeeData.idCardValue || '-'}</Typography>
                      </Grid>
                      {photoPreview && (
                        <Grid item xs={12}>
                          <Typography variant="caption" color="text.secondary">
                            ID Card Photo
                          </Typography>
                          <Avatar
                            src={photoPreview}
                            variant="rounded"
                            sx={{ width: 100, height: 75, mt: 1, objectFit: 'cover' }}
                          />
                        </Grid>
                      )}
                    </Grid>
                  </Card>
                </Grid>

                {/* Right Column - Salary Details */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 2, bgcolor: 'grey.50', height: '100%' }}>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold" sx={{ mb: 1 }}>
                      Salary Information
                    </Typography>
                    {currentSalary ? (
                      <Grid container spacing={1.5} sx={{ mt: 0 }}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Current Salary
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {currentSalary.currency} {currentSalary.amount.toLocaleString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Salary Type
                          </Typography>
                          <Typography variant="body2">
                            {getSalaryTypeLabel(currentSalary.salaryType || 'MONTHLY')}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Voluntary PF
                          </Typography>
                          <Typography variant="body2">
                            {currentSalary.voluntaryPfPercentage || 0}%
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Start Date
                          </Typography>
                          <Typography variant="body2">
                            {format(new Date(currentSalary.startDate), 'MMM dd, yyyy')}
                          </Typography>
                        </Grid>
                      </Grid>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        No salary information available
                      </Typography>
                    )}
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>

        {/* Navigation Buttons - Hide when editing salary (Step 2 with salary form open) */}
        {!(activeStep === 1 && showSalaryForm) && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2 }}>
            <Button onClick={handleBack} disabled={activeStep === 0 || loading} startIcon={<BackIcon />}>
              Back
            </Button>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" onClick={() => navigate('/employees')} disabled={loading}>
                Cancel
              </Button>
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading || !isEditMode}
                  startIcon={<SaveIcon />}
                >
                  {loading ? 'Saving...' : 'Update Employee'}
                </Button>
              ) : (
                <Button variant="contained" onClick={handleNext} disabled={loading}>
                  {loading ? 'Saving...' : 'Next'}
                </Button>
              )}
            </Box>
          </Box>
        )}
      </Card>
    </Box>
  );
};

export default EmployeeWizard;
