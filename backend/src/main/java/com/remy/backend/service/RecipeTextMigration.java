package com.remy.backend.service;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Copies legacy PostgreSQL large objects into ordinary text without removing the original data. */
@Component
public class RecipeTextMigration implements ApplicationRunner {
    private final JdbcTemplate jdbc;
    public RecipeTextMigration(JdbcTemplate jdbc) { this.jdbc=jdbc; }
    @Override
    @Transactional
    public void run(ApplicationArguments arguments) {
        var types=jdbc.queryForList("SELECT udt_name FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='recipe' AND column_name='instructions'",String.class);
        if (types.isEmpty()) return;
        String expression=types.get(0).equals("oid") ? "convert_from(lo_get(instructions),'UTF8')" : "instructions::text";
        jdbc.update("UPDATE recipe SET instruction_text="+expression+" WHERE instruction_text IS NULL AND instructions IS NOT NULL");
    }
}
