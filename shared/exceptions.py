"""
Gestio V4 - Custom Exception Classes

Defines all custom exceptions used throughout the application
for proper error handling and logging.

@author: djabi
@date: 2025-11-17
"""


class GestioException(Exception):
    """Base exception for all Gestio application errors."""

    def __init__(self, message: str, error_code: str = None, context: dict = None):
        """
        Initialize GestioException.

        Args:
            message: The error message
            error_code: Optional error code for categorization
            context: Optional dictionary with additional context information
        """
        super().__init__(message)
        self.message = message
        self.error_code = error_code or "UNKNOWN"
        self.context = context or {}

    def __str__(self):
        return f"[{self.error_code}] {self.message}"


class DatabaseError(GestioException):
    """Exception raised for database-related errors."""

    def __init__(self, message: str, context: dict = None):
        super().__init__(message, error_code="DATABASE_ERROR", context=context)


class OCRError(GestioException):
    """Exception raised for OCR processing errors."""

    def __init__(self, message: str, context: dict = None):
        super().__init__(message, error_code="OCR_ERROR", context=context)


class ValidationError(GestioException):
    """Exception raised for data validation errors."""

    def __init__(self, message: str, context: dict = None):
        super().__init__(message, error_code="VALIDATION_ERROR", context=context)


class ServiceError(GestioException):
    """Exception raised for service-level errors."""

    def __init__(self, message: str, context: dict = None):
        super().__init__(message, error_code="SERVICE_ERROR", context=context)


class FileOperationError(GestioException):
    """Exception raised for file operation errors."""

    def __init__(self, message: str, context: dict = None):
        super().__init__(message, error_code="FILE_OPERATION_ERROR", context=context)


class ConfigurationError(GestioException):
    """Exception raised for configuration errors."""

    def __init__(self, message: str, context: dict = None):
        super().__init__(message, error_code="CONFIGURATION_ERROR", context=context)


class AttachmentError(GestioException):
    """Exception raised for attachment-related errors."""

    def __init__(self, message: str, context: dict = None):
        super().__init__(message, error_code="ATTACHMENT_ERROR", context=context)


class RecurrenceError(GestioException):
    """Exception raised for recurrence-related errors."""

    def __init__(self, message: str, context: dict = None):
        super().__init__(message, error_code="RECURRENCE_ERROR", context=context)
