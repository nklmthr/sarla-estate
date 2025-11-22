package com.sarlatea.crm.security;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.util.HashSet;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        try {
            String authHeader = request.getHeader("Authorization");
            log.debug("Processing request: {} {}", request.getMethod(), request.getRequestURI());

            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                log.debug("Authorization header found");
                String token = authHeader.substring(7);
                String username = jwtUtil.extractUsername(token);
                String role = jwtUtil.extractRole(token);
                List<String> permissions = jwtUtil.extractPermissions(token);

                if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    if (jwtUtil.validateToken(token, username)) {
                        // Create authorities from permissions
                        List<SimpleGrantedAuthority> authorities = new ArrayList<>();

                        // Add role as authority (for role-based checks)
                        authorities.add(new SimpleGrantedAuthority("ROLE_" + role));

                        // Add each permission as authority (for permission-based checks)
                        authorities.addAll(permissions.stream()
                                .map(SimpleGrantedAuthority::new)
                                .collect(Collectors.toList()));

                        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                username, null, authorities);
                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authToken);

                        log.debug("User {} authenticated with {} permissions", username, permissions.size());

                        // Check if token needs refresh (sliding window)
                        if (jwtUtil.needsRefresh(token)) {
                            String newToken = jwtUtil.generateToken(username, role, new HashSet<>(permissions));
                            response.setHeader("X-New-Token", newToken);
                            log.debug("Issued new token for user {}", username);
                        }
                    }
                }
            } else {
                log.debug("No valid Authorization header found");
            }
        } catch (ExpiredJwtException e) {
            log.warn("JWT Token has expired: {}", e.getMessage());
            sendErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, "Session expired");
            return;
        } catch (JwtException e) {
            log.error("JWT Error: {} - {}", e.getClass().getSimpleName(), e.getMessage());
            sendErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, "Invalid token");
            return;
        } catch (Exception e) {
            log.error("Cannot set user authentication: {} - {}", e.getClass().getName(), e.getMessage());
            e.printStackTrace();
        }

        filterChain.doFilter(request, response);
    }

    private void sendErrorResponse(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.getWriter()
                .write("{\"status\": " + status + ", \"error\": \"Unauthorized\", \"message\": \"" + message + "\"}");
    }
}
