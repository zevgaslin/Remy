package com.remy.backend;

import com.remy.backend.service.RecipeCatalogService;
import java.nio.file.Path;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;

/** One-shot import with no HTTP server; nonzero exit on failure. */
public class RecipeCatalogImport {
    public static void main(String[] args) {
        var application = new SpringApplication(RemyApplication.class);
        application.setWebApplicationType(WebApplicationType.NONE);
        try (var context = application.run()) {
            var service = context.getBean(RecipeCatalogService.class);
            var folder = Path.of(args.length == 0 ? "recipes" : args[0]);
            var result = service.importFolder(folder);
            System.out.printf("RECIPE IMPORT COMMITTED: created=%d updated=%d unchanged=%d total=%d%n",
                    result.created(),result.updated(),result.unchanged(),result.total());
            System.out.println("RECIPE READ-BACK VERIFIED: " + service.verifyFolder(folder));
        } catch (Exception error) {
            System.err.println("Recipe import or read-back failed. Import transactions roll back on failure; check for a COMMITTED message before retrying. " + error.getMessage());
            System.exit(1);
        }
    }
}
