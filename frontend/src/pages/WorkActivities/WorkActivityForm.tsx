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
  CircularProgress,
  Chip,
} from '@mui/material';
import { Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { workActivityApi } from '../../api/workActivityApi';
import { WorkActivity } from '../../types';

const WorkActivityForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<WorkActivity>({
    name: '',
    description: '',
    notes: '',
  });

  useEffect(() => {
    if (isEditMode && id) {
      loadActivity(id);
    }
  }, [id, isEditMode]);

  const loadActivity = async (activityId: string) => {
    try {
      setLoading(true);
      const data = await workActivityApi.getWorkActivityById(activityId);
      setFormData(data);
    } catch (error) {
      console.error('Error loading work activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (isEditMode && id) {
        await workActivityApi.updateWorkActivity(id, formData);
      } else {
        await workActivityApi.createWorkActivity(formData);
      }
      navigate('/work-activities');
    } catch (error) {
      console.error('Error saving work activity:', error);
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
        {isEditMode ? 'Edit Work Activity' : 'Add New Work Activity'}
      </Typography>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Activity Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Plucking, Pruning, Weeding, etc."
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  multiline
                  rows={4}
                  value={formData.description || ''}
                  onChange={handleChange}
                  placeholder="Describe the work activity in detail"
                />
              </Grid>

              {isEditMode && formData.status && (
                <Grid item xs={12}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Status (Calculated)
                    </Typography>
                    <Chip
                      label={formData.status}
                      color={formData.status === 'ACTIVE' ? 'success' : 'default'}
                      size="medium"
                    />
                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                      {formData.status === 'ACTIVE' 
                        ? 'This activity is active because it has active completion criteria' 
                        : 'This activity is inactive. Add completion criteria with valid date ranges to activate it.'}
                    </Typography>
                  </Box>
                </Grid>
              )}

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  name="notes"
                  multiline
                  rows={3}
                  value={formData.notes || ''}
                  onChange={handleChange}
                  placeholder="Additional notes or comments"
                />
              </Grid>

              <Grid item xs={12}>
                <Box display="flex" gap={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={() => navigate('/work-activities')}
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

export default WorkActivityForm;

