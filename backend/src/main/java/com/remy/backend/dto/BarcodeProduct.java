package com.remy.backend.dto;

/** Values are per 100 g or 100 ml as sold; null nutrients mean unknown. */
public record BarcodeProduct(String barcode, String name, String brand, String packageSize,
        String servingSize, String basisUnit, Nutrition nutritionPer100, String sourceUrl) {
    public record Nutrition(Double calories, Double protein, Double carbs, Double fat) {}
}
