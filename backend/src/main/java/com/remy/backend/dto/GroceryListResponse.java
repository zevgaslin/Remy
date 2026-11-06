package com.remy.backend.dto;

import java.util.List;

/**
 * What to buy for the meals planned between from and to (inclusive).
 * amount is what is still needed after the pantry, e.g. "2 cup + 1 lb";
 * it is empty when the recipes do not list an amount.
 */
public record GroceryListResponse(String from, String to, int plannedMeals, List<Item> items) {

    public record Item(String key, String name, String amount, String have, List<String> recipes, boolean checked) {
    }
}
