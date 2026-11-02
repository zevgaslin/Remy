package com.remy.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.remy.backend.dto.BarcodeProduct;
import java.time.Instant;
import java.util.Locale;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OpenFoodFactsService {
    private final RestClient client;
    private record Cached(BarcodeProduct product, Instant expires) {}
    private final ConcurrentHashMap<String, Cached> cache = new ConcurrentHashMap<>();

    public OpenFoodFactsService(@Qualifier("openFoodFactsClient") RestClient client) { this.client = client; }

    public BarcodeProduct lookup(String barcode) {
        if (barcode == null || !barcode.matches("(?:[0-9]{8}|[0-9]{12,14})")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter an 8, 12, 13, or 14 digit food barcode.");
        }
        Cached cached = cache.get(barcode);
        if (cached != null && cached.expires().isAfter(Instant.now())) return cached.product();
        JsonNode data;
        try {
            data = client.get().uri("/api/v2/product/{barcode}.json?fields=product_name,product_name_en,brands,quantity,serving_size,serving_quantity_unit,product_quantity_unit,nutriments,no_nutrition_data", barcode)
                    .retrieve().body(JsonNode.class);
        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode().value() == 404) throw notFound();
            throw unavailable();
        } catch (RestClientException ex) {
            throw unavailable();
        }
        if (data == null || !data.path("product").isObject() || data.path("status").asInt(1) == 0) throw notFound();
        BarcodeProduct product = parse(barcode, data.path("product"));
        if (cache.size() >= 256) cache.clear();
        cache.put(barcode, new Cached(product, Instant.now().plusSeconds(86400)));
        return product;
    }

    static BarcodeProduct parse(String barcode, JsonNode p) {
        JsonNode n = p.path("no_nutrition_data").asText().equals("on") ? com.fasterxml.jackson.databind.node.MissingNode.getInstance() : p.path("nutriments");
        Double calories = number(n, "energy-kcal_100g");
        if (calories == null) {
            Double kj = number(n, "energy-kj_100g");
            if (kj != null) calories = kj / 4.184;
        }
        String name = text(p, "product_name_en");
        if (name.isBlank()) name = text(p, "product_name");
        String unit = basis(text(p, "serving_quantity_unit"));
        if (unit == null) unit = basis(text(p, "product_quantity_unit"));
        // Only infer a basis from explicit mass/volume units, never from food names.
        if (unit == null) unit = quantityBasis(text(p, "quantity"));
        return new BarcodeProduct(barcode, name, text(p, "brands"), text(p, "quantity"),
                text(p, "serving_size"), unit,
                new BarcodeProduct.Nutrition(calories, number(n,"proteins_100g"),
                    number(n,"carbohydrates_100g"), number(n,"fat_100g")),
                "https://world.openfoodfacts.org/product/" + barcode);
    }
    private static String text(JsonNode n, String key) { return n.path(key).isTextual() ? n.path(key).asText().trim() : ""; }
    private static Double number(JsonNode n, String key) {
        JsonNode value = n.path(key);
        try {
            double result = Double.parseDouble(value.asText());
            return Double.isFinite(result) && result >= 0 ? result : null;
        } catch (NumberFormatException ex) { return null; }
    }
    private static String basis(String unit) {
        return switch (unit.toLowerCase(Locale.ROOT)) {
            case "g", "kg", "mg" -> "g";
            case "ml", "cl", "dl", "l" -> "ml";
            default -> null;
        };
    }
    private static String quantityBasis(String quantity) {
        var match = java.util.regex.Pattern.compile("(?i)^\\s*[0-9]+(?:[.,][0-9]+)?\\s*(kg|mg|g|ml|cl|dl|l)\\s*$").matcher(quantity);
        return match.matches() ? basis(match.group(1)) : null;
    }
    private ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "This barcode was not found in Open Food Facts. You can enter the food manually.");
    }
    private ResponseStatusException unavailable() {
        return new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Open Food Facts could not be reached. Try again or enter the food manually.");
    }
}
