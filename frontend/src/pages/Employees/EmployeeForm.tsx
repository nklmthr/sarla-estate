import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Grid,
  MenuItem,
  CircularProgress,
  Avatar,
  IconButton,
} from '@mui/material';
import { 
  Save as SaveIcon, 
  Cancel as CancelIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { employeeApi } from '../../api/employeeApi';
import { employeeTypeApi } from '../../api/employeeTypeApi';
import { employeeStatusApi } from '../../api/employeeStatusApi';
import apiClient from '../../api/apiClient';
import { Employee, EmployeeType, EmployeeStatus } from '../../types';

const EmployeeForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [employeeTypes, setEmployeeTypes] = useState<EmployeeType[]>([]);
  const [employeeStatuses, setEmployeeStatuses] = useState<EmployeeStatus[]>([]);
  const [formData, setFormData] = useState<Employee>({
    name: '',
    phone: '',
    pfAccountId: '',
    idCardType: 'AADHAAR',
    idCardValue: '',
    employeeTypeId: '',
    employeeStatusId: '',
  });

  useEffect(() => {
    loadEmployeeTypes();
    loadEmployeeStatuses();
  }, []);

  useEffect(() => {
    if (isEditMode && id) {
      loadEmployee(id);
    }
  }, [id, isEditMode]);

  const loadEmployeeTypes = async () => {
    try {
      const types = await employeeTypeApi.getActive();
      setEmployeeTypes(types);
    } catch (error) {
      console.error('Error loading employee types:', error);
    }
  };

  const loadEmployeeStatuses = async () => {
    try {
      const statuses = await employeeStatusApi.getActive();
      setEmployeeStatuses(statuses);
    } catch (error) {
      console.error('Error loading employee statuses:', error);
    }
  };

  const loadEmployee = async (employeeId: string) => {
    try {
      setLoading(true);
      const employee = await employeeApi.getEmployeeById(employeeId);
      // Set default idCardType if null
      setFormData({
        ...employee,
        idCardType: employee.idCardType || 'AADHAAR'
      });
      
      // Load photo if exists
      try {
        const photoBlob = await employeeApi.getEmployeePhoto(employeeId);
        
        if (photoBlob && photoBlob instanceof Blob && photoBlob.size > 0) {
          const photoUrl = URL.createObjectURL(photoBlob);
          setPhotoPreview(photoUrl);
        }
      } catch (photoError: any) {
        // Photo not found or error loading photo - that's okay, just no preview
        if (photoError?.response?.status !== 404) {
          console.error('Error loading employee photo:', photoError);
        }
      }
    } catch (error) {
      console.error('Error loading employee:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // If there's a photo, send as multipart/form-data
      if (photoFile) {
        const submitData = new FormData();
        submitData.append('employee', JSON.stringify(formData));
        submitData.append('idCardPhoto', photoFile);

        if (isEditMode && id) {
          await apiClient.put(`/employees/${id}`, submitData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } else {
          await apiClient.post('/employees', submitData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
      } else {
        // No photo, send as regular JSON
        if (isEditMode && id) {
          await employeeApi.updateEmployee(id, formData);
        } else {
          await employeeApi.createEmployee(formData);
        }
      }
      
      navigate('/employees');
    } catch (error) {
      console.error('Error saving employee:', error);
      alert('Error saving employee. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {isEditMode ? 'Edit Employee' : 'Add New Employee'}
      </Typography>

      <Card>
        <CardContent sx={{ pb: 2 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="PF Account ID"
                  name="pfAccountId"
                  value={formData.pfAccountId || ''}
                  onChange={handleChange}
                  helperText="Provident Fund Account ID"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Employee Type"
                  name="employeeTypeId"
                  value={formData.employeeTypeId || ''}
                  onChange={handleChange}
                  helperText="Select employee classification"
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

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Employee Status"
                  name="employeeStatusId"
                  value={formData.employeeStatusId || ''}
                  onChange={handleChange}
                  helperText="Select employment status"
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

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="ID Card Type"
                  name="idCardType"
                  value={formData.idCardType || 'AADHAAR'}
                  onChange={handleChange}
                >
                  <MenuItem value="AADHAAR">Aadhaar</MenuItem>
                  <MenuItem value="PAN">PAN Card</MenuItem>
                  <MenuItem value="PASSPORT">Passport</MenuItem>
                  <MenuItem value="DRIVING_LICENSE">Driving License</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="ID Card Number"
                  name="idCardValue"
                  value={formData.idCardValue || ''}
                  onChange={handleChange}
                  helperText="Enter the ID card number"
                />
              </Grid>

              {/* Photo Upload Section */}
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
                          sx={{ width: 140, height: 105, objectFit: 'cover' }}
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
                            '&:hover': { backgroundColor: 'white' }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          width: 140,
                          height: 105,
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
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={handlePhotoChange}
                        />
                      </Button>
                      <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                        JPG, PNG. Max 5MB
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sx={{ pt: '12px !important' }}>
                <Box display="flex" gap={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={() => navigate('/employees')}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EmployeeForm;

