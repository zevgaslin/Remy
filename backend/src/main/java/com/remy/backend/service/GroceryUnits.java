package com.remy.backend.service;

import java.util.Locale;
import java.util.Map;

/**
 * Converts recipe and pantry units to a shared base within a family
 * (volume: tsp, weight: g) so amounts in different units can be added
 * and subtracted. Units outside the table only combine with themselves.
 */
final class GroceryUnits {

    record Unit(String family, double factor) {
    }

    private static final Map<String, Unit> TABLE = Map.ofEntries(
            Map.entry("tsp", new Unit("volume", 1)),
            Map.entry("tbsp", new Unit("volume", 3)),
            Map.entry("fl_oz", new Unit("volume", 6)),
            Map.entry("cup", new Unit("volume", 48)),
            Map.entry("ml", new Unit("volume", 0.2029)),
            Map.entry("l", new Unit("volume", 202.9)),
            Map.entry("g", new Unit("weight", 1)),
            Map.entry("oz", new Unit("weight", 28.3495)),
            Map.entry("lb", new Unit("weight", 453.592)),
            Map.entry("kg", new Unit("weight", 1000)));

    private static final Map<String, String> ALIASES = Map.ofEntries(
            Map.entry("tablespoon", "tbsp"),
            Map.entry("teaspoon", "tsp"),
            Map.entry("ounce", "oz"),
            Map.entry("pound", "lb"),
            Map.entry("gram", "g"),
            Map.entry("kilogram", "kg"),
            Map.entry("liter", "l"),
            Map.entry("litre", "l"),
            Map.entry("milliliter", "ml"),
            Map.entry("millilitre", "ml"),
            Map.entry("fl oz", "fl_oz"),
            Map.entry("floz", "fl_oz"));

    private GroceryUnits() {
    }

    static Unit of(String unit) {
        String normalized = unit == null ? "" : unit.trim().toLowerCase(Locale.ROOT).replace(".", "");
        if (normalized.length() > 2 && normalized.endsWith("s") && !normalized.endsWith("ss")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        normalized = ALIASES.getOrDefault(normalized, normalized);
        Unit known = TABLE.get(normalized);
        return known != null ? known : new Unit("unit:" + normalized, 1);
    }

    static String format(double quantity, String unit) {
        double rounded = Math.round(quantity * 100) / 100.0;
        String number = rounded == Math.rint(rounded)
                ? String.valueOf((long) rounded)
                : String.valueOf(rounded);
        String trimmedUnit = unit == null ? "" : unit.trim();
        return trimmedUnit.isEmpty() ? number : number + " " + trimmedUnit;
    }
}
