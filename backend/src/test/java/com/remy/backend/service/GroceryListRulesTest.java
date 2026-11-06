package com.remy.backend.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

class GroceryListRulesTest {

    @ParameterizedTest
    @ValueSource(strings = {"water", " BOILING   WATER ", "Water, chilled", "pot of water", "Very Hot Water",
            "room-temperature water", "Water to thin peanut sauce", "water (for boiling)", "water as needed"})
    void plainPreparationWaterIsNeverBought(String name) {
        assertThat(CookingWater.is(name)).isTrue();
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"Coconut water", "Water chestnuts", "Sparkling water", "Rose water", "Bottled water",
            "Chicken broth or water", "Water or stock", "Chicken broth + 2 cups water", "Salt"})
    void otherIngredientsStayOnTheList(String name) {
        assertThat(CookingWater.is(name)).isFalse();
    }

    @Test
    void unitsConvertWithinAFamilyOnly() {
        assertThat(GroceryUnits.of("Cups")).isEqualTo(GroceryUnits.of("cup"));
        assertThat(GroceryUnits.of("tablespoons").family()).isEqualTo("volume");
        assertThat(GroceryUnits.of("cup").factor() / GroceryUnits.of("tbsp").factor()).isEqualTo(16);
        assertThat(GroceryUnits.of("lbs").family()).isEqualTo("weight");
        assertThat(GroceryUnits.of("pieces")).isEqualTo(GroceryUnits.of("piece"));
        assertThat(GroceryUnits.of("pieces").family()).isNotEqualTo(GroceryUnits.of("cup").family());
    }

    @Test
    void amountsAreRoundedWithoutTrailingZeros() {
        assertThat(GroceryUnits.format(4.0, "cup")).isEqualTo("4 cup");
        assertThat(GroceryUnits.format(1.75, " cup ")).isEqualTo("1.75 cup");
        assertThat(GroceryUnits.format(1.0 / 3, null)).isEqualTo("0.33");
    }

    @Test
    void pantryNamesMatchWholeWordsOnly() {
        assertThat(GroceryListService.namesMatch("cheddar", "cheddar cheese")).isTrue();
        assertThat(GroceryListService.namesMatch("cheddar cheese", "cheddar")).isTrue();
        assertThat(GroceryListService.namesMatch("egg", "egg")).isTrue();
        assertThat(GroceryListService.namesMatch("pea", "peanut")).isFalse();
        assertThat(GroceryListService.namesMatch("oil", "soil")).isFalse();
    }
}
