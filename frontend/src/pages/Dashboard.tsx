import React, { useEffect, useState } from 'react';
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
} from '@mui/material';
import {
  People as PeopleIcon,
  Work as WorkIcon,
  Assignment as AssignmentIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { employeeApi } from '../api/employeeApi';
import { workActivityApi } from '../api/workActivityApi';
import { reportApi } from '../api/reportApi';
import { format } from 'date-fns';

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
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    totalActivities: 0,
    upcomingAssignments: 0,
  });
  const [recentAssignments, setRecentAssignments] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range for next week
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      
      // Fetch all data in parallel
      const [employees, activities, upcomingReport] = await Promise.all([
        employeeApi.getAllEmployees().catch(() => []),
        workActivityApi.getAllWorkActivities().catch(() => []),
        reportApi.getUpcomingAssignments(
          format(today, 'yyyy-MM-dd'),
          format(nextWeek, 'yyyy-MM-dd')
        ).catch(() => ({ totalAssignments: 0, assignments: [] })),
      ]);

      const employeesArray = Array.isArray(employees) ? employees : [];
      const activitiesArray = Array.isArray(activities) ? activities : [];
      const reportData = upcomingReport.data || upcomingReport;
      
      const activeEmployees = employeesArray.filter(e => e.status === 'ACTIVE').length;
      const activeActivities = activitiesArray.filter(a => a.status === 'ACTIVE').length;

      setStats({
        totalEmployees: employeesArray.length,
        activeEmployees,
        totalActivities: activeActivities,
        upcomingAssignments: reportData.totalAssignments || 0,
      });

      // Get recent assignments (first 5 from report)
      if (Array.isArray(reportData.assignments)) {
        setRecentAssignments(reportData.assignments.slice(0, 5));
      } else {
        setRecentAssignments([]);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setRecentAssignments([]);
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
        {/* Stat Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Employees"
            value={stats.totalEmployees}
            icon={<PeopleIcon />}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Employees"
            value={stats.activeEmployees}
            icon={<PeopleIcon />}
            color="#66bb6a"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Work Activities"
            value={stats.totalActivities}
            icon={<WorkIcon />}
            color="#ff9800"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Upcoming Assignments"
            value={stats.upcomingAssignments}
            icon={<AssignmentIcon />}
            color="#ffd54f"
          />
        </Grid>

        {/* Recent Assignments */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Upcoming Assignments
            </Typography>
            {recentAssignments.length === 0 ? (
              <Typography color="textSecondary">
                No upcoming assignments
              </Typography>
            ) : (
              <List>
                {recentAssignments.map((assignment, index) => (
                  <ListItem key={index} divider={index < recentAssignments.length - 1}>
                    <ListItemText
                      primary={assignment.activityName}
                      secondary={
                        <>
                          Date: {format(new Date(assignment.assignmentDate), 'MMM dd, yyyy')} | 
                          Status: {assignment.status} | 
                          Shift: {assignment.workShift}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Quick Info */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              System Overview
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" paragraph>
                <strong>Tea Estate Management System</strong>
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Manage your tea estate operations efficiently with our comprehensive CRM system.
              </Typography>
              <Typography variant="body2" color="textSecondary">
                • Track employees and their activities
              </Typography>
              <Typography variant="body2" color="textSecondary">
                • Schedule work assignments
              </Typography>
              <Typography variant="body2" color="textSecondary">
                • Manage salaries and payments
              </Typography>
              <Typography variant="body2" color="textSecondary">
                • Generate detailed reports
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;

