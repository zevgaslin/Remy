package com.remy.backend.support;

import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import java.io.IOException;
import org.springframework.test.context.DynamicPropertyRegistry;

/** Isolated real PostgreSQL for tests; never uses the configured Supabase credentials. */
public final class PostgresTestDatabase {
    private static final EmbeddedPostgres POSTGRES = start();
    private static EmbeddedPostgres start() {
        try { return EmbeddedPostgres.builder().setPort(0).start(); }
        catch (IOException error) { throw new IllegalStateException(error); }
    }
    public static void configure(DynamicPropertyRegistry registry, String schema) {
        if (!schema.matches("[a-z_]+")) throw new IllegalArgumentException("Invalid test schema");
        try (var connection=POSTGRES.getPostgresDatabase().getConnection(); var statement=connection.createStatement()) {
            statement.execute("CREATE SCHEMA IF NOT EXISTS " + schema);
        } catch (Exception error) { throw new IllegalStateException(error); }
        registry.add("spring.datasource.url",()->POSTGRES.getJdbcUrl("postgres","postgres")+"&currentSchema="+schema);
        registry.add("spring.datasource.username",()->"postgres");
        registry.add("spring.datasource.password",()->"postgres");
        registry.add("spring.jpa.hibernate.ddl-auto",()->"update");
        registry.add("spring.sql.init.mode",()->"never");
    }
}
