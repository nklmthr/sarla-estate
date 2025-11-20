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
  FormControlLabel,
  FormGroup,
  Checkbox,
  FormLabel,
  Alert,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  VpnKey as PermissionIcon,
} from '@mui/icons-material';
import { roleApi, Role, Permission } from '../../api/roleApi';

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState<Role>({
    name: '',
    description: '',
    permissions: [],
    isActive: true,
  });

  useEffect(() => {
    loadRoles();
    loadPermissions();
  }, []);

  const loadRoles = async () => {
    try {
      const data = await roleApi.getAllRoles();
      setRoles(data);
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const loadPermissions = async () => {
    try {
      const data = await roleApi.getAllPermissions();
      setPermissions(data);
    } catch (error) {
      console.error('Error loading permissions:', error);
    }
  };

  const handleOpenDialog = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        ...role,
        permissions: role.permissions || [],
      });
    } else {
      setEditingRole(null);
      setFormData({
        name: '',
        description: '',
        permissions: [],
        isActive: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingRole(null);
  };

  const handleOpenPermissionsDialog = (role: Role) => {
    setEditingRole(role);
    setFormData({
      ...role,
      permissions: role.permissions || [],
    });
    setPermissionsDialogOpen(true);
  };

  const handleClosePermissionsDialog = () => {
    setPermissionsDialogOpen(false);
    setEditingRole(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'isActive' ? checked : value,
    }));
  };

  const handlePermissionToggle = (permissionName: string) => {
    setFormData((prev) => {
      const permissions = prev.permissions || [];
      const hasPermission = permissions.includes(permissionName);
      
      return {
        ...prev,
        permissions: hasPermission
          ? permissions.filter(p => p !== permissionName)
          : [...permissions, permissionName],
      };
    });
  };

  const handleSelectAllPermissions = () => {
    setFormData((prev) => ({
      ...prev,
      permissions: permissions.map(p => typeof p === 'string' ? p : (p as any).name || p) as string[],
    }));
  };

  const handleDeselectAllPermissions = () => {
    setFormData((prev) => ({
      ...prev,
      permissions: [],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRole) {
        await roleApi.updateRole(editingRole.id!, formData);
      } else {
        await roleApi.createRole(formData);
      }
      await loadRoles();
      handleCloseDialog();
    } catch (error: any) {
      console.error('Error saving role:', error);
      alert(error.response?.data?.message || 'Error saving role');
    }
  };

  const handleSavePermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRole) {
        await roleApi.updateRole(editingRole.id!, formData);
        await loadRoles();
        handleClosePermissionsDialog();
      }
    } catch (error: any) {
      console.error('Error saving permissions:', error);
      alert(error.response?.data?.message || 'Error saving permissions');
    }
  };

  const handleDelete = async (id: string, isSystemRole: boolean, name: string) => {
    if (isSystemRole) {
      alert('Cannot delete system role');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete the role "${name}"?`)) {
      try {
        await roleApi.deleteRole(id);
        await loadRoles();
      } catch (error: any) {
        console.error('Error deleting role:', error);
        alert(error.response?.data?.message || 'Error deleting role');
      }
    }
  };

  // Helper function to convert permission enum to display name
  const formatPermissionName = (permission: string): string => {
    return permission
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Helper function to get category from permission
  const getPermissionCategory = (permission: string): string => {
    const word = permission.split('_')[0];
    return word.charAt(0) + word.slice(1).toLowerCase();
  };

  // Group permissions by category
  const groupedPermissions = permissions.reduce((acc, permission) => {
    // Handle both string permissions and Permission objects
    const permissionStr = typeof permission === 'string' ? permission : (permission as any).name || permission;
    const category = getPermissionCategory(permissionStr);
    
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permissionStr as any);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Role Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Role
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Role Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Permissions</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <Typography fontWeight="medium">{role.name}</Typography>
                    </TableCell>
                    <TableCell>{role.description || '-'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={`${role.permissions?.length || 0} permissions`} 
                        size="small" 
                        color="primary"
                        variant="outlined"
                        onClick={() => handleOpenPermissionsDialog(role)}
                        sx={{ cursor: 'pointer' }}
                      />
                    </TableCell>
                    <TableCell>
                      {role.isSystemRole && (
                        <Chip label="System" size="small" color="info" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={role.isActive ? 'Active' : 'Inactive'} 
                        color={role.isActive ? 'success' : 'default'} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Manage Permissions" arrow>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenPermissionsDialog(role)}
                          color="primary"
                        >
                          <PermissionIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={role.isSystemRole ? "System roles cannot be edited" : "Edit Role"} arrow>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(role)}
                            color="primary"
                            disabled={role.isSystemRole}
                          >
                            <EditIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title={role.isSystemRole ? "System roles cannot be deleted" : "Delete Role"} arrow>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(role.id!, role.isSystemRole || false, role.name)}
                            color="error"
                            disabled={role.isSystemRole}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Role Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingRole ? 'Edit Role' : 'Add New Role'}
          </DialogTitle>
          <DialogContent>
            {editingRole?.isSystemRole && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                This is a system role. You can view permissions but cannot modify the role itself.
              </Alert>
            )}
            
            <TextField
              fullWidth
              required
              label="Role Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              margin="normal"
              disabled={editingRole?.isSystemRole}
            />
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              margin="normal"
              multiline
              rows={2}
              disabled={editingRole?.isSystemRole}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive ?? true}
                  onChange={handleChange}
                  name="isActive"
                  color="primary"
                  disabled={editingRole?.isSystemRole}
                />
              }
              label="Active"
              sx={{ mt: 2 }}
            />

            <Box sx={{ mt: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <FormLabel component="legend">Permissions</FormLabel>
                {!editingRole?.isSystemRole && (
                  <Box>
                    <Button size="small" onClick={handleSelectAllPermissions}>
                      Select All
                    </Button>
                    <Button size="small" onClick={handleDeselectAllPermissions}>
                      Deselect All
                    </Button>
                  </Box>
                )}
              </Box>

              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {Object.entries(groupedPermissions).map(([category, perms]) => (
                  <Accordion key={category} defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography fontWeight="medium">{category}</Typography>
                      <Chip 
                        label={perms.filter(p => formData.permissions?.includes(p as string)).length + '/' + perms.length}
                        size="small"
                        sx={{ ml: 2 }}
                      />
                    </AccordionSummary>
                    <AccordionDetails>
                      <FormGroup>
                        {perms.map((permission) => {
                          const permissionStr = permission as string;
                          return (
                            <FormControlLabel
                              key={permissionStr}
                              control={
                                <Checkbox
                                  checked={formData.permissions?.includes(permissionStr) || false}
                                  onChange={() => handlePermissionToggle(permissionStr)}
                                  disabled={editingRole?.isSystemRole}
                                />
                              }
                              label={formatPermissionName(permissionStr)}
                            />
                          );
                        })}
                      </FormGroup>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>
              {editingRole?.isSystemRole ? 'Close' : 'Cancel'}
            </Button>
            {!editingRole?.isSystemRole && (
              <Button type="submit" variant="contained">
                {editingRole ? 'Update' : 'Create'}
              </Button>
            )}
          </DialogActions>
        </form>
      </Dialog>

      {/* Manage Permissions Dialog */}
      <Dialog open={permissionsDialogOpen} onClose={handleClosePermissionsDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSavePermissions}>
          <DialogTitle>
            Manage Permissions - {editingRole?.name}
          </DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              {editingRole?.isSystemRole 
                ? 'You can modify permissions for this system role. Changes will be saved immediately.'
                : 'Select the permissions to grant to this role.'}
            </Alert>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Role:</strong> {editingRole?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Description:</strong> {editingRole?.description || '-'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Current Permissions:</strong> {formData.permissions?.length || 0} of {permissions.length}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <FormLabel component="legend">Select Permissions</FormLabel>
                <Box>
                  <Button size="small" onClick={handleSelectAllPermissions}>
                    Select All
                  </Button>
                  <Button size="small" onClick={handleDeselectAllPermissions}>
                    Deselect All
                  </Button>
                </Box>
              </Box>
            </Box>

            <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
              {Object.entries(groupedPermissions).map(([category, perms]) => (
                <Accordion key={category} defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight="medium">{category}</Typography>
                    <Chip 
                      label={`${perms.filter(p => formData.permissions?.includes(p as string)).length}/${perms.length}`}
                      size="small"
                      color={perms.filter(p => formData.permissions?.includes(p as string)).length > 0 ? 'primary' : 'default'}
                      sx={{ ml: 2 }}
                    />
                  </AccordionSummary>
                  <AccordionDetails>
                    <FormGroup>
                      {perms.map((permission) => {
                        const permissionStr = permission as string;
                        return (
                          <FormControlLabel
                            key={permissionStr}
                            control={
                              <Checkbox
                                checked={formData.permissions?.includes(permissionStr) || false}
                                onChange={() => handlePermissionToggle(permissionStr)}
                              />
                            }
                            label={formatPermissionName(permissionStr)}
                          />
                        );
                      })}
                    </FormGroup>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClosePermissionsDialog}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary">
              Save Permissions
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default RoleManagement;

