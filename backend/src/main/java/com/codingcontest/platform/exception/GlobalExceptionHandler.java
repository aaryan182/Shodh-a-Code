package com.codingcontest.platform.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.QueryTimeoutException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.transaction.CannotCreateTransactionException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.sql.SQLException;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Global exception handler for the application
 * Handles various types of exceptions and returns standardized error responses
 */
@ControllerAdvice
public class GlobalExceptionHandler {
    
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    
    /**
     * Handle ContestNotFoundException
     */
    @ExceptionHandler(ContestNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleContestNotFound(
            ContestNotFoundException ex, HttpServletRequest request) {
        
        logger.warn("Contest not found: {}", ex.getMessage());
        
        ErrorResponse errorResponse = new ErrorResponse(
            "Contest Not Found",
            ex.getMessage(),
            HttpStatus.NOT_FOUND.value(),
            request.getRequestURI()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
    }
    
    /**
     * Handle validation errors from @Valid annotations
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ValidationErrorResponse> handleValidationErrors(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        
        // Collect field errors
        Map<String, List<String>> fieldErrors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> {
            String fieldName = error.getField();
            String errorMessage = error.getDefaultMessage();
            fieldErrors.computeIfAbsent(fieldName, k -> new ArrayList<>()).add(errorMessage);
        });
        
        // Collect global errors
        List<String> globalErrors = ex.getBindingResult().getGlobalErrors()
                .stream()
                .map(error -> error.getDefaultMessage())
                .collect(Collectors.toList());
        
        String message = String.format("Validation failed for %d field(s)", fieldErrors.size());
        logger.warn("Validation error: {} - Field errors: {}, Global errors: {}", 
                   message, fieldErrors, globalErrors);
        
        ValidationErrorResponse errorResponse = new ValidationErrorResponse(
            "Validation Error",
            message,
            HttpStatus.BAD_REQUEST.value(),
            request.getRequestURI(),
            fieldErrors,
            globalErrors
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }
    
    /**
     * Handle constraint violation errors
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolation(
            ConstraintViolationException ex, HttpServletRequest request) {
        
        StringBuilder message = new StringBuilder("Constraint violation: ");
        ex.getConstraintViolations().forEach(violation -> 
            message.append(violation.getPropertyPath())
                   .append(" - ")
                   .append(violation.getMessage())
                   .append("; ")
        );
        
        logger.warn("Constraint violation: {}", message.toString());
        
        ErrorResponse errorResponse = new ErrorResponse(
            "Constraint Violation",
            message.toString(),
            HttpStatus.BAD_REQUEST.value(),
            request.getRequestURI()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }
    
    /**
     * Handle method argument type mismatch (e.g., invalid path variable types)
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        
        String message = String.format("Invalid parameter '%s': expected %s but got '%s'",
            ex.getName(), 
            ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "unknown",
            ex.getValue());
        
        logger.warn("Type mismatch error: {}", message);
        
        ErrorResponse errorResponse = new ErrorResponse(
            "Invalid Parameter",
            message,
            HttpStatus.BAD_REQUEST.value(),
            request.getRequestURI()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }
    
    /**
     * Handle illegal argument exceptions
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(
            IllegalArgumentException ex, HttpServletRequest request) {
        
        logger.warn("Illegal argument: {}", ex.getMessage());
        
        ErrorResponse errorResponse = new ErrorResponse(
            "Invalid Request",
            ex.getMessage(),
            HttpStatus.BAD_REQUEST.value(),
            request.getRequestURI()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }
    
    /**
     * Handle illegal state exceptions (e.g., contest not active)
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalState(
            IllegalStateException ex, HttpServletRequest request) {
        
        logger.warn("Illegal state: {}", ex.getMessage());
        
        ErrorResponse errorResponse = new ErrorResponse(
            "Operation Not Allowed",
            ex.getMessage(),
            HttpStatus.CONFLICT.value(),
            request.getRequestURI()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.CONFLICT);
    }
    
    /**
     * Handle InvalidSubmissionException
     */
    @ExceptionHandler(InvalidSubmissionException.class)
    public ResponseEntity<ErrorResponse> handleInvalidSubmission(
            InvalidSubmissionException ex, HttpServletRequest request) {
        
        logger.warn("Invalid submission: {}", ex.getMessage());
        
        ErrorResponse errorResponse = new ErrorResponse(
            "Invalid Submission",
            ex.getMessage(),
            HttpStatus.BAD_REQUEST.value(),
            request.getRequestURI()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }
    
    /**
     * Handle CodeExecutionException
     */
    @ExceptionHandler(CodeExecutionException.class)
    public ResponseEntity<ErrorResponse> handleCodeExecution(
            CodeExecutionException ex, HttpServletRequest request) {
        
        logger.error("Code execution failed: {} - Type: {}, ExecutionId: {}, Language: {}", 
                    ex.getMessage(), ex.getFailureType(), ex.getExecutionId(), ex.getLanguage(), ex);
        
        String userMessage = getUserFriendlyExecutionMessage(ex.getFailureType());
        
        ErrorResponse errorResponse = new ErrorResponse(
            "Code Execution Error",
            userMessage,
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            request.getRequestURI()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    
    /**
     * Handle DatabaseConnectionException
     */
    @ExceptionHandler(DatabaseConnectionException.class)
    public ResponseEntity<ErrorResponse> handleDatabaseConnection(
            DatabaseConnectionException ex, HttpServletRequest request) {
        
        logger.error("Database connection error: {} - Operation: {}", ex.getMessage(), ex.getOperation(), ex);
        
        ErrorResponse errorResponse = new ErrorResponse(
            "Service Temporarily Unavailable",
            "Database service is temporarily unavailable. Please try again later.",
            HttpStatus.SERVICE_UNAVAILABLE.value(),
            request.getRequestURI()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.SERVICE_UNAVAILABLE);
    }
    
    /**
     * Handle RateLimitExceededException
     */
    @ExceptionHandler(RateLimitExceededException.class)
    public ResponseEntity<RateLimitErrorResponse> handleRateLimit(
            RateLimitExceededException ex, HttpServletRequest request) {
        
        logger.warn("Rate limit exceeded: {} - Endpoint: {}, Client: {}", 
                   ex.getMessage(), ex.getEndpoint(), ex.getClientId());
        
        long retryAfterSeconds = ex.getResetTime() != null ? 
            ChronoUnit.SECONDS.between(LocalDateTime.now(), ex.getResetTime()) : 60;
        
        RateLimitErrorResponse errorResponse = new RateLimitErrorResponse(
            "Rate Limit Exceeded",
            ex.getMessage(),
            HttpStatus.TOO_MANY_REQUESTS.value(),
            request.getRequestURI(),
            ex.getEndpoint(),
            ex.getCurrentRequests(),
            ex.getMaxRequests(),
            retryAfterSeconds,
            ex.getResetTime()
        );
        
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header("Retry-After", String.valueOf(retryAfterSeconds))
                .header("X-RateLimit-Limit", String.valueOf(ex.getMaxRequests()))
                .header("X-RateLimit-Remaining", String.valueOf(Math.max(0, ex.getMaxRequests() - ex.getCurrentRequests())))
                .header("X-RateLimit-Reset", ex.getResetTime() != null ? ex.getResetTime().toString() : "")
                .body(errorResponse);
    }
    
    /**
     * Handle database access exceptions
     */
    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<ErrorResponse> handleDataAccess(
            DataAccessException ex, HttpServletRequest request) {
        
        logger.error("Database access error: {}", ex.getMessage(), ex);
        
        ErrorResponse errorResponse = new ErrorResponse(
            "Database Error",
            "A database error occurred. Please try again later.",
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            request.getRequestURI()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    
    /**
     * Handle data integrity violations
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolation(
            DataIntegrityViolationException ex, HttpServletRequest request) {
        
        logger.warn("Data integrity violation: {}", ex.getMessage());
        
        ErrorResponse errorResponse = new ErrorResponse(
            "Data Conflict",
            "The operation conflicts with existing data. Please check your input and try again.",
            HttpStatus.CONFLICT.value(),
            request.getRequestURI()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.CONFLICT);
    }
    
    /**
     * Handle query timeout exceptions
     */
    @ExceptionHandler(QueryTimeoutException.class)
    public ResponseEntity<ErrorResponse> handleQueryTimeout(
            QueryTimeoutException ex, HttpServletRequest request) {
        
        logger.error("Query timeout: {}", ex.getMessage(), ex);
        
        ErrorResponse errorResponse = new ErrorResponse(
            "Request Timeout",
            "The request took too long to process. Please try again later.",
            HttpStatus.REQUEST_TIMEOUT.value(),
            request.getRequestURI()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.REQUEST_TIMEOUT);
    }
    
    /**
     * Handle transaction creation failures
     */
    @ExceptionHandler(CannotCreateTransactionException.class)
    public ResponseEntity<ErrorResponse> handleCannotCreateTransaction(
            CannotCreateTransactionException ex, HttpServletRequest request) {
        
        logger.error("Cannot create transaction: {}", ex.getMessage(), ex);
        
        ErrorResponse errorResponse = new ErrorResponse(
            "Service Unavailable",
            "Database service is temporarily unavailable. Please try again later.",
            HttpStatus.SERVICE_UNAVAILABLE.value(),
            request.getRequestURI()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.SERVICE_UNAVAILABLE);
    }
    
    /**
     * Handle SQL exceptions
     */
    @ExceptionHandler(SQLException.class)
    public ResponseEntity<ErrorResponse> handleSQLException(
            SQLException ex, HttpServletRequest request) {
        
        logger.error("SQL exception: {} - Error Code: {}, SQL State: {}", 
                    ex.getMessage(), ex.getErrorCode(), ex.getSQLState(), ex);
        
        ErrorResponse errorResponse = new ErrorResponse(
            "Database Error",
            "A database error occurred. Please try again later.",
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            request.getRequestURI()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    
    /**
     * Handle authentication exceptions
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthentication(
            AuthenticationException ex, HttpServletRequest request) {
        
        logger.warn("Authentication failed: {}", ex.getMessage());
        
        ErrorResponse errorResponse = new ErrorResponse(
            "Authentication Failed",
            "Invalid credentials provided.",
            HttpStatus.UNAUTHORIZED.value(),
            request.getRequestURI()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.UNAUTHORIZED);
    }
    
    /**
     * Handle bad credentials
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(
            BadCredentialsException ex, HttpServletRequest request) {
        
        logger.warn("Bad credentials: {}", ex.getMessage());
        
        ErrorResponse errorResponse = new ErrorResponse(
            "Invalid Credentials",
            "Username or password is incorrect.",
            HttpStatus.UNAUTHORIZED.value(),
            request.getRequestURI()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.UNAUTHORIZED);
    }
    
    /**
     * Handle access denied exceptions
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(
            AccessDeniedException ex, HttpServletRequest request) {
        
        logger.warn("Access denied: {}", ex.getMessage());
        
        ErrorResponse errorResponse = new ErrorResponse(
            "Access Denied",
            "You don't have permission to access this resource.",
            HttpStatus.FORBIDDEN.value(),
            request.getRequestURI()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.FORBIDDEN);
    }
    
    /**
     * Handle missing request parameters
     */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> handleMissingParameter(
            MissingServletRequestParameterException ex, HttpServletRequest request) {
        
        logger.warn("Missing parameter: {}", ex.getMessage());
        
        ErrorResponse errorResponse = new ErrorResponse(
            "Missing Parameter",
            String.format("Required parameter '%s' is missing", ex.getParameterName()),
            HttpStatus.BAD_REQUEST.value(),
            request.getRequestURI()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }
    
    /**
     * Handle HTTP message not readable (malformed JSON)
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleHttpMessageNotReadable(
            HttpMessageNotReadableException ex, HttpServletRequest request) {
        
        logger.warn("Malformed request body: {}", ex.getMessage());
        
        ErrorResponse errorResponse = new ErrorResponse(
            "Malformed Request",
            "Request body is malformed or contains invalid JSON.",
            HttpStatus.BAD_REQUEST.value(),
            request.getRequestURI()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }
    
    /**
     * Handle unsupported HTTP methods
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMethodNotSupported(
            HttpRequestMethodNotSupportedException ex, HttpServletRequest request) {
        
        logger.warn("Method not supported: {}", ex.getMessage());
        
        ErrorResponse errorResponse = new ErrorResponse(
            "Method Not Supported",
            String.format("HTTP method '%s' is not supported for this endpoint", ex.getMethod()),
            HttpStatus.METHOD_NOT_ALLOWED.value(),
            request.getRequestURI()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.METHOD_NOT_ALLOWED);
    }
    
    /**
     * Handle unsupported media types
     */
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMediaTypeNotSupported(
            HttpMediaTypeNotSupportedException ex, HttpServletRequest request) {
        
        logger.warn("Media type not supported: {}", ex.getMessage());
        
        ErrorResponse errorResponse = new ErrorResponse(
            "Media Type Not Supported",
            String.format("Media type '%s' is not supported", ex.getContentType()),
            HttpStatus.UNSUPPORTED_MEDIA_TYPE.value(),
            request.getRequestURI()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.UNSUPPORTED_MEDIA_TYPE);
    }
    
    /**
     * Handle no handler found (404 errors)
     */
    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoHandlerFound(
            NoHandlerFoundException ex, HttpServletRequest request) {
        
        logger.warn("No handler found: {}", ex.getMessage());
        
        ErrorResponse errorResponse = new ErrorResponse(
            "Not Found",
            String.format("No handler found for %s %s", ex.getHttpMethod(), ex.getRequestURL()),
            HttpStatus.NOT_FOUND.value(),
            request.getRequestURI()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
    }
    
    /**
     * Handle all other unexpected exceptions
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(
            Exception ex, HttpServletRequest request) {
        
        logger.error("Unexpected error occurred: {}", ex.getMessage(), ex);
        
        ErrorResponse errorResponse = new ErrorResponse(
            "Internal Server Error",
            "An unexpected error occurred. Please try again later.",
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            request.getRequestURI()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    
    /**
     * Get user-friendly message for code execution failures
     */
    private String getUserFriendlyExecutionMessage(CodeExecutionException.ExecutionFailureType failureType) {
        return switch (failureType) {
            case DOCKER_UNAVAILABLE -> "Code execution service is temporarily unavailable. Please try again later.";
            case CONTAINER_CREATION_FAILED -> "Unable to create execution environment. Please try again.";
            case EXECUTION_TIMEOUT -> "Your code took too long to execute. Please optimize your solution.";
            case COMPILATION_ERROR -> "Your code has compilation errors. Please fix them and try again.";
            case RUNTIME_ERROR -> "Your code encountered a runtime error during execution.";
            case MEMORY_LIMIT_EXCEEDED -> "Your code exceeded the memory limit. Please optimize memory usage.";
            case OUTPUT_LIMIT_EXCEEDED -> "Your code produced too much output. Please check your solution.";
            case SECURITY_VIOLATION -> "Your code attempted an unauthorized operation.";
            default -> "Code execution failed due to an unknown error. Please try again.";
        };
    }
}
