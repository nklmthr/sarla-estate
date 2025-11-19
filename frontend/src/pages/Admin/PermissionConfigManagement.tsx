import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { permissionConfigApi, PermissionConfig } from '../../api/permissionConfigApi';
import { roleApi, Permission } from '../../api/roleApi';

const PermissionConfigManagement: React.FC = () => {
  const [configs, setConfigs] = useState<PermissionConfig[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<PermissionConfig | null>(null);
  const [formData, setFormData] = useState<PermissionConfig>({
    resourceType: '',
    operationType: '',
    requiredPermission: '',
    description: '',
    isActive: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadConfigs();
    loadPermissions();
  }, []);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const data = await permissionConfigApi.getAllPermissionConfigs();
      setConfigs(data);
    } catch (err: any) {
      console.error('Error loading permission configs:', err);
      setError(err.response?.data?.message || 'Failed to load permission configurations');
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async () => {
    try {
      const data = await roleApi.getAllPermissions();
      setPermissions(data);
    } catch (err: any) {
      console.error('Error loading permissions:', err);
      setError(err.response?.data?.message || 'Failed to load permissions');
    }
  };

  const handleOpenDialog = (config?: PermissionConfig) => {
    setError(null);
    if (config) {
      setEditingConfig(config);
      setFormData({ ...config });
    } else {
      setEditingConfig(null);
      setFormData({
        resourceType: '',
        operationType: '',
        requiredPermission: '',
        description: '',
        isActive: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingConfig(null);
    setError(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (editingConfig) {
        await permissionConfigApi.updatePermissionConfig(editingConfig.id!, formData);
      } else {
        await permissionConfigApi.createPermissionConfig(formData);
      }
      handleCloseDialog();
      loadConfigs();
    } catch (err: any) {
      console.error('Error saving permission config:', err);
      setError(err.response?.data?.message || 'Failed to save permission configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfig = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this permission configuration?')) {
      setLoading(true);
      setError(null);
      try {
        await permissionConfigApi.deletePermissionConfig(id);
        loadConfigs();
      } catch (err: any) {
        console.error('Error deleting permission config:', err);
        setError(err.response?.data?.message || 'Error deleting permission configuration');
      } finally {
        setLoading(false);
      }
    }
  };

  const formatPermissionName = (perm: string) => {
    return perm
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Group configs by resource type
  const groupedConfigs = configs.reduce((acc, config) => {
    if (!acc[config.resourceType]) {
      acc[config.resourceType] = [];
    }
    acc[config.resourceType].push(config);
    return acc;
  }, {} as Record<string, PermissionConfig[]>);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Permission Configuration Management
        </Typography>
        <Box display="flex" gap={2}>
          <Tooltip title="Refresh">
            <IconButton onClick={loadConfigs} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            New Configuration
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Define dynamic permission mappings for resource-operation pairs. These configurations 
            control which permissions are required to perform operations on specific resources.
          </Typography>

          <Box mt={3}>
            {Object.entries(groupedConfigs).map(([resourceType, resourceConfigs]) => (
              <Box key={resourceType} mb={4}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  {resourceType}
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Operation</TableCell>
                        <TableCell>Required Permission</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell align="center">Active</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {resourceConfigs.map((config) => (
                        <TableRow key={config.id}>
                          <TableCell>
                            <Chip label={config.operationType} size="small" color="primary" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {formatPermissionName(config.requiredPermission)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {config.description || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            {config.isActive ? (
                              <Chip label="Active" size="small" color="success" />
                            ) : (
                              <Chip label="Inactive" size="small" color="default" />
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDialog(config)}
                                color="primary"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteConfig(config.id!)}
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ))}

            {configs.length === 0 && !loading && (
              <Box textAlign="center" py={8}>
                <Typography color="text.secondary">
                  No permission configurations found. Create your first configuration.
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingConfig ? 'Edit Permission Configuration' : 'Create Permission Configuration'}
          </DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box display="flex" flexDirection="column" gap={2} mt={2}>
              <TextField
                fullWidth
                required
                label="Resource Type"
                name="resourceType"
                value={formData.resourceType}
                onChange={handleChange}
                placeholder="e.g., EMPLOYEE, WORK_ACTIVITY, ASSIGNMENT"
                helperText="The type of resource this configuration applies to (uppercase, use underscores)"
              />

              <TextField
                fullWidth
                required
                label="Operation Type"
                name="operationType"
                value={formData.operationType}
                onChange={handleChange}
                placeholder="e.g., VIEW, CREATE, EDIT, DELETE"
                helperText="The operation being performed (uppercase)"
              />

              <FormControl fullWidth required>
                <InputLabel>Required Permission</InputLabel>
                <Select
                  name="requiredPermission"
                  value={formData.requiredPermission}
                  onChange={handleChange}
                  label="Required Permission"
                >
                  {permissions.map((perm) => (
                    <MenuItem key={perm} value={perm}>
                      {formatPermissionName(perm)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Description"
                name="description"
                multiline
                rows={3}
                value={formData.description || ''}
                onChange={handleChange}
                placeholder="Describe when this permission configuration is used"
              />

              <Box display="flex" alignItems="center">
                <Typography variant="body2" sx={{ mr: 2 }}>
                  Active:
                </Typography>
                <Switch
                  checked={formData.isActive || false}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
                  }
                  color="primary"
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default PermissionConfigManagement;

