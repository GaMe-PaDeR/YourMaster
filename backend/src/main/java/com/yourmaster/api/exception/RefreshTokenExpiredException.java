package com.yourmaster.api.exception;

import com.yourmaster.api.security.RefreshToken;
import lombok.Getter;

@Getter
public class RefreshTokenExpiredException extends RuntimeException{
    private final RefreshToken refreshToken;

    public RefreshTokenExpiredException(RefreshToken refreshToken) {
        super(String.format("Refresh token: %s expired", refreshToken.getRefreshToken()));
        this.refreshToken = refreshToken;
    }
}
