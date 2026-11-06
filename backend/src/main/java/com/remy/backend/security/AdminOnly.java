package com.remy.backend.security;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marks a controller method (or every method of a controller) as admin-only.
 * {@link AdminOnlyInterceptor} rejects the request with 401 when the caller is
 * not logged in and 403 when they are logged in without the ADMIN role.
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface AdminOnly {
}
