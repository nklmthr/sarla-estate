package com.sarlatea.crm.exception;

/**
 * Exception thrown when attempting to perform an operation that would violate data integrity
 */
public class DataIntegrityException extends RuntimeException {
    
    public DataIntegrityException(String message) {
        super(message);
    }
    
    public DataIntegrityException(String message, Throwable cause) {
        super(message, cause);
    }
}

