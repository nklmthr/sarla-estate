import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
} from '@mui/material';
import {
  People as PeopleIcon,
  Work as WorkIcon,
  Assignment as AssignmentIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as CompletedIcon,
  PendingActions as PendingIcon,
  ErrorOutline as InactiveIcon,
} from '@mui/icons-material';
import { employeeApi } from '../api/employeeApi';
import { workActivityApi } from '../api/workActivityApi';
import { reportApi } from '../api/reportApi';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useError } from '../contexts/ErrorContext';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactElement;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography color="textSecondary" gutterBottom variant="body2">
            {title}
          </Typography>
          <Typography variant="h4" component="div" sx={{ mt: 1 }}>
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            backgroundColor: color,
            borderRadius: 2,
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {React.cloneElement(icon, { sx: { fontSize: 32, color: 'white' } })}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    todayAssignments: 0,
    totalActivities: 0,
    inactiveActivities: 0,
    monthlyPayment: 0,
  });
  const [todayAssignments, setTodayAssignments] = useState<any[]>([]);
  const [inactiveActivitiesList, setInactiveActivitiesList] = useState<any[]>([]);

  // Reload dashboard data whenever navigating to this page
  useEffect(() => {
    loadDashboardData();
  }, [location.pathname]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd');
      
      // Fetch all data in parallel
      const [employees, activities, todayReport, paymentReport] = await Promise.all([
        employeeApi.getAllEmployees().catch(() => []),
        workActivityApi.getAllWorkActivities().catch(() => []),
        reportApi.getDailyAssignmentsReport(todayStr).catch(() => null),
        reportApi.getPaymentReport(monthStart, monthEnd).catch(() => null),
      ]);

      const employeesArray = Array.isArray(employees) ? employees : [];
      const activitiesArray = Array.isArray(activities) ? activities : [];
      
      // Count active and inactive activities based on backend-calculated status
      // Status is calculated based on whether the activity has active completion criteria
      const activeActivities = activitiesArray.filter(a => a.status === 'ACTIVE').length;
      const inactiveActivitiesData = activitiesArray.filter(a => a.status === 'INACTIVE');
      const inactiveActivities = inactiveActivitiesData.length;
      
      // Store inactive activities list for display
      setInactiveActivitiesList(inactiveActivitiesData);
      
      // Today's assignments data
      const todayData = todayReport?.data || todayReport;
      const todayAssignmentsList = Array.isArray(todayData?.assignments) ? todayData.assignments : [];
      
      // Payment data
      const paymentData = paymentReport?.data || paymentReport;
      const monthlyTotal = paymentData?.totalPaymentAmount || 0;

      setStats({
        totalEmployees: employeesArray.length,
        todayAssignments: todayAssignmentsList.length,
        totalActivities: activeActivities,
        inactiveActivities: inactiveActivities,
        monthlyPayment: monthlyTotal,
      });

      // Sort: Pending (ASSIGNED) first, then Evaluated (COMPLETED)
      const sortedAssignments = todayAssignmentsList.sort((a: any, b: any) => {
        if (a.status === 'ASSIGNED' && b.status === 'COMPLETED') return -1;
        if (a.status === 'COMPLETED' && b.status === 'ASSIGNED') return 1;
        return 0;
      });

      // Get today's assignments (first 10)
      setTodayAssignments(sortedAssignments.slice(0, 10));
    } catch (error) {
      // Error handled by global interceptor
      setTodayAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Stat Cards - Single Row */}
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Total Employees"
            value={stats.totalEmployees}
            icon={<PeopleIcon />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Today's Assignments"
            value={stats.todayAssignments}
            icon={<AssignmentIcon />}
            color="#9c27b0"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Active Activities"
            value={stats.totalActivities}
            icon={<WorkIcon />}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Inactive Activities"
            value={stats.inactiveActivities}
            icon={<InactiveIcon />}
            color="#d32f2f"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Current Month Payment"
            value={`₹${stats.monthlyPayment.toLocaleString()}`}
            icon={<MoneyIcon />}
            color="#2e7d32"
          />
        </Grid>

        {/* Today's Assignments - Left */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, minHeight: 500 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Today's Assignments
              </Typography>
              <Chip 
                label={format(new Date(), 'MMMM dd, yyyy')} 
                color="primary" 
                variant="outlined"
              />
            </Box>
            <Divider sx={{ mb: 2 }} />
            {todayAssignments.length === 0 ? (
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={8}>
                <AssignmentIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography color="textSecondary" variant="h6">
                  No assignments for today
                </Typography>
                <Typography color="textSecondary" variant="body2">
                  Check back tomorrow or create new assignments
                </Typography>
              </Box>
            ) : (
              <List sx={{ maxHeight: 420, overflow: 'auto' }}>
                {todayAssignments.map((assignment, index) => (
                  <ListItem 
                    key={index} 
                    divider={index < todayAssignments.length - 1}
                    sx={{ 
                      px: 0, 
                      py: 1.5,
                      '&:hover': { backgroundColor: 'action.hover' }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body1" fontWeight="medium">
                            {assignment.assignedEmployeeName}
                          </Typography>
                          {assignment.status === 'COMPLETED' ? (
                            <Chip 
                              icon={<CompletedIcon />}
                              label="Evaluated" 
                              size="small" 
                              color="success" 
                            />
                          ) : (
                            <Chip 
                              icon={<PendingIcon />}
                              label="Pending" 
                              size="small" 
                              color="warning" 
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            Activity: {assignment.activityName}
                          </Typography>
                          {assignment.completionPercentage !== undefined && assignment.completionPercentage !== null && (
                            <Typography variant="body2" color="textSecondary">
                              Completion: {assignment.completionPercentage}%
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Quick Stats - Middle */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, minHeight: 500 }}>
            <Typography variant="h6" gutterBottom>
              Quick Stats
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ mt: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" py={1.5}>
                <Typography variant="body2" color="textSecondary">
                  Total Employees
                </Typography>
                <Typography variant="h6" color="primary.main">
                  {stats.totalEmployees}
                </Typography>
              </Box>
              <Divider />
              <Box display="flex" justifyContent="space-between" alignItems="center" py={1.5}>
                <Typography variant="body2" color="textSecondary">
                  Active Activities
                </Typography>
                <Typography variant="h6" color="warning.main">
                  {stats.totalActivities}
                </Typography>
              </Box>
              <Divider />
              <Box display="flex" justifyContent="space-between" alignItems="center" py={1.5}>
                <Typography variant="body2" color="textSecondary">
                  Inactive Activities
                </Typography>
                <Typography variant="h6" color="error.main">
                  {stats.inactiveActivities}
                </Typography>
              </Box>
              <Divider />
              <Box display="flex" justifyContent="space-between" alignItems="center" py={1.5}>
                <Typography variant="body2" color="textSecondary">
                  Today's Assignments
                </Typography>
                <Typography variant="h6" color="secondary.main">
                  {stats.todayAssignments}
                </Typography>
              </Box>
              <Divider />
              <Box display="flex" justifyContent="space-between" alignItems="center" py={1.5}>
                <Typography variant="body2" color="textSecondary">
                  Current Month Payment
                </Typography>
                <Typography variant="h6" color="success.main">
                  ₹{stats.monthlyPayment.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Inactive Activities - Right */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, minHeight: 500 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Inactive Activities
              </Typography>
              <Chip 
                label={`${stats.inactiveActivities} Total`}
                color="error" 
                size="small"
              />
            </Box>
            <Divider sx={{ mb: 2 }} />
            {inactiveActivitiesList.length === 0 ? (
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={8}>
                <WorkIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography color="textSecondary" variant="h6">
                  All activities are active
                </Typography>
                <Typography color="textSecondary" variant="body2">
                  Great! No activities need attention
                </Typography>
              </Box>
            ) : (
              <List sx={{ maxHeight: 420, overflow: 'auto' }}>
                {inactiveActivitiesList.map((activity, index) => (
                  <ListItem 
                    key={activity.id || index} 
                    divider={index < inactiveActivitiesList.length - 1}
                    sx={{ 
                      px: 0, 
                      py: 1.5,
                      '&:hover': { backgroundColor: 'action.hover' }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body1" fontWeight="medium">
                            {activity.name}
                          </Typography>
                          <Chip 
                            icon={<InactiveIcon />}
                            label="Inactive" 
                            size="small" 
                            color="error" 
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            {activity.description || 'No description'}
                          </Typography>
                          {activity.completionCriteria && activity.completionCriteria.length > 0 ? (
                            <Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 0.5 }}>
                              ⚠ Has {activity.completionCriteria.length} criteria but none are currently active
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 0.5 }}>
                              ⚠ No completion criteria defined
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;

