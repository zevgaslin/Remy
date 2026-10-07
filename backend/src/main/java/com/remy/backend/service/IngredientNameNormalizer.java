package com.remy.backend.service;

import java.util.Locale;
import java.util.Map;
import java.util.Set;

final class IngredientNameNormalizer {

    private static final Map<String, String> ALIASES = Map.ofEntries(
            Map.entry("clove of garlic", "garlic"),
            Map.entry("cloves of garlic", "garlic"),
            Map.entry("scallion", "green onion"),
            Map.entry("spring onion", "green onion"),
            Map.entry("garbanzo bean", "chickpea"),
            Map.entry("confectioner sugar", "powdered sugar"),
            Map.entry("confectioners sugar", "powdered sugar"),
            Map.entry("icing sugar", "powdered sugar"));

    private static final Map<String, String> IRREGULAR_SINGULARS = Map.ofEntries(
            Map.entry("leaves", "leaf"),
            Map.entry("loaves", "loaf"),
            Map.entry("knives", "knife"),
            Map.entry("halves", "half"),
            Map.entry("wives", "wife"),
            Map.entry("tomatoes", "tomato"),
            Map.entry("potatoes", "potato"));

    private static final Set<String> UNCOUNTABLE_OR_ALREADY_SINGULAR = Set.of(
            "asparagus",
            "cheese",
            "couscous",
            "gas",
            "hummus",
            "molasses",
            "species");

    private IngredientNameNormalizer() {
    }

    static String canonicalize(String value) {
        String normalized = value.trim()
                .toLowerCase(Locale.ROOT)
                .replaceAll("['\u2019]", "")
                .replaceAll("\\s+", " ");

        String directAlias = ALIASES.get(normalized);
        if (directAlias != null) {
            return directAlias;
        }

        int finalSpace = normalized.lastIndexOf(' ');
        String prefix = finalSpace < 0 ? "" : normalized.substring(0, finalSpace + 1);
        String finalWord = finalSpace < 0 ? normalized : normalized.substring(finalSpace + 1);
        String singular = prefix + singularize(finalWord);
        return ALIASES.getOrDefault(singular, singular);
    }

    private static String singularize(String word) {
        if (UNCOUNTABLE_OR_ALREADY_SINGULAR.contains(word)) {
            return word;
        }

        String irregular = IRREGULAR_SINGULARS.get(word);
        if (irregular != null) {
            return irregular;
        }

        if (word.endsWith("ies") && word.length() > 3) {
            return word.substring(0, word.length() - 3) + "y";
        }
        if ((word.endsWith("ches") || word.endsWith("shes")
                || word.endsWith("xes") || word.endsWith("zes")) && word.length() > 2) {
            return word.substring(0, word.length() - 2);
        }
        if (word.endsWith("s") && !word.endsWith("ss") && !word.endsWith("us")
                && !word.endsWith("is") && !word.endsWith("ous") && word.length() > 1) {
            return word.substring(0, word.length() - 1);
        }
        return word;
    }
}
