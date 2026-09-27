package com.remy.backend.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class IngredientNameNormalizerTest {

    @ParameterizedTest
    @CsvSource({
        "egg, egg",
        "Eggs, egg",
        "tomatoes, tomato",
        "berries, berry",
        "bell peppers, bell pepper",
        "sandwiches, sandwich",
        "cloves of garlic, garlic",
        "scallions, green onion",
        "spring onions, green onion",
        "garbanzo beans, chickpea",
        "chickpeas, chickpea",
        "confectioner's sugar, powdered sugar",
        "icing sugar, powdered sugar"
    })
    void canonicalizesPluralAndAliasForms(String value, String expected) {
        assertThat(IngredientNameNormalizer.canonicalize(value)).isEqualTo(expected);
    }

    @ParameterizedTest
    @CsvSource({
        "eggplant, eggplant",
        "cheese, cheese",
        "hummus, hummus",
        "asparagus, asparagus",
        "molasses, molasses"
    })
    void preservesDistinctOrUncountableIngredients(String value, String expected) {
        assertThat(IngredientNameNormalizer.canonicalize(value)).isEqualTo(expected);
    }
}
