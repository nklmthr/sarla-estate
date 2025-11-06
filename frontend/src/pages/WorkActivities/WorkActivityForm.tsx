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
    status: 'ACTIVE',
    estimatedDurationHoursPerDay: 8.0,
    typicalLocation: '',
    season: 'ALL_SEASON',
    workShift: 'MORNING',
    frequency: 'DAILY',
    frequencyDetails: '',
    resourcesRequired: '',
    safetyInstructions: '',
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
      [name]: name === 'estimatedDurationHoursPerDay' ? parseFloat(value) || 0 : value,
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
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  multiline
                  rows={3}
                  value={formData.description || ''}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  select
                  label="Work Shift"
                  name="workShift"
                  value={formData.workShift}
                  onChange={handleChange}
                >
                  <MenuItem value="MORNING">Morning</MenuItem>
                  <MenuItem value="EVENING">Evening</MenuItem>
                  <MenuItem value="FULL_DAY">Full Day</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  select
                  label="Frequency"
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleChange}
                >
                  <MenuItem value="DAILY">Daily</MenuItem>
                  <MenuItem value="WEEKLY">Weekly</MenuItem>
                  <MenuItem value="BIWEEKLY">Bi-weekly</MenuItem>
                  <MenuItem value="MONTHLY">Monthly</MenuItem>
                  <MenuItem value="QUARTERLY">Quarterly</MenuItem>
                  <MenuItem value="MULTIPLE_DAILY">Multiple Daily</MenuItem>
                  <MenuItem value="AS_NEEDED">As Needed</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Duration (hours/day)"
                  name="estimatedDurationHoursPerDay"
                  value={formData.estimatedDurationHoursPerDay}
                  onChange={handleChange}
                  inputProps={{ min: 0, step: 0.5 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Typical Location"
                  name="typicalLocation"
                  value={formData.typicalLocation || ''}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Season"
                  name="season"
                  value={formData.season || 'ALL_SEASON'}
                  onChange={handleChange}
                >
                  <MenuItem value="ALL_SEASON">All Season</MenuItem>
                  <MenuItem value="SPRING">Spring</MenuItem>
                  <MenuItem value="SUMMER">Summer</MenuItem>
                  <MenuItem value="MONSOON">Monsoon</MenuItem>
                  <MenuItem value="AUTUMN">Autumn</MenuItem>
                  <MenuItem value="WINTER">Winter</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  select
                  label="Status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                  <MenuItem value="SEASONAL">Seasonal</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Frequency Details"
                  name="frequencyDetails"
                  placeholder="e.g., Every Monday and Wednesday"
                  value={formData.frequencyDetails || ''}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Resources Required"
                  name="resourcesRequired"
                  multiline
                  rows={2}
                  value={formData.resourcesRequired || ''}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Safety Instructions"
                  name="safetyInstructions"
                  multiline
                  rows={2}
                  value={formData.safetyInstructions || ''}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  name="notes"
                  multiline
                  rows={2}
                  value={formData.notes || ''}
                  onChange={handleChange}
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

