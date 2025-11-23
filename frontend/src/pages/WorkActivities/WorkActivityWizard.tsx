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
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Grid,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  ArrowForward as ForwardIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { workActivityApi } from '../../api/workActivityApi';
import { completionCriteriaApi } from '../../api/completionCriteriaApi';
import { unitOfMeasureApi, UnitOfMeasure } from '../../api/unitOfMeasureApi';
import { WorkActivity, WorkActivityCompletionCriteria } from '../../types';
import { useError } from '../../contexts/ErrorContext';

const steps = ['Activity Details', 'Add Completion Criteria', 'Review & Save'];

interface CriteriaFormData {
  id?: string;  // Optional ID for existing criteria
  unit: string;
  value: number;
  startDate: string;
  endDate: string;
  notes: string;
}

const WorkActivityWizard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showError } = useError();

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);

  // Step 1: Activity Details
  const [activityData, setActivityData] = useState({
    name: '',
    description: '',
  });

  // Step 2: Completion Criteria
  const [unitsOfMeasure, setUnitsOfMeasure] = useState<UnitOfMeasure[]>([]);
  const [criteriaList, setCriteriaList] = useState<CriteriaFormData[]>([]);
  const [showCriteriaForm, setShowCriteriaForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [criteriaFormData, setCriteriaFormData] = useState<CriteriaFormData>({
    unit: '',
    value: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    notes: '',
  });

  // For edit mode
  const [existingActivity, setExistingActivity] = useState<WorkActivity | null>(null);
  const [savedActivityId, setSavedActivityId] = useState<string | null>(null);

  useEffect(() => {
    loadUnitsOfMeasure();
    if (id) {
      loadActivity();
    }
  }, [id]);

  const loadUnitsOfMeasure = async () => {
    try {
      const data = await unitOfMeasureApi.getActiveUnits();
      setUnitsOfMeasure(data);
    } catch (error) {
      showError({
        title: 'Failed to load units',
        message: 'Could not fetch units of measure',
        severity: 'error',
      });
    }
  };

  const loadActivity = async () => {
    if (!id) return;
    setInitialLoading(true);
    try {
      const activity = await workActivityApi.getWorkActivityById(id);
      setExistingActivity(activity);
      setSavedActivityId(id);
      setActivityData({
        name: activity.name,
        description: activity.description || '',
      });

      // Load existing criteria
      if (activity.completionCriteria && activity.completionCriteria.length > 0) {
        const formattedCriteria = activity.completionCriteria.map(c => ({
          id: c.id,  // Include ID so we can track existing criteria
          unit: c.unit,
          value: c.value,
          startDate: c.startDate,
          endDate: c.endDate || '',
          notes: c.notes || '',
        }));
        setCriteriaList(formattedCriteria);
      }
    } catch (error) {
      showError({
        title: 'Failed to load activity',
        message: 'Could not fetch activity details',
        severity: 'error',
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const handleNext = () => {
    if (activeStep === 0) {
      // Validate activity details
      if (!activityData.name.trim()) {
        showError({
          title: 'Validation Error',
          message: 'Activity name is required',
          severity: 'warning',
        });
        return;
      }
      setActiveStep(1);
    } else if (activeStep === 1) {
      // Can proceed to review even without criteria
      setActiveStep(2);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleAddCriteria = () => {
    // Validate criteria
    if (!criteriaFormData.unit || criteriaFormData.value <= 0) {
      showError({
        title: 'Validation Error',
        message: 'Please select a unit and enter a valid value',
        severity: 'warning',
      });
      return;
    }

    // Check for date overlaps with any criteria (regardless of unit)
    const startDate = new Date(criteriaFormData.startDate);
    const endDate = criteriaFormData.endDate ? new Date(criteriaFormData.endDate) : null;

    // Check all criteria (excluding the one being edited)
    const existingCriteria = criteriaList.filter((c, idx) => idx !== editingIndex);

    for (const existing of existingCriteria) {
      const existingStart = new Date(existing.startDate);
      const existingEnd = existing.endDate ? new Date(existing.endDate) : null;
      const existingUnit = unitsOfMeasure.find(u => u.code === existing.unit)?.name || existing.unit;

      // Check for overlap
      // Case 1: New criteria has no end date (ongoing)
      if (!endDate) {
        // If existing also has no end date, they always overlap
        if (!existingEnd) {
          showError({
            title: 'Date Overlap Detected',
            message: `Cannot have multiple ongoing criteria. An ongoing criteria for ${existingUnit} already exists starting ${existing.startDate}.`,
            severity: 'warning',
          });
          return;
        }
        // If existing has end date, overlaps if existing ends after new starts
        if (existingEnd >= startDate) {
          showError({
            title: 'Date Overlap Detected',
            message: `This date range overlaps with existing criteria for ${existingUnit} (${existing.startDate} to ${existing.endDate}).`,
            severity: 'warning',
          });
          return;
        }
      }
      // Case 2: Existing has no end date (ongoing)
      else if (!existingEnd) {
        // Overlaps if new ends on or after existing starts
        if (endDate >= existingStart) {
          showError({
            title: 'Date Overlap Detected',
            message: `This date range overlaps with existing ongoing criteria for ${existingUnit} starting ${existing.startDate}.`,
            severity: 'warning',
          });
          return;
        }
      }
      // Case 3: Both have end dates
      else {
        // Check if date ranges overlap
        // Overlap occurs if: start1 <= end2 AND start2 <= end1
        if (startDate <= existingEnd && existingStart <= endDate) {
          showError({
            title: 'Date Overlap Detected',
            message: `This date range (${criteriaFormData.startDate} to ${criteriaFormData.endDate}) overlaps with existing criteria for ${existingUnit} (${existing.startDate} to ${existing.endDate}).`,
            severity: 'warning',
          });
          return;
        }
      }
    }

    if (editingIndex !== null) {
      // Update existing
      const updated = [...criteriaList];
      updated[editingIndex] = criteriaFormData;
      setCriteriaList(updated);
      setEditingIndex(null);
    } else {
      // Add new
      setCriteriaList([...criteriaList, criteriaFormData]);
    }

    // Reset form
    setCriteriaFormData({
      unit: '',
      value: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      notes: '',
    });
    setShowCriteriaForm(false);
  };

  const handleEditCriteria = (index: number) => {
    setCriteriaFormData(criteriaList[index]);
    setEditingIndex(index);
    setShowCriteriaForm(true);
  };

  const handleDeleteCriteria = (index: number) => {
    setCriteriaList(criteriaList.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let activityId = savedActivityId;

      // Prepare activity data for API (no status field needed - it's calculated on backend)
      const activityPayload = {
        name: activityData.name,
        description: activityData.description,
      };

      // Step 1: Create or update activity
      if (id) {
        // Update existing
        await workActivityApi.updateWorkActivity(id, activityPayload);
        activityId = id;
      } else {
        // Create new
        const newActivity = await workActivityApi.createWorkActivity(activityPayload);
        activityId = newActivity.id;
        setSavedActivityId(newActivity.id);
      }

      // Step 2: Save completion criteria
      // When editing, we only save NEW criteria (those without an ID)
      // Existing criteria are already in the database and managed separately
      if (activityId && criteriaList.length > 0) {
        const newCriteria = criteriaList.filter(c => !c.id);  // Only new criteria without ID
        for (const criteria of newCriteria) {
          await completionCriteriaApi.create(activityId, criteria);
        }
      }

      // Navigate back to list
      navigate('/work-activities');
    } catch (error: any) {
      showError({
        title: 'Failed to save activity',
        message: error.message || 'Could not save work activity',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const getUnitName = (unitCode: string) => {
    const unit = unitsOfMeasure.find(u => u.code === unitCode);
    return unit ? `${unit.name} (${unit.code})` : unitCode;
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/work-activities')}>
          <BackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4">{id ? 'Edit' : 'Add'} Work Activity</Typography>
          <Typography variant="body2" color="text.secondary">
            Follow the steps to {id ? 'update' : 'create'} a work activity
          </Typography>
        </Box>
        {initialLoading && (
          <CircularProgress size={24} />
        )}
      </Box>

      <Card sx={{ p: 3 }}>
        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step Content */}
        <Box sx={{ minHeight: '400px' }}>
          {/* Step 1: Activity Details */}
          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Activity Information
              </Typography>
              <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  fullWidth
                  label="Activity Name *"
                  value={activityData.name}
                  onChange={(e) => setActivityData({ ...activityData, name: e.target.value })}
                  placeholder="e.g., Tea Plucking, Pruning, Weeding"
                />
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={activityData.description}
                  onChange={(e) => setActivityData({ ...activityData, description: e.target.value })}
                  placeholder="Describe the work activity..."
                />
              </Box>
            </Box>
          )}

          {/* Step 2: Add Completion Criteria */}
          {activeStep === 1 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h6">
                    Completion Criteria
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Define how this activity is measured (Optional)
                  </Typography>
                </Box>
                {!showCriteriaForm && (
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setShowCriteriaForm(true)}
                  >
                    Add Criteria
                  </Button>
                )}
              </Box>

              {showCriteriaForm && (
                <Card sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    {editingIndex !== null ? 'Edit' : 'New'} Completion Criteria
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                    {/* Row 1: Dates, Unit, and Target Value */}
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <TextField
                        type="date"
                        label="Start Date *"
                        value={criteriaFormData.startDate}
                        onChange={(e) => setCriteriaFormData({ ...criteriaFormData, startDate: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                        sx={{ flex: '0 0 180px' }}
                      />
                      <TextField
                        type="date"
                        label="End Date (Optional)"
                        value={criteriaFormData.endDate}
                        onChange={(e) => setCriteriaFormData({ ...criteriaFormData, endDate: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                        sx={{ flex: '0 0 180px' }}
                      />
                      <TextField
                        select
                        label="Unit *"
                        value={criteriaFormData.unit}
                        onChange={(e) => setCriteriaFormData({ ...criteriaFormData, unit: e.target.value })}
                        sx={{ flex: '1 1 auto', minWidth: '150px' }}
                      >
                        {unitsOfMeasure.map((unit) => (
                          <MenuItem key={unit.code} value={unit.code}>
                            {unit.name} ({unit.code})
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        type="number"
                        label="Target Value *"
                        value={criteriaFormData.value}
                        onChange={(e) => setCriteriaFormData({ ...criteriaFormData, value: Number(e.target.value) })}
                        inputProps={{ min: 0, step: 0.01 }}
                        sx={{ flex: '0 0 120px' }}
                      />
                    </Box>
                    {/* Row 2: Notes */}
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Notes"
                      value={criteriaFormData.notes}
                      onChange={(e) => setCriteriaFormData({ ...criteriaFormData, notes: e.target.value })}
                    />
                    {/* Row 3: Action Buttons */}
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Button
                        onClick={() => {
                          setShowCriteriaForm(false);
                          setEditingIndex(null);
                          setCriteriaFormData({
                            unit: '',
                            value: 0,
                            startDate: new Date().toISOString().split('T')[0],
                            endDate: '',
                            notes: '',
                          });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleAddCriteria}
                      >
                        {editingIndex !== null ? 'Update' : 'Add'} Criteria
                      </Button>
                    </Box>
                  </Box>
                </Card>
              )}

              {criteriaList.length === 0 && !showCriteriaForm && (
                <Alert severity="info">
                  No completion criteria added yet. You can add criteria now or skip and add later.
                </Alert>
              )}

              {/* Only show the criteria list when not editing/adding */}
              {criteriaList.length > 0 && !showCriteriaForm && (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Unit</TableCell>
                        <TableCell>Target Value</TableCell>
                        <TableCell>Start Date</TableCell>
                        <TableCell>End Date</TableCell>
                        <TableCell>Notes</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {criteriaList.map((criteria, index) => (
                        <TableRow key={index}>
                          <TableCell>{getUnitName(criteria.unit)}</TableCell>
                          <TableCell>{criteria.value}</TableCell>
                          <TableCell>
                            {new Date(criteria.startDate).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </TableCell>
                          <TableCell>
                            {criteria.endDate
                              ? new Date(criteria.endDate).toLocaleDateString('en-IN', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : '-'}
                          </TableCell>
                          <TableCell>{criteria.notes || '-'}</TableCell>
                          <TableCell align="center">
                            <IconButton size="small" onClick={() => handleEditCriteria(index)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDeleteCriteria(index)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* Step 3: Review & Save */}
          {activeStep === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Review & Confirm
              </Typography>

              <Grid container spacing={3}>
                {/* Left Column - Activity Details */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 3, bgcolor: 'grey.50', height: '100%' }}>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      Activity Details
                    </Typography>
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ width: '120px' }}>
                          Name:
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {activityData.name}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ width: '120px' }}>
                          Description:
                        </Typography>
                        <Typography variant="body2">
                          {activityData.description || '-'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ width: '120px' }}>
                          Status:
                        </Typography>
                        <Typography variant="body2" color="text.secondary" fontStyle="italic" fontSize="0.8rem">
                          Auto-calculated based on criteria
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                </Grid>

                {/* Right Column - Completion Criteria */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 3, bgcolor: 'grey.50', height: '100%' }}>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      Completion Criteria ({criteriaList.length})
                    </Typography>
                    {criteriaList.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        No completion criteria added
                      </Typography>
                    ) : (
                      <Box sx={{ mt: 2 }}>
                        {criteriaList.map((criteria, index) => (
                          <Box
                            key={index}
                            sx={{
                              p: 2,
                              mb: 1,
                              bgcolor: 'white',
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: 'divider',
                            }}
                          >
                            <Typography variant="body2" fontWeight="medium">
                              {getUnitName(criteria.unit)}: {criteria.value}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(criteria.startDate).toLocaleDateString('en-IN')} -{' '}
                              {criteria.endDate ? new Date(criteria.endDate).toLocaleDateString('en-IN') : 'Ongoing'}
                            </Typography>
                            {criteria.notes && (
                              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                {criteria.notes}
                              </Typography>
                            )}
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>

        {/* Navigation Buttons - Hide when editing completion criteria */}
        {!(activeStep === 1 && showCriteriaForm) && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0 || loading}
              startIcon={<BackIcon />}
            >
              Back
            </Button>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/work-activities')}
                disabled={loading}
              >
                Cancel
              </Button>
              {activeStep < steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<ForwardIcon />}
                  disabled={loading}
                >
                Next
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleSubmit}
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                disabled={loading}
              >
                {loading ? 'Saving...' : id ? 'Update Activity' : 'Create Activity'}
              </Button>
            )}
          </Box>
        </Box>
        )}
      </Card>
    </Box>
  );
};

export default WorkActivityWizard;

