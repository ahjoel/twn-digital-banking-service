package com.digitalbanking.portal.service;

import com.digitalbanking.portal.dto.AuthResponse;
import com.digitalbanking.portal.dto.LoginRequest;
import com.digitalbanking.portal.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(AuthenticationManager authenticationManager, JwtService jwtService) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    /** Checks credentials against the users table; throws an AuthenticationException if invalid. */
    public AuthResponse login(LoginRequest request) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password()));

        String role = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .map(a -> a.replaceFirst("^ROLE_", ""))
                .findFirst()
                .orElse("CUSTOMER");

        String token = jwtService.generateToken(auth.getName(), role);
        return new AuthResponse(token, "Bearer", jwtService.getExpirationMs() / 1000, auth.getName(), role);
    }
}
