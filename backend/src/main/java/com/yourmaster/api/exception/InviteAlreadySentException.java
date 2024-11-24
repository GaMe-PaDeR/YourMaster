package com.yourmaster.api.exception;

public class InviteAlreadySentException extends RuntimeException{
    public InviteAlreadySentException(String message) {
        super(message);
    }
}
