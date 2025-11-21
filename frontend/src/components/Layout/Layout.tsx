import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Container,
  Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Work as WorkIcon,
  Assignment as AssignmentIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  LocalFlorist as TeaIcon,
  Security as SecurityIcon,
  Logout as LogoutIcon,
  AdminPanelSettings as AdminIcon,
  VpnKey as KeyIcon,
  History as HistoryIcon,
  AccountCircle as AccountCircleIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const drawerWidth = 200;

interface LayoutProps {
  children: React.ReactNode;
}

interface MenuItem {
  text: string;
  icon: React.ReactElement;
  path: string;
}

const menuItems: MenuItem[] = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Employees', icon: <PeopleIcon />, path: '/employees' },
  { text: 'Work Activities', icon: <WorkIcon />, path: '/work-activities' },
  { text: 'Assignments', icon: <AssignmentIcon />, path: '/assignments' },
  { text: 'Reports', icon: <ReportsIcon />, path: '/reports' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/admin/settings' },
];

const securityMenuItems: MenuItem[] = [
  { text: 'Users', icon: <SecurityIcon />, path: '/admin/users' },
  { text: 'Roles', icon: <AdminIcon />, path: '/admin/roles' },
  { text: 'Permissions', icon: <KeyIcon />, path: '/admin/permission-configs' },
  { text: 'Audit Logs', icon: <HistoryIcon />, path: '/admin/audit-logs' },
];

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user, hasPermission } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  // Filter security menu items based on permissions
  const visibleSecurityMenuItems = securityMenuItems.filter((item) => {
    if (item.path === '/admin/users') {
      return hasPermission('VIEW_USERS');
    }
    if (item.path === '/admin/roles') {
      return hasPermission('VIEW_ROLES');
    }
    if (item.path === '/admin/permission-configs') {
      // Only Super Admins (with SYSTEM_ADMIN permission) can see Permissions
      return hasPermission('SYSTEM_ADMIN');
    }
    if (item.path === '/admin/audit-logs') {
      return hasPermission('VIEW_AUDIT_LOGS');
    }
    return false;
  });

  const drawer = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar 
        sx={{ 
          backgroundColor: '#ffffff',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          minHeight: 64,
        }}
      >
        <TeaIcon sx={{ mr: 2, color: '#1976d2', fontSize: 32 }} />
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
          Sarla Tea CRM
        </Typography>
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(0, 0, 0, 0.08)' }} />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{
                borderRadius: '8px',
                mx: 1,
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: '#e3f2fd',
                  color: '#1976d2',
                  '&:hover': {
                    backgroundColor: '#bbdefb',
                  },
                  '& .MuiListItemIcon-root': {
                    color: '#1976d2',
                  },
                },
                '&:hover': {
                  backgroundColor: '#f5f7fa',
                  borderRadius: '8px',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path ? '#1976d2' : 'inherit',
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      {visibleSecurityMenuItems.length > 0 && (
        <>
          <Divider sx={{ borderColor: 'rgba(0, 0, 0, 0.08)', my: 1 }} />
          
          <List>
            <ListItem>
              <Typography variant="caption" sx={{ pl: 2, color: 'text.secondary', fontWeight: 600 }}>
                SECURITY
              </Typography>
            </ListItem>
            {visibleSecurityMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{
                borderRadius: '8px',
                mx: 1,
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: '#e3f2fd',
                  color: '#1976d2',
                  '&:hover': {
                    backgroundColor: '#bbdefb',
                  },
                  '& .MuiListItemIcon-root': {
                    color: '#1976d2',
                  },
                },
                '&:hover': {
                  backgroundColor: '#f5f7fa',
                  borderRadius: '8px',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path ? '#1976d2' : 'inherit',
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
          </List>
        </>
      )}
      
      <Box sx={{ flexGrow: 1 }} />
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: '#ffffff',
          color: '#1a1a1a',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        }}
      >
        <Toolbar sx={{ minHeight: 64 }}>
          <IconButton
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { sm: 'none' },
              color: '#1976d2',
            }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography 
              variant="h6" 
              noWrap 
              component="div"
              sx={{ 
                fontWeight: 600,
                color: '#1a1a1a',
              }}
            >
              Operations Dashboard
            </Typography>
          </Box>
          
          {/* Spacer to push user info to the right */}
          <Box sx={{ flexGrow: 1 }} />
          
          {/* User Profile and Logout in Top Right */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccountCircleIcon sx={{ color: '#1976d2' }} />
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#1a1a1a' }}>
                  {user?.fullName || user?.username || 'User'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {user?.role || 'User'}
                </Typography>
              </Box>
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<LogoutIcon />}
              onClick={() => {
                logout();
                navigate('/login');
              }}
              sx={{
                borderColor: '#d32f2f',
                color: '#d32f2f',
                '&:hover': {
                  borderColor: '#b71c1c',
                  backgroundColor: 'rgba(211, 47, 47, 0.04)',
                },
              }}
            >
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <Toolbar />
        <Container maxWidth="xl" sx={{ mt: 2, px: { xs: 2, sm: 2, md: 3 } }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;

