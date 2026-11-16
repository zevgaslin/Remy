package com.remy.backend.service;

import java.util.Locale;
import java.util.Map;

/**
 * Converts recipe and pantry units to a shared base within a family
 * (volume: tsp, weight: g, count: each) and bridges culinary/produce/container
 * units across weight, volume, and count so amounts in any conceivable unit
 * (e.g., 1 lb of onion vs 50 g of onion or 1 each onion) can be compared, added,
 * and subtracted accurately.
 */
public final class GroceryUnits {

    public record Unit(String family, double factor, double gramsEquivalent) {
        public Unit(String family, double factor) {
            this(family, factor, "weight".equals(family) ? factor : ("volume".equals(family) ? factor * 4.92892 : 120.0 * factor));
        }
    }

    private static final Map<String, Unit> TABLE = Map.ofEntries(
            // Weight (base: g)
            Map.entry("mg", new Unit("weight", 0.001, 0.001)),
            Map.entry("g", new Unit("weight", 1, 1)),
            Map.entry("dag", new Unit("weight", 10, 10)),
            Map.entry("hg", new Unit("weight", 100, 100)),
            Map.entry("kg", new Unit("weight", 1000, 1000)),
            Map.entry("oz", new Unit("weight", 28.3495, 28.3495)),
            Map.entry("lb", new Unit("weight", 453.592, 453.592)),
            Map.entry("st", new Unit("weight", 6350.29, 6350.29)),

            // Volume (base: tsp)
            Map.entry("drop", new Unit("volume", 1.0 / 98.578, 0.05)),
            Map.entry("smidgen", new Unit("volume", 1.0 / 32.0, 0.15)),
            Map.entry("pinch", new Unit("volume", 1.0 / 16.0, 0.31)),
            Map.entry("dash", new Unit("volume", 1.0 / 8.0, 0.62)),
            Map.entry("tad", new Unit("volume", 0.25, 1.23)),
            Map.entry("tsp", new Unit("volume", 1, 4.92892)),
            Map.entry("dessertspoon", new Unit("volume", 2, 9.85784)),
            Map.entry("tbsp", new Unit("volume", 3, 14.7868)),
            Map.entry("fl_oz", new Unit("volume", 6, 29.5735)),
            Map.entry("shot", new Unit("volume", 9, 44.3603)),
            Map.entry("jigger", new Unit("volume", 9, 44.3603)),
            Map.entry("gill", new Unit("volume", 24, 118.294)),
            Map.entry("cup", new Unit("volume", 48, 236.588)),
            Map.entry("pt", new Unit("volume", 96, 473.176)),
            Map.entry("qt", new Unit("volume", 192, 946.353)),
            Map.entry("pot", new Unit("volume", 384, 1892.71)),
            Map.entry("gal", new Unit("volume", 768, 3785.41)),
            Map.entry("ml", new Unit("volume", 0.2029, 1.0)),
            Map.entry("cl", new Unit("volume", 2.029, 10.0)),
            Map.entry("dl", new Unit("volume", 20.29, 100.0)),
            Map.entry("l", new Unit("volume", 202.9, 1000.0)),

            // Count & Produce
            Map.entry("each", new Unit("count", 1, 120.0)),
            Map.entry("pair", new Unit("count", 2, 240.0)),
            Map.entry("dozen", new Unit("count", 12, 1440.0)),

            // Culinary / Produce / Container units (mapped into weight/volume equivalents)
            Map.entry("stick", new Unit("weight", 113.4, 113.4)),
            Map.entry("clove", new Unit("count", 1, 5.0)),
            Map.entry("head", new Unit("count", 1, 300.0)),
            Map.entry("bulb", new Unit("count", 1, 50.0)),
            Map.entry("bunch", new Unit("count", 1, 150.0)),
            Map.entry("stalk", new Unit("count", 1, 40.0)),
            Map.entry("rib", new Unit("count", 1, 40.0)),
            Map.entry("sprig", new Unit("count", 1, 2.0)),
            Map.entry("leaf", new Unit("count", 1, 1.0)),
            Map.entry("slice", new Unit("count", 1, 30.0)),
            Map.entry("fillet", new Unit("weight", 170.0, 170.0)),
            Map.entry("breast", new Unit("weight", 200.0, 200.0)),
            Map.entry("thigh", new Unit("weight", 120.0, 120.0)),
            Map.entry("can", new Unit("weight", 400.0, 400.0)),
            Map.entry("jar", new Unit("weight", 450.0, 450.0)),
            Map.entry("bottle", new Unit("volume", 152.175, 750.0)),
            Map.entry("carton", new Unit("volume", 192.0, 946.353)),
            Map.entry("bag", new Unit("weight", 453.592, 453.592)),
            Map.entry("box", new Unit("weight", 453.592, 453.592)),
            Map.entry("pkg", new Unit("weight", 453.592, 453.592)),
            Map.entry("loaf", new Unit("weight", 453.592, 453.592)),
            Map.entry("bar", new Unit("weight", 100.0, 100.0)),
            Map.entry("scoop", new Unit("weight", 30.0, 30.0)),
            Map.entry("serving", new Unit("weight", 100.0, 100.0)));

