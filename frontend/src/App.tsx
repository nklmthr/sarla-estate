import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import EmployeeList from './pages/Employees/EmployeeList';
import EmployeeForm from './pages/Employees/EmployeeForm';
import WorkActivityList from './pages/WorkActivities/WorkActivityList';
import WorkActivityForm from './pages/WorkActivities/WorkActivityForm';
import AssignmentList from './pages/Assignments/AssignmentList';
import SalaryManagement from './pages/Salary/SalaryManagement';
import Reports from './pages/Reports/Reports';

const theme = createTheme({
  palette: {
    primary: {
      main: '#66bb6a', // Soft green
      light: '#98ee99',
      dark: '#338a3e',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ffb74d', // Light saffron
      light: '#ffe97d',
      dark: '#c88719',
      contrastText: '#000000',
    },
    warning: {
      main: '#ffd54f', // Soft yellow
      light: '#ffff81',
      dark: '#c8a415',
      contrastText: '#000000',
    },
    info: {
      main: '#81c784', // Light green accent
      light: '#b2fab4',
      dark: '#519657',
      contrastText: '#ffffff',
    },
    success: {
      main: '#a5d6a7', // Very soft green
      light: '#d7ffd9',
      dark: '#75a478',
      contrastText: '#000000',
    },
    background: {
      default: '#fafafa', // Very light gray
      paper: '#ffffff',
    },
    text: {
      primary: '#2e7d32',
      secondary: '#558b2f',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      color: '#2e7d32',
      letterSpacing: '-0.5px',
    },
    h5: {
      fontWeight: 600,
      color: '#388e3c',
      letterSpacing: '-0.3px',
    },
    h6: {
      fontWeight: 600,
      color: '#558b2f',
      letterSpacing: '-0.2px',
    },
    body1: {
      color: '#424242',
    },
    body2: {
      color: '#616161',
    },
  },
  shape: {
    borderRadius: 12,
  },
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
          borderRadius: 8,
        },
        colorSuccess: {
          backgroundColor: '#c8e6c9',
          color: '#2e7d32',
        },
        colorWarning: {
          backgroundColor: '#fff9c4',
          color: '#f57f17',
        },
        colorInfo: {
          backgroundColor: '#b2dfdb',
          color: '#00695c',
        },
        colorError: {
          backgroundColor: '#ffcdd2',
          color: '#c62828',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #66bb6a 0%, #81c784 50%, #a5d6a7 100%)',
          boxShadow: '0 2px 12px rgba(102, 187, 106, 0.2)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: 'linear-gradient(180deg, #ffffff 0%, #f5f5f5 100%)',
          borderRight: '1px solid rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#f1f8e9',
            fontWeight: 700,
            color: '#2e7d32',
            textTransform: 'uppercase',
            fontSize: '0.75rem',
            letterSpacing: '0.5px',
            borderBottom: '2px solid #c8e6c9',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:nth-of-type(even)': {
            backgroundColor: '#fafafa',
          },
          '&:hover': {
            backgroundColor: '#f1f8e9 !important',
            transition: 'background-color 0.2s ease',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
          padding: '16px',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'rgba(0, 0, 0, 0.12)',
              borderWidth: 2,
            },
            '&:hover fieldset': {
              borderColor: '#81c784',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#66bb6a',
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
        elevation1: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        },
        elevation2: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        },
        elevation3: {
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
          borderRadius: 12,
          marginTop: 4,
        },
        listbox: {
          padding: 8,
          '& .MuiAutocomplete-option': {
            borderRadius: 8,
            margin: '2px 0',
            '&[aria-selected="true"]': {
              backgroundColor: '#e8f5e9',
            },
            '&.Mui-focused': {
              backgroundColor: '#f1f8e9',
            },
          },
        },
        groupLabel: {
          backgroundColor: '#66bb6a',
          color: 'white',
          fontWeight: 600,
          padding: '8px 16px',
          borderRadius: 8,
          marginTop: 8,
          marginBottom: 4,
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            
            {/* Employee Routes */}
            <Route path="/employees" element={<EmployeeList />} />
            <Route path="/employees/new" element={<EmployeeForm />} />
            <Route path="/employees/:id/edit" element={<EmployeeForm />} />
            
            {/* Work Activity Routes */}
            <Route path="/work-activities" element={<WorkActivityList />} />
            <Route path="/work-activities/new" element={<WorkActivityForm />} />
            <Route path="/work-activities/:id/edit" element={<WorkActivityForm />} />
            
            {/* Assignment Routes */}
            <Route path="/assignments" element={<AssignmentList />} />
            
            {/* Salary Routes */}
            <Route path="/salary" element={<SalaryManagement />} />
            
            {/* Reports Routes */}
            <Route path="/reports" element={<Reports />} />
            
            {/* Redirect unknown routes to dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
