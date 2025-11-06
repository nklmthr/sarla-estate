import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  MenuItem,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Stack,
} from '@mui/material';
import { Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { scheduleApi } from '../../api/scheduleApi';
import { OperationSchedule } from '../../types';
import { format } from 'date-fns';

const ScheduleForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<OperationSchedule>({
    periodName: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    periodType: 'WEEKLY',
    status: 'DRAFT',
    filterFrequency: null,
    filterWorkShift: null,
    filterSeason: null,
    filterActivityStatus: null,
    includeAllSchedulable: true,
  });

  useEffect(() => {
    if (isEditMode && id) {
      loadSchedule(id);
    }
  }, [id, isEditMode]);

  const loadSchedule = async (scheduleId: string) => {
    try {
      setLoading(true);
      const response = await scheduleApi.getScheduleById(scheduleId);
      const data = response.data;
      setFormData({
        ...data,
        startDate: format(new Date(data.startDate), 'yyyy-MM-dd'),
        endDate: format(new Date(data.endDate), 'yyyy-MM-dd'),
      });
    } catch (error) {
      console.error('Error loading schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const cleanedData = {
        ...formData,
        filterFrequency: formData.filterFrequency || null,
        filterWorkShift: formData.filterWorkShift || null,
        filterSeason: formData.filterSeason || null,
        filterActivityStatus: formData.filterActivityStatus || null,
      };

      if (isEditMode && id) {
        await scheduleApi.updateSchedule(id, cleanedData);
      } else {
        await scheduleApi.createSchedule(cleanedData);
      }
      navigate('/schedules');
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Failed to save schedule.');
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
        {isEditMode ? 'Edit Schedule' : 'Create New Schedule'}
      </Typography>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {/* Basic Fields */}
              <TextField
                fullWidth
                required
                label="Period Name"
                name="periodName"
                placeholder="e.g., Week ending Nov 02, 2025"
                value={formData.periodName}
                onChange={handleChange}
              />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                <TextField
                  fullWidth
                  required
                  type="date"
                  label="Start Date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  fullWidth
                  required
                  type="date"
                  label="End Date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>

              <TextField
                fullWidth
                label="Description"
                name="description"
                multiline
                rows={2}
                value={formData.description || ''}
                onChange={handleChange}
              />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                <TextField
                  fullWidth
                  required
                  select
                  label="Period Type"
                  name="periodType"
                  value={formData.periodType}
                  onChange={handleChange}
                >
                  <MenuItem value="WEEKLY">Weekly</MenuItem>
                  <MenuItem value="BIWEEKLY">Bi-weekly</MenuItem>
                  <MenuItem value="MONTHLY">Monthly</MenuItem>
                  <MenuItem value="QUARTERLY">Quarterly</MenuItem>
                  <MenuItem value="YEARLY">Yearly</MenuItem>
                  <MenuItem value="CUSTOM">Custom</MenuItem>
                </TextField>

                <TextField
                  fullWidth
                  select
                  label="Status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={!isEditMode}
                  helperText={!isEditMode ? 'New schedules start as Draft' : ''}
                >
                  <MenuItem value="DRAFT">Draft</MenuItem>
                  {isEditMode && (
                    <>
                      <MenuItem value="GENERATED">Generated</MenuItem>
                      <MenuItem value="PUBLISHED">Published</MenuItem>
                      <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                      <MenuItem value="COMPLETED">Completed</MenuItem>
                      <MenuItem value="CANCELLED">Cancelled</MenuItem>
                    </>
                  )}
                </TextField>
              </Box>

              {/* Assignment Filters Section */}
              <Box
                sx={{
                  mt: 4,
                  p: 3,
                  backgroundColor: 'rgba(76,175,80,0.04)',
                  borderRadius: 2,
                  border: '1px solid rgba(76,175,80,0.2)',
                }}
              >
                {/* Line 1: Header */}
                <Typography variant="h6" sx={{ color: 'success.dark', fontWeight: 600, mb: 2 }}>
                  Assignment Filters
                </Typography>

                {/* Line 2: Filter Dropdowns */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 3 }}>
                  <TextField
                    fullWidth
                    select
                    label="Frequency"
                    name="filterFrequency"
                    value={formData.filterFrequency || ''}
                    onChange={handleChange}
                    disabled={formData.includeAllSchedulable}
                  >
                    <MenuItem value="">All Frequencies</MenuItem>
                    <MenuItem value="DAILY">Daily</MenuItem>
                    <MenuItem value="WEEKLY">Weekly</MenuItem>
                    <MenuItem value="BIWEEKLY">Bi-weekly</MenuItem>
                    <MenuItem value="MONTHLY">Monthly</MenuItem>
                    <MenuItem value="QUARTERLY">Quarterly</MenuItem>
                    <MenuItem value="MULTIPLE_DAILY">Multiple Daily</MenuItem>
                    <MenuItem value="AS_NEEDED">As Needed</MenuItem>
                  </TextField>

                  <TextField
                    fullWidth
                    select
                    label="Work Shift"
                    name="filterWorkShift"
                    value={formData.filterWorkShift || ''}
                    onChange={handleChange}
                    disabled={formData.includeAllSchedulable}
                  >
                    <MenuItem value="">All Shifts</MenuItem>
                    <MenuItem value="MORNING">Morning</MenuItem>
                    <MenuItem value="EVENING">Evening</MenuItem>
                    <MenuItem value="FULL_DAY">Full Day</MenuItem>
                  </TextField>

                  <TextField
                    fullWidth
                    select
                    label="Season"
                    name="filterSeason"
                    value={formData.filterSeason || ''}
                    onChange={handleChange}
                    disabled={formData.includeAllSchedulable}
                  >
                    <MenuItem value="">All Seasons</MenuItem>
                    <MenuItem value="ALL_SEASON">All Season</MenuItem>
                    <MenuItem value="SPRING">Spring</MenuItem>
                    <MenuItem value="SUMMER">Summer</MenuItem>
                    <MenuItem value="MONSOON">Monsoon</MenuItem>
                    <MenuItem value="AUTUMN">Autumn</MenuItem>
                    <MenuItem value="WINTER">Winter</MenuItem>
                  </TextField>

                  <TextField
                    fullWidth
                    select
                    label="Activity Status"
                    name="filterActivityStatus"
                    value={formData.filterActivityStatus || ''}
                    onChange={handleChange}
                    disabled={formData.includeAllSchedulable}
                  >
                    <MenuItem value="">All Statuses</MenuItem>
                    <MenuItem value="ACTIVE">Active</MenuItem>
                    <MenuItem value="INACTIVE">Inactive</MenuItem>
                    <MenuItem value="SEASONAL">Seasonal</MenuItem>
                  </TextField>
                </Box>

                {/* Line 3: Checkbox */}
                <Box
                  sx={{
                    p: 2,
                    backgroundColor: 'rgba(76,175,80,0.05)',
                    borderRadius: 2,
                    border: '1px solid rgba(76,175,80,0.15)',
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.includeAllSchedulable || false}
                        onChange={handleChange}
                        name="includeAllSchedulable"
                        sx={{
                          color: 'primary.main',
                          '&.Mui-checked': { color: 'primary.main' },
                        }}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body1" fontWeight={500}>
                          Include all schedulable activities (ignore filters)
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          When checked, all active work activities will be included regardless of the filters above.
                        </Typography>
                      </Box>
                    }
                  />
                </Box>
              </Box>

              {/* Line 4: Save / Cancel buttons (right aligned) */}
              <Box display="flex" justifyContent="flex-end" gap={2} sx={{ mt: 4 }}>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={() => navigate('/schedules')}
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
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ScheduleForm;
