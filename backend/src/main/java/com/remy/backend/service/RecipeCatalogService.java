package com.remy.backend.service;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.*;
import com.networknt.schema.*;
import com.remy.backend.model.*;
import com.remy.backend.repository.RecipeRepository;
import java.io.IOException;
import java.nio.file.*;
import java.util.*;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RecipeCatalogService {
    private final RecipeRepository repository;
    private final ObjectMapper mapper;
    private final JsonSchema schema;

    public RecipeCatalogService(RecipeRepository repository, ObjectMapper mapper) throws IOException {
        this.repository = repository;
        this.mapper = mapper.copy().enable(JsonParser.Feature.STRICT_DUPLICATE_DETECTION);
        SchemaValidatorsConfig config = new SchemaValidatorsConfig();
        config.setFormatAssertionsEnabled(true);
        try (var input = new ClassPathResource("recipe.schema.json").getInputStream()) {
            schema = JsonSchemaFactory.getInstance(SpecVersion.VersionFlag.V202012)
                    .getSchema(this.mapper.readTree(input), config);
        }
    }

    public List<JsonNode> validateFolder(Path folder) throws IOException {
        if (!Files.isDirectory(folder)) throw new IllegalArgumentException("Recipe folder not found: " + folder);
        List<Path> files;
        try (var stream = Files.walk(folder)) {
            files = stream.filter(Files::isRegularFile)
                    .filter(p -> p.getFileName().toString().endsWith(".json")).sorted().toList();
        }
        if (files.isEmpty()) throw new IllegalArgumentException("No recipe JSON files in " + folder);
        List<JsonNode> documents = new ArrayList<>();
        Set<String> ids = new HashSet<>();
        for (Path file : files) {
            JsonNode document;
            try { document = mapper.readTree(file.toFile()); }
            catch (IOException e) { throw new IOException("Cannot parse " + file.getFileName(), e); }
            var errors = schema.validate(document);
            if (!errors.isEmpty()) throw new IllegalArgumentException(file.getFileName() + ": " + errors);
            String id = UUID.fromString(document.get("id").asText()).toString();
            if (!file.getFileName().toString().equals(id + ".json"))
                throw new IllegalArgumentException("Filename must be " + id + ".json: " + file.getFileName());
            if (!ids.add(id)) throw new IllegalArgumentException("Duplicate ID: " + id);
            documents.add(document);
        }
        return documents;
    }

    @Transactional(rollbackFor = Exception.class)
    public ImportResult importFolder(Path folder) throws IOException {
        var documents = validateFolder(folder);
        int created = 0, updated = 0, unchanged = 0;
        for (JsonNode d : documents) {
            String id = d.get("id").asText();
            Recipe r = repository.findByCatalogId(id).orElse(null);
            if (r == null) {
                var legacy = repository.findByNameAndCatalogIdIsNull(d.get("name").asText());
                if (legacy.size() > 1) throw new IllegalArgumentException("Ambiguous legacy name: " + d.get("name"));
                if (legacy.size() == 1) r = legacy.get(0);
            }
            if (r != null && d.equals(r.getDocument())) { unchanged++; continue; }
            if (r == null) { r = new Recipe(); created++; } else { updated++; }
            r.setCatalogId(id); r.setDocument(d.deepCopy()); r.setName(d.get("name").asText());
            r.setDescription(string(d,"description")); r.setCuisine(string(d,"cuisine"));
            r.setMealType(string(d,"mealType")); r.setDifficulty(string(d,"difficulty"));
            r.setPrepMinutes(integer(d,"prepMinutes")); r.setCookMinutes(integer(d,"cookMinutes"));
            r.setServings(integer(d,"servings"));
            List<String> steps = new ArrayList<>();
            for (var step : d.get("instructions")) steps.add((steps.size()+1)+". "+step.get("text").asText());
            r.setInstructions(String.join("\n\n",steps));
            var n = d.get("nutrition");
            r.setNutrition(n.isNull() ? null : new RecipeNutrition(integer(n,"calories"),integer(n,"protein"),integer(n,"carbs"),integer(n,"fat")));
            r.getIngredients().clear(); r.getPreferenceTags().clear();
            if (r.getId() != null) repository.flush(); // Delete old unique child keys before inserting replacements.
            Map<String,RecipeIngredient> projected = new LinkedHashMap<>();
            for (var item : d.get("ingredients")) {
                String name = item.get("name").asText(), key = name.toLowerCase(Locale.ROOT);
                var ingredient = projected.get(key);
                if (ingredient != null) {
                    // Repeated entries stay ordered and lossless in JSONB; compatibility matching needs one name.
                    ingredient.setQuantity(null); ingredient.setUnit(null);
                    ingredient.setOptional(ingredient.isOptional() && item.get("optional").asBoolean()); continue;
                }
                ingredient = new RecipeIngredient(); ingredient.setRecipe(r); ingredient.setIngredientName(name);
                ingredient.setQuantity(item.get("quantity").isNull()?null:item.get("quantity").doubleValue());
                ingredient.setUnit(string(item,"unit")); ingredient.setOptional(item.get("optional").asBoolean());
                projected.put(key,ingredient); r.getIngredients().add(ingredient);
            }
            Set<String> tags = new HashSet<>();
            for (var item : d.get("preferenceTags")) {
                String name=item.get("name").asText().trim().toLowerCase(Locale.ROOT);
                String value=item.get("value").asText().trim().toLowerCase(Locale.ROOT);
                if (!tags.add(name+"\u0000"+value)) continue;
                var tag = new RecipePreferenceTag(); tag.setRecipe(r); tag.setPreferenceName(name); tag.setPreferenceValue(value);
                r.getPreferenceTags().add(tag);
            }
            repository.save(r);
        }
        repository.flush();
        return new ImportResult(created,updated,unchanged,documents.size());
    }
    private static String string(JsonNode n,String key) { return n.get(key).isNull()?null:n.get(key).asText(); }
    @Transactional(readOnly = true)
    public int verifyFolder(Path folder) throws IOException {
        var documents = validateFolder(folder);
        for (var d : documents) {
            var r = repository.findByCatalogId(d.get("id").asText()).orElseThrow();
            if (!d.equals(r.getDocument()) || r.getIngredients().isEmpty() || r.getInstructions().isBlank())
                throw new IllegalStateException("Stored recipe verification failed: " + d.get("name").asText());
        }
        return documents.size();
    }
    // Fractional values remain exact in JSONB; never truncate them into old integer API fields.
    private static Integer integer(JsonNode n,String key) {
        var v=n.get(key); return v.isNull() || !v.canConvertToExactIntegral() || !v.canConvertToInt()?null:v.intValue();
    }
    public record ImportResult(int created,int updated,int unchanged,int total) {}
}
