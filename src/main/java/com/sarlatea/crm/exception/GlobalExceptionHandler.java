package com.sarlatea.crm.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDateTime;

/**
 * Global exception handler for the application
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFoundException(
            ResourceNotFoundException ex, WebRequest request) {
        log.error("Resource not found: {}", ex.getMessage());

        ErrorResponse errorResponse = new ErrorResponse(
                LocalDateTime.now(),
                HttpStatus.NOT_FOUND.value(),
                "Not Found",
                ex.getMessage(),
                request.getDescription(false).replace("uri=", ""));

        return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(DataIntegrityException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityException(
            DataIntegrityException ex, WebRequest request) {
        log.error("Data integrity violation: {}", ex.getMessage());

        ErrorResponse errorResponse = new ErrorResponse(
                LocalDateTime.now(),
                HttpStatus.CONFLICT.value(),
                "Data Integrity Violation",
                ex.getMessage(),
                request.getDescription(false).replace("uri=", ""));

        return new ResponseEntity<>(errorResponse, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDatabaseConstraintViolation(
            DataIntegrityViolationException ex, WebRequest request) {
        log.error("Database constraint violation: {}", ex.getMessage());

        // Extract user-friendly message from the exception
        String userMessage = "A database constraint was violated";

        // Check for duplicate key/unique constraint violation
        String exceptionMessage = ex.getMessage();
        if (exceptionMessage != null) {
            if (exceptionMessage.contains("Duplicate entry")) {
                // Extract the duplicate value and key name
                if (exceptionMessage.contains("work_activities")) {
                    if (exceptionMessage.contains("UK_cd6n3f86ifu2ga2f4rydajpbs") ||
                            exceptionMessage.contains("'name'")) {
                        // Extract the activity name from the error message
                        int startIdx = exceptionMessage.indexOf("'") + 1;
                        int endIdx = exceptionMessage.indexOf("'", startIdx);
                        if (startIdx > 0 && endIdx > startIdx) {
                            String duplicateName = exceptionMessage.substring(startIdx, endIdx);
                            userMessage = "A work activity with the name '" + duplicateName
                                    + "' already exists. Please use a different name.";
                        } else {
                            userMessage = "A work activity with this name already exists. Please use a different name.";
                        }
                    }
                } else if (exceptionMessage.contains("employees")) {
                    userMessage = "An employee with this information already exists. Please check for duplicates.";
                } else if (exceptionMessage.contains("users")) {
                    userMessage = "A user with this username or email already exists.";
                } else {
                    userMessage = "This record already exists in the system. Please check for duplicates.";
                }
            } else if (exceptionMessage.contains("foreign key constraint")
                    || exceptionMessage.contains("ConstraintViolationException")) {
                if (exceptionMessage.contains("assignments")) {
                    userMessage = "Cannot delete this record because it has associated assignments. Please delete the assignments first.";
                } else if (exceptionMessage.contains("salaries")) {
                    userMessage = "Cannot delete this employee because they have salary records. Please delete the salary history first.";
                } else if (exceptionMessage.contains("work_activities")) {
                    userMessage = "Cannot delete this record because it is used in work activities.";
                } else {
                    userMessage = "Cannot perform this operation because related records exist.";
                }
            } else if (exceptionMessage.contains("cannot be null")) {
                userMessage = "Required field is missing. Please fill in all required fields.";
            }
        }

        ErrorResponse errorResponse = new ErrorResponse(
                LocalDateTime.now(),
                HttpStatus.CONFLICT.value(),
                "Duplicate Entry",
                userMessage,
                request.getDescription(false).replace("uri=", ""));

        return new ResponseEntity<>(errorResponse, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGlobalException(
            Exception ex, WebRequest request) {
        log.error("Unexpected error occurred: ", ex);

        ErrorResponse errorResponse = new ErrorResponse(
                LocalDateTime.now(),
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Internal Server Error",
                "An unexpected error occurred",
                request.getDescription(false).replace("uri=", ""));

        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
