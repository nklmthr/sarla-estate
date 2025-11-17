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
import apiClient from '../../api/apiClient';
import { Employee } from '../../types';

const EmployeeForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<Employee>({
    name: '',
    phone: '',
    pfAccountId: '',
    idCardType: 'AADHAAR',
    idCardValue: '',
  });

  useEffect(() => {
    if (isEditMode && id) {
      loadEmployee(id);
    }
  }, [id, isEditMode]);

  const loadEmployee = async (employeeId: string) => {
    try {
      setLoading(true);
      const data = await employeeApi.getEmployeeById(employeeId);
      setFormData(data);
      
      // Load photo if exists
      try {
        const photoResponse = await employeeApi.getEmployeePhoto(employeeId);
        
        // Handle both direct blob and axios response with data property
        let photoBlob: Blob | null = null;
        
        if (photoResponse instanceof Blob) {
          photoBlob = photoResponse;
        } else if (photoResponse && photoResponse.data instanceof Blob) {
          photoBlob = photoResponse.data;
        } else if (photoResponse && photoResponse.data) {
          photoBlob = new Blob([photoResponse.data]);
        }
        
        if (photoBlob && photoBlob.size > 0) {
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
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
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
                  <Typography variant="subtitle1" gutterBottom>
                    ID Card Photo
                  </Typography>
                  
                  <Box display="flex" alignItems="center" gap={2}>
                    {photoPreview ? (
                      <Box position="relative">
                        <Avatar
                          src={photoPreview}
                          variant="rounded"
                          sx={{ width: 200, height: 150, objectFit: 'cover' }}
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
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          width: 200,
                          height: 150,
                          border: '2px dashed',
                          borderColor: 'grey.400',
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: 'grey.50',
                        }}
                      >
                        <Typography color="textSecondary" variant="body2">
                          No photo
                        </Typography>
                      </Box>
                    )}
                    
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<UploadIcon />}
                    >
                      {photoPreview ? 'Change Photo' : 'Upload Photo'}
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handlePhotoChange}
                      />
                    </Button>
                  </Box>
                  
                  <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                    Supported formats: JPG, PNG. Max size: 5MB
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12}>
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

