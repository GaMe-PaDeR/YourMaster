package com.yourmaster.api.service;

import com.yourmaster.api.dto.SignInDto;
import com.yourmaster.api.dto.response.AuthResponse;
import com.yourmaster.api.model.User;
import com.yourmaster.api.repository.UserRepository;
import com.yourmaster.api.security.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class AuthenticationServiceTest {

    @Mock
    private UserRepository userRepository;

//    @Mock
//    private JwtService jwtService;

    @Mock
    private JwtService jwtService;
    @Mock
    private UserService userService;
    @Mock
    private BlacklistingService blacklistingService;
    @Mock
    private RefreshTokenService refreshTokenService;
    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthenticationService authenticationService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testSignIn() {
        SignInDto signInDto = new SignInDto();
        signInDto.setEmail("test@example.com");
        signInDto.setPassword("password");

        User user = new User();
        user.setId(UUID.randomUUID());

        when(userService.getUserByEmail(any(String.class))).thenReturn(user);
        when(jwtService.generateToken(any(User.class))).thenReturn("token");
        when(refreshTokenService.createRefreshToken(any(String.class))).thenReturn(new RefreshToken());

        AuthResponse authResponse = authenticationService.signIn(signInDto);

        assertNotNull(authResponse, "AuthResponse не должен быть null");
        assertNotNull(authResponse.getAccessToken(), "AccessToken не должен быть null");
    }
}
