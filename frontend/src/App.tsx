import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard';
import EmployeeList from './pages/Employees/EmployeeList';
import EmployeeForm from './pages/Employees/EmployeeForm';
import WorkActivityList from './pages/WorkActivities/WorkActivityList';
import WorkActivityForm from './pages/WorkActivities/WorkActivityForm';
import AssignmentList from './pages/Assignments/AssignmentList';
import SalaryManagement from './pages/Salary/SalaryManagement';
import Reports from './pages/Reports/Reports';
import AdminSettings from './pages/Admin/AdminSettings';
import { ErrorProvider, useError } from './contexts/ErrorContext';
import { setGlobalErrorHandler } from './api/apiClient';
import UserManagement from './pages/Admin/UserManagement';
import RoleManagement from './pages/Admin/RoleManagement';
import PermissionConfigManagement from './pages/Admin/PermissionConfigManagement';
import AuditLogPage from './pages/AuditLogs/AuditLogPage';
import Profile from './pages/Profile';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#9c27b0',
      light: '#ba68c8',
      dark: '#7b1fa2',
      contrastText: '#ffffff',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
      contrastText: '#ffffff',
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#c62828',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
      dark: '#e65100',
      contrastText: '#ffffff',
    },
    info: {
      main: '#0288d1',
      light: '#03a9f4',
      dark: '#01579b',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#666666',
      disabled: '#9e9e9e',
    },
    divider: 'rgba(0, 0, 0, 0.08)',
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      color: '#1a1a1a',
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
      color: '#1a1a1a',
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      color: '#1a1a1a',
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#1a1a1a',
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: '#333333',
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      color: '#333333',
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      color: '#1a1a1a',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      color: '#666666',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
      letterSpacing: '0.01em',
      fontSize: '0.9375rem',
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
      color: '#666666',
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0,0,0,0.05)',
    '0px 4px 8px rgba(0,0,0,0.08)',
    '0px 8px 16px rgba(0,0,0,0.1)',
    '0px 12px 24px rgba(0,0,0,0.12)',
    '0px 16px 32px rgba(0,0,0,0.14)',
    '0px 20px 40px rgba(0,0,0,0.16)',
    '0px 24px 48px rgba(0,0,0,0.18)',
    '0px 28px 56px rgba(0,0,0,0.20)',
    ...Array(16).fill('0px 2px 4px rgba(0,0,0,0.05)'),
  ] as any,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 600,
          padding: '8px 20px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #66bb6a 0%, #81c784 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #ffb74d 0%, #ffd54f 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #ffa726 0%, #ffb74d 100%)',
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          borderRadius: 6,
          height: 28,
        },
        colorSuccess: {
          backgroundColor: '#e8f5e9',
          color: '#2e7d32',
        },
        colorWarning: {
          backgroundColor: '#fff3e0',
          color: '#e65100',
        },
        colorInfo: {
          backgroundColor: '#e3f2fd',
          color: '#0277bd',
        },
        colorError: {
          backgroundColor: '#ffebee',
          color: '#c62828',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#1a1a1a',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          borderRight: '1px solid rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#f8f9fa',
            fontWeight: 600,
            color: '#1a1a1a',
            fontSize: '0.8125rem',
            letterSpacing: '0.02em',
            borderBottom: '2px solid #e0e0e0',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#f5f7fa !important',
            transition: 'background-color 0.15s ease',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #e0e0e0',
          padding: '12px 16px',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#d0d5dd',
            },
            '&:hover fieldset': {
              borderColor: '#98a2b3',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#1976d2',
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation0: {
          boxShadow: 'none',
        },
        elevation1: {
          boxShadow: '0px 2px 4px rgba(0,0,0,0.05)',
        },
        elevation2: {
          boxShadow: '0px 4px 8px rgba(0,0,0,0.08)',
        },
        elevation3: {
          boxShadow: '0px 8px 16px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          borderRadius: 8,
          marginTop: 4,
        },
        listbox: {
          padding: 8,
          '& .MuiAutocomplete-option': {
            borderRadius: 6,
            margin: '2px 0',
            '&[aria-selected="true"]': {
              backgroundColor: '#e3f2fd',
            },
            '&.Mui-focused': {
              backgroundColor: '#f5f7fa',
            },
          },
        },
        groupLabel: {
          backgroundColor: '#1976d2',
          color: 'white',
          fontWeight: 600,
          padding: '8px 16px',
          borderRadius: 6,
          marginTop: 8,
          marginBottom: 4,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          },
        },
      },
    },
  },
});

// Component to initialize error handlers
const ErrorHandlerInitializer: React.FC = () => {
  const { showHttpError, showNetworkError } = useError();

  // Initialize global error handlers once
  useEffect(() => {
    setGlobalErrorHandler(showHttpError, showNetworkError);
  }, [showHttpError, showNetworkError]);

  return null; // This component only initializes, doesn't render anything
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorProvider>
        <ErrorHandlerInitializer />
        <AuthProvider>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />

              {/* Protected Routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } />

              {/* Profile Route */}
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              } />

              {/* Employee Routes */}
              <Route path="/employees" element={
                <ProtectedRoute>
                  <Layout>
                    <EmployeeList />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/employees/new" element={
                <ProtectedRoute>
                  <Layout>
                    <EmployeeForm />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/employees/:id/edit" element={
                <ProtectedRoute>
                  <Layout>
                    <EmployeeForm />
                  </Layout>
                </ProtectedRoute>
              } />

              {/* Work Activity Routes */}
              <Route path="/work-activities" element={
                <ProtectedRoute>
                  <Layout>
                    <WorkActivityList />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/work-activities/new" element={
                <ProtectedRoute>
                  <Layout>
                    <WorkActivityForm />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/work-activities/:id/edit" element={
                <ProtectedRoute>
                  <Layout>
                    <WorkActivityForm />
                  </Layout>
                </ProtectedRoute>
              } />

              {/* Assignment Routes */}
              <Route path="/assignments" element={
                <ProtectedRoute>
                  <Layout>
                    <AssignmentList />
                  </Layout>
                </ProtectedRoute>
              } />

              {/* Salary Routes */}
              <Route path="/salary" element={
                <ProtectedRoute>
                  <Layout>
                    <SalaryManagement />
                  </Layout>
                </ProtectedRoute>
              } />

              {/* Reports Routes */}
              <Route path="/reports" element={
                <ProtectedRoute>
                  <Layout>
                    <Reports />
                  </Layout>
                </ProtectedRoute>
              } />

              {/* Admin Routes */}
              <Route path="/admin/settings" element={
                <ProtectedRoute>
                  <Layout>
                    <AdminSettings />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute>
                  <Layout>
                    <UserManagement />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/admin/roles" element={
                <ProtectedRoute>
                  <Layout>
                    <RoleManagement />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/admin/permission-configs" element={
                <ProtectedRoute>
                  <Layout>
                    <PermissionConfigManagement />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/admin/audit-logs" element={
                <ProtectedRoute>
                  <Layout>
                    <AuditLogPage />
                  </Layout>
                </ProtectedRoute>
              } />

              {/* Redirect unknown routes to dashboard */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ErrorProvider>
    </ThemeProvider>
  );
};


export default App;
