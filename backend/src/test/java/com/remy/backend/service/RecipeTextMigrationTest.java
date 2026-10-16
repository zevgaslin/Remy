package com.remy.backend.service;

import com.remy.backend.support.PostgresTestDatabase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.*;
import org.springframework.transaction.annotation.Transactional;
import static org.assertj.core.api.Assertions.*;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.NONE)
@Transactional
class RecipeTextMigrationTest {
    @DynamicPropertySource static void database(DynamicPropertyRegistry registry) {
        PostgresTestDatabase.configure(registry,"text_migration_test");
    }
    @Autowired JdbcTemplate jdbc;
    @Autowired RecipeTextMigration migration;

    @Test void copiesOidInstructionsOnceWithoutOverwritingTextOrDeletingOriginals() {
        jdbc.execute("ALTER TABLE recipe ADD COLUMN instructions oid");
        jdbc.update("INSERT INTO recipe(name,instructions,likes,dislikes) VALUES ('Legacy',lo_from_bytea(0,convert_to('Boil water.\nCook pasta.','UTF8')),0,0)");
        jdbc.update("INSERT INTO recipe(name,instructions,instruction_text,likes,dislikes) VALUES ('Edited',lo_from_bytea(0,convert_to('Old text','UTF8')),'New text',0,0)");
        migration.run(null); migration.run(null);
        assertThat(jdbc.queryForObject("SELECT instruction_text FROM recipe WHERE name='Legacy'",String.class)).isEqualTo("Boil water.\nCook pasta.");
        assertThat(jdbc.queryForObject("SELECT instruction_text FROM recipe WHERE name='Edited'",String.class)).isEqualTo("New text");
        assertThat(jdbc.queryForObject("SELECT convert_from(lo_get(instructions),'UTF8') FROM recipe WHERE name='Legacy'",String.class)).isEqualTo("Boil water.\nCook pasta.");
    }
    @Test void copiesLegacyPlainTextAsWell() {
        jdbc.execute("ALTER TABLE recipe ADD COLUMN instructions text");
        jdbc.update("INSERT INTO recipe(name,instructions,likes,dislikes) VALUES ('Legacy','Chop garlic.',0,0)");
        migration.run(null);
        assertThat(jdbc.queryForObject("SELECT instruction_text FROM recipe WHERE name='Legacy'",String.class)).isEqualTo("Chop garlic.");
    }
}
