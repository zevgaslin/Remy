package com.remy.backend.service;

import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Plain cooking water is assumed to be on hand, so it never goes on the grocery
 * list. Purchased products and alternatives (coconut water, water chestnuts,
 * "chicken broth or water") still do.
 */
final class CookingWater {

    private static final Set<String> NAMES = Set.of(
            "water", "plain water", "tap water", "filtered water", "pot of water",
            "hot water", "very hot water", "warm water", "lukewarm water", "cold water",
            "chilled water", "ice water", "ice cold water", "room temperature water",
            "boiling water", "boiled water", "freshly boiled water",
            "water chilled", "water cold", "water warm", "water hot", "water boiling");

    private static final Pattern PHRASES = Pattern.compile(
            "^water (?:as needed|for (?:cooking|boiling|rinsing|soaking|pasta)|to thin(?: .+)?)$");

    private CookingWater() {
    }

    static boolean is(String name) {
        if (name == null) {
            return false;
        }
        String normalized = name.toLowerCase(Locale.ROOT)
                .replaceAll("[-(),]", " ")
                .replaceAll("\\s+", " ")
                .trim();
        return NAMES.contains(normalized) || PHRASES.matcher(normalized).matches();
    }
}
