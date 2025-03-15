package com.yourmaster.api.controller;

import com.yourmaster.api.dto.SignInDto;
import com.yourmaster.api.dto.UserDto;
import com.yourmaster.api.dto.response.AuthResponse;
import com.yourmaster.api.security.AuthenticationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class AuthControllerTest {

    @Mock
    private AuthenticationService authenticationService;

    @InjectMocks
    private AuthController authController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testSignUp() throws IOException {
        UserDto userDto = new UserDto();
        userDto.setEmail("test@example.com");
        userDto.setPassword("password");

        AuthResponse authResponse = new AuthResponse();
        authResponse.setAccessToken("token");

        when(authenticationService.signUp(any(UserDto.class), any())).thenReturn(authResponse);

        ObjectMapper objectMapper = new ObjectMapper();
        String userJson = objectMapper.writeValueAsString(userDto);

        MockMultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", "test".getBytes());

        ResponseEntity<AuthResponse> response = authController.signUp(userJson, file);

        assertEquals(200, response.getStatusCodeValue());
        assertEquals("token", response.getBody().getAccessToken());
    }

    @Test
    void testSignIn() {
        SignInDto signInDto = new SignInDto();
        signInDto.setEmail("test@example.com");
        signInDto.setPassword("password");

        AuthResponse authResponse = new AuthResponse();
        authResponse.setAccessToken("token");

        when(authenticationService.signIn(any(SignInDto.class))).thenReturn(authResponse);

        ResponseEntity<AuthResponse> response = authController.signIn(signInDto);

        assertEquals(200, response.getStatusCodeValue());
        assertEquals("token", response.getBody().getAccessToken());
    }
}
