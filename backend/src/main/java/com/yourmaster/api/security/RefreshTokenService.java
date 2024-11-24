package com.yourmaster.api.security;

import com.yourmaster.api.exception.RefreshTokenExpiredException;
import com.yourmaster.api.exception.RefreshTokenNotFoundException;
import com.yourmaster.api.model.User;
import com.yourmaster.api.repository.RefreshTokenRepository;
import com.yourmaster.api.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    @Value("${refreshToken.expirationInMs}")
    private int refreshTokenExpiration;

    private final UserService userService;

    private final RefreshTokenRepository refreshTokenRepository;

    public RefreshToken createRefreshToken(String email) {
        User user = userService.getUserByEmail(email);

        RefreshToken refreshToken = user.getRefreshToken();

        if (refreshToken == null) {
            refreshToken = RefreshToken.builder()
                    .refreshToken(UUID.randomUUID().toString())
                    .expirationTime(Instant.now().plusMillis(refreshTokenExpiration))
                    .user(user)
                    .build();

            refreshTokenRepository.save(refreshToken);
        }
        return refreshToken;
    }

    public RefreshToken verifyRefreshToken(String refreshToken) {
        RefreshToken token = refreshTokenRepository.findByRefreshToken(refreshToken)
                .orElseThrow(() -> new RefreshTokenNotFoundException(refreshToken));

        if (token.getExpirationTime().compareTo(Instant.now()) < 0) {
            refreshTokenRepository.delete(token);
            throw new RefreshTokenExpiredException(token);
        }

        return token;
    }

    public void deleteRefreshToken(String refreshToken) {
        RefreshToken token = refreshTokenRepository.findByRefreshToken(refreshToken)
                .orElseThrow(() -> new RefreshTokenNotFoundException(refreshToken));

        refreshTokenRepository.delete(token);
    }
}
