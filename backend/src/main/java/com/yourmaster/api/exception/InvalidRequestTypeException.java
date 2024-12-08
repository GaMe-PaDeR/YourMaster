package com.yourmaster.api.exception;

public class InvalidRequestTypeException extends RuntimeException {
    public InvalidRequestTypeException(String message) {
        super(message);
    }
}
