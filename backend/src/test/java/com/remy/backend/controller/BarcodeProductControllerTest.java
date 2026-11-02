package com.remy.backend.controller;

import com.remy.backend.service.OpenFoodFactsService;
import com.remy.backend.service.SessionTokenService;
import com.remy.backend.dto.BarcodeProduct;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.server.ResponseStatusException;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class BarcodeProductControllerTest {
    @Test void protectsLookupAndReturnsActionableErrors() throws Exception {
        var tokens=mock(SessionTokenService.class);
        var products=mock(OpenFoodFactsService.class);
        var mvc=MockMvcBuilders.standaloneSetup(new BarcodeProductController(products,tokens)).build();
        when(tokens.resolveUserId(null)).thenReturn(Optional.empty());
        mvc.perform(get("/api/products/barcode/12345678")).andExpect(status().isUnauthorized());
        verifyNoInteractions(products);
        when(tokens.resolveUserId("Bearer valid")).thenReturn(Optional.of(1L));
        when(products.lookup("12345678")).thenReturn(new BarcodeProduct("12345678","Food","Brand","100 g","30 g","g",new BarcodeProduct.Nutrition(100.0,null,0.0,null),"https://world.openfoodfacts.org/product/12345678"));
        mvc.perform(get("/api/products/barcode/12345678").header("Authorization","Bearer valid"))
            .andExpect(status().isOk()).andExpect(jsonPath("name").value("Food"))
            .andExpect(jsonPath("nutritionPer100.calories").value(100.0));
        when(products.lookup("12345678")).thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND,"Product not found"));
        mvc.perform(get("/api/products/barcode/12345678").header("Authorization","Bearer valid"))
            .andExpect(status().isNotFound()).andExpect(jsonPath("error").value("Product not found"));
    }
}
