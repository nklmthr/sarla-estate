import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  AlertTitle,
  Box,
  IconButton,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

export type ErrorSeverity = 'error' | 'warning' | 'info' | 'success';

interface ErrorDetails {
  title: string;
  message: string;
  severity: ErrorSeverity;
  details?: string;
  technicalInfo?: string;
  canRetry?: boolean;
  onRetry?: () => void;
}

interface ErrorContextType {
  showError: (error: ErrorDetails) => void;
  showHttpError: (statusCode: number, message?: string, technicalDetails?: string) => void;
  showNetworkError: () => void;
  showSuccess: (message: string) => void;
  showInfo: (message: string) => void;
  showWarning: (message: string) => void;
  clearError: () => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within ErrorProvider');
  }
  return context;
};

interface ErrorProviderProps {
  children: ReactNode;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null);
  const [showTechnical, setShowTechnical] = useState(false);

  const showError = (error: ErrorDetails) => {
    setErrorDetails(error);
    setShowTechnical(false);
  };

  const showHttpError = (statusCode: number, message?: string, technicalDetails?: string) => {
    let title = 'Error';
    let defaultMessage = 'An unexpected error occurred';
    let severity: ErrorSeverity = 'error';

    switch (statusCode) {
      case 400:
        title = 'Invalid Request';
        defaultMessage = 'The request contains invalid data. Please check your input and try again.';
        severity = 'warning';
        break;
      case 401:
        title = 'Authentication Required';
        defaultMessage = 'Your session has expired. Please log in again to continue.';
        severity = 'warning';
        break;
      case 403:
        title = 'Access Denied';
        defaultMessage = 'You do not have permission to perform this action. Please contact your administrator if you believe this is an error.';
        severity = 'error';
        break;
      case 404:
        title = 'Not Found';
        defaultMessage = 'The requested resource could not be found. It may have been deleted or moved.';
        severity = 'warning';
        break;
      case 409:
        title = 'Conflict';
        defaultMessage = 'This operation conflicts with existing data. Please refresh and try again.';
        severity = 'warning';
        break;
      case 422:
        title = 'Validation Error';
        defaultMessage = 'The data provided failed validation. Please check all required fields.';
        severity = 'warning';
        break;
      case 500:
        title = 'Server Error';
        defaultMessage = 'An internal server error occurred. Our team has been notified. Please try again later.';
        severity = 'error';
        break;
      case 502:
        title = 'Bad Gateway';
        defaultMessage = 'The server is temporarily unavailable. Please try again in a few moments.';
        severity = 'error';
        break;
      case 503:
        title = 'Service Unavailable';
        defaultMessage = 'The service is temporarily unavailable. Please try again later.';
        severity = 'error';
        break;
      case 504:
        title = 'Gateway Timeout';
        defaultMessage = 'The request took too long to process. Please try again.';
        severity = 'error';
        break;
      default:
        title = `Error ${statusCode}`;
        defaultMessage = 'An unexpected error occurred. Please try again.';
        severity = 'error';
    }

    showError({
      title,
      message: message || defaultMessage,
      severity,
      technicalInfo: technicalDetails,
      canRetry: [500, 502, 503, 504].includes(statusCode),
    });
  };

  const showNetworkError = () => {
    showError({
      title: 'Network Error',
      message: 'Unable to connect to the server. Please check your internet connection and try again.',
      severity: 'error',
      details: 'This usually happens when:\n• Your internet connection is down\n• The server is offline\n• A firewall is blocking the connection',
      canRetry: true,
    });
  };

  const showSuccess = (message: string) => {
    showError({
      title: 'Success',
      message,
      severity: 'success',
    });
  };

  const showInfo = (message: string) => {
    showError({
      title: 'Information',
      message,
      severity: 'info',
    });
  };

  const showWarning = (message: string) => {
    showError({
      title: 'Warning',
      message,
      severity: 'warning',
    });
  };

  const clearError = () => {
    setErrorDetails(null);
    setShowTechnical(false);
  };

  const handleRetry = () => {
    if (errorDetails?.onRetry) {
      errorDetails.onRetry();
    }
    clearError();
  };

  const getIcon = (severity: ErrorSeverity) => {
    switch (severity) {
      case 'error':
        return <ErrorIcon fontSize="large" color="error" />;
      case 'warning':
        return <WarningIcon fontSize="large" color="warning" />;
      case 'info':
        return <InfoIcon fontSize="large" color="info" />;
      case 'success':
        return <SuccessIcon fontSize="large" color="success" />;
    }
  };

  return (
    <ErrorContext.Provider
      value={{
        showError,
        showHttpError,
        showNetworkError,
        showSuccess,
        showInfo,
        showWarning,
        clearError,
      }}
    >
      {children}

      {/* Error Dialog */}
      <Dialog
        open={!!errorDetails}
        onClose={clearError}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderTop: 4,
            borderColor: errorDetails?.severity === 'error' ? 'error.main' :
                         errorDetails?.severity === 'warning' ? 'warning.main' :
                         errorDetails?.severity === 'info' ? 'info.main' :
                         'success.main',
          },
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            {errorDetails && getIcon(errorDetails.severity)}
            <Typography variant="h6" component="div" flex={1}>
              {errorDetails?.title}
            </Typography>
            <IconButton
              edge="end"
              color="inherit"
              onClick={clearError}
              aria-label="close"
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          <Alert 
            severity={errorDetails?.severity || 'error'} 
            variant="outlined"
            sx={{ mb: 2 }}
          >
            <AlertTitle sx={{ fontWeight: 'bold' }}>
              {errorDetails?.title}
            </AlertTitle>
            {errorDetails?.message}
          </Alert>

          {errorDetails?.details && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                {errorDetails.details}
              </Typography>
            </Box>
          )}

          {errorDetails?.technicalInfo && (
            <Box sx={{ mt: 2 }}>
              <Button
                size="small"
                onClick={() => setShowTechnical(!showTechnical)}
                sx={{ mb: 1 }}
              >
                {showTechnical ? 'Hide' : 'Show'} Technical Details
              </Button>
              {showTechnical && (
                <Box sx={{ p: 2, bgcolor: 'grey.900', color: 'grey.100', borderRadius: 1, overflowX: 'auto' }}>
                  <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {errorDetails.technicalInfo}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          {errorDetails?.canRetry && errorDetails?.onRetry && (
            <Button onClick={handleRetry} color="primary" variant="outlined">
              Retry
            </Button>
          )}
          <Button onClick={clearError} color="primary" variant="contained" autoFocus>
            {errorDetails?.severity === 'success' ? 'OK' : 'Close'}
          </Button>
        </DialogActions>
      </Dialog>
    </ErrorContext.Provider>
  );
};

