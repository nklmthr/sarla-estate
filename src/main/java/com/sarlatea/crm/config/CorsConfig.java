package com.sarlatea.crm.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * CORS configuration for the application
 * 
 * Note: In production (Railway), both frontend and backend are served from the same origin,
 * so CORS is not needed. This configuration is primarily for local development where the
 * React dev server runs on port 3000 and Spring Boot runs on port 8080.
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Value("${cors.allowed.origins:http://localhost:3000,http://localhost:3001}")
    private String allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")  // Allow all endpoints
                .allowedOrigins(allowedOrigins.split(","))
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}

