import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    Typography,
    TextField,
    Button,
    Grid,
    Tabs,
    Tab,
    Autocomplete,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    CircularProgress,
    TablePagination,
    Avatar,
} from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { userApi, UserProfile } from '../api/userApi';
import { useError } from '../contexts/ErrorContext';
import { auditLogApi, AuditLog } from '../api/auditLogApi';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

const Profile: React.FC = () => {
    const { user } = useAuth();
    const { showError, showSuccess } = useError();
    const [tabValue, setTabValue] = useState(0);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(false);

    // Profile Form State
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [timezone, setTimezone] = useState<string | null>(null);

    // Password Form State
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Activity State
    const [activityLogs, setActivityLogs] = useState<AuditLog[]>([]);
    const [activityLoading, setActivityLoading] = useState(false);
    const [activityPage, setActivityPage] = useState(0);
    const [activityRowsPerPage, setActivityRowsPerPage] = useState(10);
    const [activityTotalElements, setActivityTotalElements] = useState(0);

    // Profile Picture State
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);

    const timezones = [
        "UTC",
        "America/New_York",
        "America/Los_Angeles",
        "America/Chicago",
        "Europe/London",
        "Europe/Paris",
        "Europe/Berlin",
        "Asia/Tokyo",
        "Asia/Shanghai",
        "Asia/Kolkata",
        "Australia/Sydney",
        "Pacific/Auckland"
    ];

    useEffect(() => {
        loadProfile();
        
        // Cleanup blob URL on unmount
        return () => {
            if (profilePictureUrl) {
                URL.revokeObjectURL(profilePictureUrl);
            }
        };
    }, []);

    useEffect(() => {
        if (tabValue === 2 && user?.username) {
            loadActivity();
        }
    }, [tabValue, user, activityPage, activityRowsPerPage]);

    const loadProfile = async () => {
        try {
            const data = await userApi.getProfile();
            setProfile(data);
            setFullName(data.fullName || '');
            setEmail(data.email || '');
            setTimezone(data.timezone || 'UTC');
            
            // Load profile picture if it exists
            if (data.profilePicture && data.id) {
                loadProfilePicture(data.id);
            } else {
                setProfilePictureUrl(null);
            }
        } catch (error: any) {
            showError({
                title: 'Failed to load profile',
                message: error.message || 'Could not fetch user profile',
                severity: 'error',
            });
        }
    };

    const loadProfilePicture = async (userId: string) => {
        try {
            const blob = await userApi.getProfilePicture(userId);
            const url = URL.createObjectURL(blob);
            setProfilePictureUrl(url);
        } catch (error) {
            // Silently handle missing profile pictures
            setProfilePictureUrl(null);
        }
    };

    const loadActivity = async () => {
        if (!user?.username) return;
        setActivityLoading(true);
        try {
            const response = await auditLogApi.getAuditLogs({
                username: user.username,
                page: activityPage,
                size: activityRowsPerPage,
                sortBy: 'timestamp',
                sortDirection: 'DESC'
            });
            setActivityLogs(response.content);
            setActivityTotalElements(response.totalElements);
        } catch (error: any) {
            showError({
                title: 'Failed to load activity',
                message: error.message || 'Could not fetch activity logs',
                severity: 'error',
            });
        } finally {
            setActivityLoading(false);
        }
    };

    const handleActivityPageChange = (_event: unknown, newPage: number) => {
        setActivityPage(newPage);
    };

    const handleActivityRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setActivityRowsPerPage(parseInt(event.target.value, 10));
        setActivityPage(0);
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                showError({
                    title: 'Invalid file type',
                    message: 'Please select an image file',
                    severity: 'error',
                });
                return;
            }
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showError({
                    title: 'File too large',
                    message: 'Please select an image smaller than 5MB',
                    severity: 'error',
                });
                return;
            }
            setSelectedFile(file);
            // Create preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUploadPicture = async () => {
        if (!selectedFile) return;

        setLoading(true);
        try {
            const updatedProfile = await userApi.uploadProfilePicture(selectedFile);
            setProfile(updatedProfile);
            setSelectedFile(null);
            setPreviewUrl(null);
            showSuccess('Profile picture uploaded successfully');
            // Reload profile to get updated picture URL
            await loadProfile();
        } catch (error: any) {
            showError({
                title: 'Upload Failed',
                message: error.message || 'Failed to upload profile picture',
                severity: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRemovePicture = async () => {
        setLoading(true);
        try {
            const updatedProfile = await userApi.deleteProfilePicture();
            setProfile(updatedProfile);
            setSelectedFile(null);
            setPreviewUrl(null);
            setProfilePictureUrl(null);
            showSuccess('Profile picture removed successfully');
        } catch (error: any) {
            showError({
                title: 'Remove Failed',
                message: error.message || 'Failed to remove profile picture',
                severity: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const formatTimestamp = (timestamp: string) => {
        try {
            const date = new Date(timestamp);
            return new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: user?.timezone || undefined,
            }).format(date);
        } catch {
            return timestamp;
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const updatedProfile = await userApi.updateProfile({
                fullName,
                email,
                timezone: timezone || 'UTC',
            });
            setProfile(updatedProfile);

            // Update local storage user data if needed, or trigger a re-fetch in AuthContext
            // For now, we can manually update the user object in localStorage to reflect changes immediately
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const updatedUser = {
                ...currentUser,
                fullName: updatedProfile.fullName,
                email: updatedProfile.email,
                timezone: updatedProfile.timezone
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            // Ideally AuthContext should expose a method to update user state without full login
            // But since we are reloading the page or navigating, it might be fine. 
            // Actually, let's just show success.

            showSuccess('Profile updated successfully');
        } catch (error: any) {
            showError({
                title: 'Update Failed',
                message: error.message || 'Failed to update profile',
                severity: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            showError({
                title: 'Validation Error',
                message: 'New passwords do not match',
                severity: 'error',
            });
            return;
        }

        setLoading(true);
        try {
            await userApi.changePassword({
                oldPassword,
                newPassword,
            });
            showSuccess('Password changed successfully');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            showError({
                title: 'Password Change Failed',
                message: error.message || 'Failed to change password',
                severity: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    if (!profile) {
        return <Box sx={{ p: 3 }}>Loading...</Box>;
    }

    return (
        <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
            <Typography variant="h4" gutterBottom>
                My Profile
            </Typography>

            <Card>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabValue} onChange={handleTabChange}>
                        <Tab label="General Information" />
                        <Tab label="Security" />
                        <Tab label="Activity" />
                    </Tabs>
                </Box>

                <TabPanel value={tabValue} index={0}>
                    <form onSubmit={handleUpdateProfile}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Username"
                                    value={profile.username}
                                    disabled
                                    helperText="Username cannot be changed"
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar
                                        src={previewUrl || profilePictureUrl || undefined}
                                        sx={{ width: 80, height: 80 }}
                                    />
                                    <Box>
                                        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                            <input
                                                accept="image/*"
                                                style={{ display: 'none' }}
                                                id="profile-picture-upload"
                                                type="file"
                                                onChange={handleFileSelect}
                                            />
                                            <label htmlFor="profile-picture-upload">
                                                <Button
                                                    variant="outlined"
                                                    component="span"
                                                    startIcon={<PhotoCamera />}
                                                    disabled={loading}
                                                >
                                                    {profilePictureUrl ? 'Change Picture' : 'Upload Picture'}
                                                </Button>
                                            </label>
                                            {profilePictureUrl && !selectedFile && (
                                                <Button
                                                    variant="outlined"
                                                    color="error"
                                                    onClick={handleRemovePicture}
                                                    disabled={loading}
                                                >
                                                    Remove Picture
                                                </Button>
                                            )}
                                        </Box>
                                        {selectedFile && (
                                            <>
                                                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                                    Selected: {selectedFile.name}
                                                </Typography>
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    onClick={handleUploadPicture}
                                                    disabled={loading}
                                                    sx={{ mt: 1 }}
                                                >
                                                    Upload
                                                </Button>
                                            </>
                                        )}
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            Max size: 5MB. Formats: JPG, PNG, GIF
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Full Name"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Autocomplete
                                    options={timezones}
                                    value={timezone}
                                    onChange={(_, newValue) => setTimezone(newValue)}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Timezone"
                                            helperText="Select your preferred timezone for displaying dates"
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={loading}
                                >
                                    Save Changes
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    <form onSubmit={handleChangePassword}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Current Password"
                                    type="password"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="New Password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Confirm New Password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="warning"
                                    disabled={loading}
                                >
                                    Change Password
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </TabPanel>

                <TabPanel value={tabValue} index={2}>
                    {activityLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                            <CircularProgress />
                        </Box>
                    ) : activityLogs.length === 0 ? (
                        <Typography color="text.secondary">No activity found</Typography>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Timestamp</TableCell>
                                        <TableCell>Operation</TableCell>
                                        <TableCell>Entity</TableCell>
                                        <TableCell>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {activityLogs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell>{formatTimestamp(log.timestamp)}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={log.operation}
                                                    size="small"
                                                    color={
                                                        log.operation === 'CREATE' ? 'success' :
                                                            log.operation === 'EDIT' ? 'info' :
                                                                log.operation === 'DELETE' ? 'error' :
                                                                    log.operation === 'LOGIN' ? 'primary' :
                                                                        'default'
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {log.entityName || log.entityType}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={log.status}
                                                    size="small"
                                                    color={log.status === 'SUCCESS' ? 'success' : 'error'}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <TablePagination
                                rowsPerPageOptions={[5, 10, 25, 50]}
                                component="div"
                                count={activityTotalElements}
                                rowsPerPage={activityRowsPerPage}
                                page={activityPage}
                                onPageChange={handleActivityPageChange}
                                onRowsPerPageChange={handleActivityRowsPerPageChange}
                            />
                        </TableContainer>
                    )}
                </TabPanel>
            </Card>
        </Box>
    );
};

export default Profile;
