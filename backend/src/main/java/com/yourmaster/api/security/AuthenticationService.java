package com.yourmaster.api.security;

import com.yourmaster.api.Constants;
import com.yourmaster.api.dto.*;
import com.yourmaster.api.dto.request.RefreshTokenRequest;
import com.yourmaster.api.dto.response.AuthResponse;
import com.yourmaster.api.dto.response.LogoutResponse;
import com.yourmaster.api.exception.InvalidEmailOrPasswordException;
import com.yourmaster.api.exception.UserAlreadyExistsException;
import com.yourmaster.api.model.User;
import com.yourmaster.api.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
@RequiredArgsConstructor
public class AuthenticationService {
    private final UserService userService;
    private final JwtService jwtService;
    private final BlacklistingService blacklistingService;
    private final RefreshTokenService refreshTokenService;
    private final AuthenticationManager authenticationManager;

    public AuthResponse signUp(UserDto userDto, MultipartFile file) throws IOException {
        if (Boolean.TRUE.equals(userService.checkEmailAvailability(userDto.getEmail()))) {
            throw new UserAlreadyExistsException(Constants.USER_EMAIL_EXISTS_MSG);
        }

        User user = userService.addUser(userDto, file);
        var jwt = jwtService.generateToken(user);
        var refreshToken = refreshTokenService.createRefreshToken(user.getEmail());

        return AuthResponse.builder()
                .accessToken(jwt)
                .refreshToken(refreshToken.getRefreshToken())
                .build();
    }

    public AuthResponse signIn(SignInDto signInDto) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(signInDto.getEmail(), signInDto.getPassword())
            );
        } catch (AuthenticationException e) {
            throw new InvalidEmailOrPasswordException(Constants.INVALID_EMAIL_PASSWORD);
        }

        var user = userService.getUserByEmail(signInDto.getEmail());

        var jwt = jwtService.generateToken(user);
        var refreshToken = refreshTokenService.createRefreshToken(signInDto.getEmail());

        return AuthResponse.builder()
                .accessToken(jwt)
                .refreshToken(refreshToken.getRefreshToken())
                .build();
    }

    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenService.verifyRefreshToken(request.getRefreshToken());
        User user = refreshToken.getUser();
        String accessToken = jwtService.generateToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getRefreshToken())
                .build();
    }

    public LogoutResponse logout(String authHeader) {
        String jwt = authHeader.substring(Constants.BEARER_PREFIX.length());
        String username = jwtService.extractUsername(jwt);
        User currentUser = userService.getUserByEmail(username);

        blacklistingService.blackListJwt(jwt);
        refreshTokenService.deleteRefreshToken(currentUser.getRefreshToken().getRefreshToken());
        return new LogoutResponse(Constants.SUCCESSFUL_LOGOUT);
    }

}
