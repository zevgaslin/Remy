package com.remy.backend.controller;

import com.remy.backend.dto.BarcodeProduct;
import com.remy.backend.service.OpenFoodFactsService;
import com.remy.backend.service.SessionTokenService;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/products/barcode")
public class BarcodeProductController {
    private final OpenFoodFactsService products;
    private final SessionTokenService tokens;
    public BarcodeProductController(OpenFoodFactsService products, SessionTokenService tokens) {
        this.products = products; this.tokens = tokens;
    }
    @GetMapping("/{barcode}")
    public BarcodeProduct get(@PathVariable String barcode,
            @RequestHeader(value="Authorization", required=false) String auth) {
        if (tokens.resolveUserId(auth).isEmpty()) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Log in to look up food barcodes.");
        return products.lookup(barcode);
    }
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<?> error(ResponseStatusException ex) {
        return ResponseEntity.status(ex.getStatusCode()).body(Map.of("error", ex.getReason()));
    }
}
