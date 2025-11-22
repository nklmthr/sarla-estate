package com.sarlatea.crm.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class JwtUtil {

    @Value("${jwt.secret:sarlateaestatessecretkeyforsigningjwttokenswhichneedstobeverylongandsecure}")
    private String secret;

    @Value("${jwt.expiration:1800000}") // 30 minutes in milliseconds
    private Long expiration;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    public String generateToken(String username, String role, Set<String> permissions) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);
        claims.put("permissions", new ArrayList<>(permissions)); // Store as list for JSON compatibility
        return createToken(claims, username);
    }

    private String createToken(Map<String, Object> claims, String subject) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);

        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String extractRole(String token) {
        return extractClaim(token, claims -> claims.get("role", String.class));
    }

    @SuppressWarnings("unchecked")
    public List<String> extractPermissions(String token) {
        return extractClaim(token, claims -> {
            Object permissions = claims.get("permissions");
            if (permissions instanceof List<?>) {
                return ((List<?>) permissions).stream()
                        .map(Object::toString)
                        .collect(Collectors.toList());
            }
            return new ArrayList<>();
        });
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public Boolean validateToken(String token, String username) {
        final String extractedUsername = extractUsername(token);
        return (extractedUsername.equals(username) && !isTokenExpired(token));
    }

    public Boolean needsRefresh(String token) {
        final Date expiration = extractExpiration(token);
        // If the token expires in less than 25 minutes (assuming 30 min total), refresh
        // it.
        // This creates a sliding window where active users get a new token every 5
        // minutes.
        long remainingTime = expiration.getTime() - System.currentTimeMillis();
        long refreshThreshold = this.expiration - (5 * 60 * 1000); // Total duration - 5 minutes

        return remainingTime < refreshThreshold;
    }
}
