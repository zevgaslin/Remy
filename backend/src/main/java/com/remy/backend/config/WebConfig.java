package com.remy.backend.config;

import com.remy.backend.security.AdminOnlyInterceptor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Allows the React dev server to call this API. Origins come from
 * app.cors.allowed-origins (comma-separated) so a LAN IP can be added
 * without editing code, e.g. for testing from another device.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String[] allowedOrigins;

    private final AdminOnlyInterceptor adminOnlyInterceptor;

    public WebConfig(AdminOnlyInterceptor adminOnlyInterceptor) {
        this.adminOnlyInterceptor = adminOnlyInterceptor;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigins)
                .allowedMethods("GET", "POST", "PUT", "DELETE");
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(adminOnlyInterceptor).addPathPatterns("/api/**");
    }
}
