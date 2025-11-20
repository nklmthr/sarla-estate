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
  MenuItem,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { userApi, User } from '../../api/userApi';
import { roleApi, Role } from '../../api/roleApi';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';

const UserManagement: React.FC = () => {
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<User>({
    username: '',
    fullName: '',
    email: '',
    roleId: '',
    isActive: true,
    password: '',
  });

  useEffect(() => {
    loadUsers();
    // Only load roles if user has permission to view them
    if (hasPermission('VIEW_ROLES')) {
      loadRoles();
    }
  }, []);

  const loadUsers = async () => {
    try {
      const data = await userApi.getAllUsers();
      setUsers(data);
    } catch (error) {
      // Error handled by global interceptor
    }
  };

  const loadRoles = async () => {
    try {
      const data = await roleApi.getActiveRoles();
      setRoles(data);
    } catch (error) {
      // Silently fail if user doesn't have permission to view roles
      // They can still view/edit users, just can't change roles
      setRoles([]);
    }
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        ...user,
        password: '', // Don't populate password for editing
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        fullName: '',
        email: '',
        roleId: roles.length > 0 ? roles[0].id : '',
        isActive: true,
        password: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'isActive' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await userApi.updateUser(editingUser.id!, formData);
      } else {
        await userApi.createUser(formData);
      }
      await loadUsers();
      handleCloseDialog();
    } catch (error: any) {
      // Error handled by global interceptor
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userApi.deleteUser(id);
        await loadUsers();
      } catch (error) {
        // Error handled by global interceptor
      }
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">User Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disabled={!hasPermission('VIEW_ROLES')}
          title={!hasPermission('VIEW_ROLES') ? 'You need VIEW_ROLES permission to create users' : ''}
        >
          Add User
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Username</TableCell>
                  <TableCell>Full Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.fullName || '-'}</TableCell>
                    <TableCell>{user.email || '-'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={user.role} 
                        color={user.role === 'ADMIN' ? 'error' : 'primary'} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={user.isActive ? 'Active' : 'Inactive'} 
                        color={user.isActive ? 'success' : 'default'} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      {user.lastLogin 
                        ? format(new Date(user.lastLogin), 'MMM dd, yyyy HH:mm')
                        : 'Never'}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(user)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(user.id!)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit User Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingUser ? 'Edit User' : 'Add New User'}
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              required
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              margin="normal"
              disabled={!!editingUser}
            />
            <TextField
              fullWidth
              label="Full Name"
              name="fullName"
              value={formData.fullName || ''}
              onChange={handleChange}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email || ''}
              onChange={handleChange}
              margin="normal"
            />
            <TextField
              fullWidth
              required={!editingUser}
              label={editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
              name="password"
              type="password"
              value={formData.password || ''}
              onChange={handleChange}
              margin="normal"
            />
            {roles.length > 0 ? (
              <TextField
                fullWidth
                required
                select
                label="Role"
                name="roleId"
                value={formData.roleId || ''}
                onChange={handleChange}
                margin="normal"
              >
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.name}
                  </MenuItem>
                ))}
              </TextField>
            ) : (
              <TextField
                fullWidth
                label="Role"
                value={editingUser?.role || 'N/A (Insufficient permissions to view roles)'}
                margin="normal"
                disabled
                helperText="You don't have permission to view or change roles"
              />
            )}
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive ?? true}
                  onChange={handleChange}
                  name="isActive"
                  color="primary"
                />
              }
              label="Active"
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingUser ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default UserManagement;

