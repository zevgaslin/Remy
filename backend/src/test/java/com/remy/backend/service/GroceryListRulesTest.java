package com.remy.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

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
    void convertsAcrossAllMeasurementCategoriesAndBridgesCulinaryUnits() {
        // 1 lb of onion = 453.592 g, which is > 50 g of onion
        assertThat(GroceryUnits.convert(1.0, "lb", "g")).isCloseTo(453.592, within(0.01));
        assertThat(GroceryUnits.convert(1.0, "lb", "g")).isGreaterThan(50.0);
        assertThat(GroceryUnits.convert(1.0, "kg", "g")).isEqualTo(1000.0);
        assertThat(GroceryUnits.convert(1000.0, "mg", "g")).isEqualTo(1.0);
        assertThat(GroceryUnits.convert(1.0, "lb", "oz")).isCloseTo(16.0, within(0.01));

        // Volume conversions: cup, tbsp, tsp, fl oz, pt, qt, gal, ml, l
        assertThat(GroceryUnits.convert(1.0, "cup", "tbsp")).isCloseTo(16.0, within(0.01));
        assertThat(GroceryUnits.convert(1.0, "cup", "fl oz")).isCloseTo(8.0, within(0.01));
        assertThat(GroceryUnits.convert(1.0, "gal", "qt")).isCloseTo(4.0, within(0.01));
        assertThat(GroceryUnits.convert(1.0, "l", "ml")).isCloseTo(1000.0, within(0.1));

        // Count & culinary units: dozen, pair, stick, can, clove
        assertThat(GroceryUnits.convert(1.0, "dozen", "each")).isEqualTo(12.0);
        assertThat(GroceryUnits.convert(1.0, "stick", "g")).isCloseTo(113.4, within(0.1));
        assertThat(GroceryUnits.convert(1.0, "can", "g")).isCloseTo(400.0, within(0.1));
        assertThat(GroceryUnits.convert(1.0, "lb", "each")).isGreaterThan(3.0);
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
