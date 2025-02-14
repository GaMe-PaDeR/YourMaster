package com.yourmaster.api.controller;

import com.yourmaster.api.Constants;
import com.yourmaster.api.dto.SignInDto;
import com.yourmaster.api.dto.UserDto;
import com.yourmaster.api.dto.request.RefreshTokenRequest;
import com.yourmaster.api.dto.response.AuthResponse;
import com.yourmaster.api.dto.response.LogoutResponse;
import com.yourmaster.api.security.AuthenticationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
    @Autowired
    private AuthenticationService authenticationService;

    @PostMapping("/sign-up")
    public ResponseEntity<AuthResponse> signUp(
//            Убрал лишнее потому что form-data с react передать не получалось корректно
//            @RequestBody(name = Constants.USER_DTO_SIGN_UP_ID)
            @RequestBody @Valid UserDto userDto
//            @RequestPart(
//                    required = false,
//                    name = Constants.FILE_REQUEST_PART_ID
//            ) MultipartFile file
    ) throws IOException {
        log.debug("signUp[1]: UserDto: {}", userDto);
        return ResponseEntity.ok(authenticationService.signUp(userDto, null));
    }

    @PostMapping("/sign-in")
    public ResponseEntity<AuthResponse> signIn(@RequestBody @Valid SignInDto signInDto) {
        log.debug("signIn[1]: UserDto: {}", signInDto);
        return ResponseEntity.ok(authenticationService.signIn(signInDto));
    }

    @PostMapping("/logout")
    public ResponseEntity<LogoutResponse> logout(@RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(authenticationService.logout(authHeader));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(@RequestBody RefreshTokenRequest refreshTokenRequest) {
        return ResponseEntity.ok(authenticationService.refreshToken(refreshTokenRequest));
    }
}