    private static final Map<String, String> ALIASES = Map.ofEntries(
            // Weight
            Map.entry("milligram", "mg"),
            Map.entry("gram", "g"),
            Map.entry("gm", "g"),
            Map.entry("dekagram", "dag"),
            Map.entry("decagram", "dag"),
            Map.entry("hectogram", "hg"),
            Map.entry("kilogram", "kg"),
            Map.entry("kilo", "kg"),
            Map.entry("ounce", "oz"),
            Map.entry("pound", "lb"),
            Map.entry("stone", "st"),

            // Volume
            Map.entry("teaspoon", "tsp"),
            Map.entry("tspn", "tsp"),
            Map.entry("t", "tsp"),
            Map.entry("dsp", "dessertspoon"),
            Map.entry("dstspn", "dessertspoon"),
            Map.entry("tablespoon", "tbsp"),
            Map.entry("tbspn", "tbsp"),
            Map.entry("tbs", "tbsp"),
            Map.entry("tb", "tbsp"),
            Map.entry("fluid ounce", "fl_oz"),
            Map.entry("fl oz", "fl_oz"),
            Map.entry("floz", "fl_oz"),
            Map.entry("oz fl", "fl_oz"),
            Map.entry("c", "cup"),
            Map.entry("pint", "pt"),
            Map.entry("fl pt", "pt"),
            Map.entry("quart", "qt"),
            Map.entry("fl qt", "qt"),
            Map.entry("pottle", "pot"),
            Map.entry("gallon", "gal"),
            Map.entry("milliliter", "ml"),
            Map.entry("millilitre", "ml"),
            Map.entry("cc", "ml"),
            Map.entry("centiliter", "cl"),
            Map.entry("centilitre", "cl"),
            Map.entry("deciliter", "dl"),
            Map.entry("decilitre", "dl"),
            Map.entry("liter", "l"),
            Map.entry("litre", "l"),

            // Count
            Map.entry("", "each"),
            Map.entry("ea", "each"),
            Map.entry("item", "each"),
            Map.entry("piece", "each"),
            Map.entry("pc", "each"),
            Map.entry("unit", "each"),
            Map.entry("whole", "each"),
            Map.entry("small", "each"),
            Map.entry("medium", "each"),
            Map.entry("large", "each"),
            Map.entry("doz", "dozen"),

            // Culinary / Produce / Containers
            Map.entry("leaves", "leaf"),
            Map.entry("loaves", "loaf"),
            Map.entry("bunches", "bunch"),
            Map.entry("pinches", "pinch"),
            Map.entry("dashes", "dash"),
            Map.entry("boxes", "box"),
            Map.entry("filet", "fillet"),
            Map.entry("tin", "can"),
            Map.entry("package", "pkg"),
            Map.entry("packet", "pkg"),
            Map.entry("pack", "pkg"));

    private GroceryUnits() {
    }

    public static Unit of(String unit) {
        String normalized = unit == null ? "" : unit.trim().toLowerCase(Locale.ROOT)
                .replace(".", "")
                .replaceAll("[-_]+", " ")
                .replaceAll("\\s+", " ");
        if (ALIASES.containsKey(normalized)) {
            normalized = ALIASES.get(normalized);
        } else {
            if (normalized.length() > 2 && normalized.endsWith("es")
                    && (ALIASES.containsKey(normalized.substring(0, normalized.length() - 2))
                            || TABLE.containsKey(normalized.substring(0, normalized.length() - 2)))) {
                normalized = normalized.substring(0, normalized.length() - 2);
            } else if (normalized.length() > 1 && normalized.endsWith("s") && !normalized.endsWith("ss")
                    && (ALIASES.containsKey(normalized.substring(0, normalized.length() - 1))
                            || TABLE.containsKey(normalized.substring(0, normalized.length() - 1)))) {
                normalized = normalized.substring(0, normalized.length() - 1);
            }
            normalized = ALIASES.getOrDefault(normalized, normalized);
        }
        Unit known = TABLE.get(normalized);
        return known != null ? known : new Unit("unit:" + normalized, 1, 100.0);
    }

    /**
     * Converts {@code quantity} from {@code fromUnit} to {@code toUnit}, supporting both
     * direct same-family conversions (e.g., 1 lb = 453.592 g, 1 cup = 16 tbsp) and
     * cross-family culinary equivalents (e.g., 1 lb of onion >= 1 each onion or 50 g onion).
     */
    public static double convert(double quantity, String fromUnit, String toUnit) {
        if (!Double.isFinite(quantity) || quantity <= 0) {
            return 0.0;
        }
        Unit from = of(fromUnit);
        Unit to = of(toUnit);
        if (from.family().equals(to.family())) {
            return (quantity * from.factor()) / to.factor();
        }
        if (from.gramsEquivalent() > 0 && to.gramsEquivalent() > 0) {
            return (quantity * from.gramsEquivalent()) / to.gramsEquivalent();
        }
        return 0.0;
    }

    public static String format(double quantity, String unit) {
        double rounded = Math.round(quantity * 100) / 100.0;
        String number = rounded == Math.rint(rounded)
                ? String.valueOf((long) rounded)
                : String.valueOf(rounded);
        String trimmedUnit = unit == null ? "" : unit.trim();
        return trimmedUnit.isEmpty() ? number : number + " " + trimmedUnit;
    }
}
