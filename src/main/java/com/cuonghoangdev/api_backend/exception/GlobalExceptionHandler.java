package com.cuonghoangdev.api_backend.exception;

import com.cuonghoangdev.api_backend.dto.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.multipart.MultipartException;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleResourceNotFound(ResourceNotFoundException ex) {
        return new ResponseEntity<>(
                ApiResponse.error(ex.getMessage()),
                HttpStatus.NOT_FOUND
        );
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadRequest(BadRequestException ex) {
        return new ResponseEntity<>(
                ApiResponse.error(ex.getMessage()),
                HttpStatus.BAD_REQUEST
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = (error instanceof FieldError fe) ? fe.getField() : error.getObjectName();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
            LOGGER.warn("[ValidationError] field='{}', message='{}'", fieldName, errorMessage);
        });
        LOGGER.warn("[ValidationError] Total errors: {}", errors.size());
        return new ResponseEntity<>(
                ApiResponse.error("Dữ liệu không hợp lệ: " + errors, errors),
                HttpStatus.BAD_REQUEST
        );
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ApiResponse<Void>> handleMediaTypeNotSupported(HttpMediaTypeNotSupportedException ex) {
        MediaType contentType = ex.getContentType();
        String ctype = contentType != null ? contentType.toString() : "(none)";
        log.error("[GlobalExceptionHandler] HttpMediaTypeNotSupported — contentType='{}', supportedTypes={}",
                ctype, ex.getSupportedMediaTypes());
        return new ResponseEntity<>(
                ApiResponse.error("Unsupported Content-Type: " + ctype + ". This endpoint requires multipart/form-data."),
                HttpStatus.UNSUPPORTED_MEDIA_TYPE
        );
    }

    @ExceptionHandler(MultipartException.class)
    public ResponseEntity<ApiResponse<Void>> handleMultipartException(MultipartException ex) {
        log.error("[GlobalExceptionHandler] MultipartException: {}", ex.getMessage(), ex);
        return new ResponseEntity<>(
                ApiResponse.error("Multipart request error: " + ex.getMessage()),
                HttpStatus.BAD_REQUEST
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneralException(Exception ex) {
        log.error("[GlobalExceptionHandler] Unhandled exception: {} — {}", ex.getClass().getSimpleName(), ex.getMessage(), ex);
        return new ResponseEntity<>(
                ApiResponse.error("Lỗi hệ thống: " + ex.getClass().getSimpleName() + ": " + ex.getMessage()),
                HttpStatus.INTERNAL_SERVER_ERROR
        );
    }
}
