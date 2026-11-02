package com.remy.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.server.ResponseStatusException;
import static org.assertj.core.api.Assertions.*;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class OpenFoodFactsServiceTest {
    private MockRestServiceServer server;
    private OpenFoodFactsService service;
    private final ObjectMapper json = new ObjectMapper();
    @BeforeEach void setup() {
        var builder = RestClient.builder().baseUrl("https://example.test");
        server = MockRestServiceServer.bindTo(builder).build();
        service = new OpenFoodFactsService(builder.build());
    }
    @Test void readsNutritionAndCachesAProductWithoutDroppingLeadingZeroes() {
        server.expect(requestTo(containsString("/api/v2/product/012345678905.json"))).andExpect(method(HttpMethod.GET))
            .andRespond(withSuccess("""
              {"status":1,"product":{"product_name":"Food","product_name_en":"Food in English","brands":"Brand",
                "quantity":"500 g","serving_size":"30 g","nutriments":{"energy-kcal_100g":300,"proteins_100g":"12.5","carbohydrates_100g":0}}}
              """,MediaType.APPLICATION_JSON));
        var result=service.lookup("012345678905");
        assertThat(result.name()).isEqualTo("Food in English");
        assertThat(result.basisUnit()).isEqualTo("g");
        assertThat(result.nutritionPer100().calories()).isEqualTo(300);
        assertThat(result.nutritionPer100().protein()).isEqualTo(12.5);
        assertThat(result.nutritionPer100().carbs()).isZero();
        assertThat(result.nutritionPer100().fat()).isNull();
        assertThat(service.lookup("012345678905")).isEqualTo(result);
        server.verify();
    }
    @Test void convertsKilojoulesAndLeavesUnusableNutrientsUnknown() throws Exception {
        var result=OpenFoodFactsService.parse("3017620422003",json.readTree("""
          {"product_name":"Drink","product_quantity_unit":"l","nutriments":{"energy-kj_100g":418.4,"proteins_100g":-2,"carbohydrates_100g":"NaN","fat_100g":"bad"}}
          """));
        assertThat(result.basisUnit()).isEqualTo("ml");
        assertThat(result.nutritionPer100().calories()).isCloseTo(100.0,within(0.00001));
        assertThat(result.nutritionPer100().protein()).isNull();
        assertThat(result.nutritionPer100().carbs()).isNull();
        assertThat(result.nutritionPer100().fat()).isNull();
        var unknown=OpenFoodFactsService.parse("3017620422003",json.readTree("""
          {"product_name":"Food","quantity":"1 bottle","nutriments":{"energy-kcal_100g":20}}
          """));
        assertThat(unknown.basisUnit()).isNull();
        var noData=OpenFoodFactsService.parse("3017620422003",json.readTree("""
          {"product_name":"Food","no_nutrition_data":"on","nutriments":{"energy-kcal_100g":20}}
          """));
        assertThat(noData.nutritionPer100().calories()).isNull();
    }
    @Test void rejectsBadCodesAndHandlesNotFoundAndUpstreamFailures() {
        assertThatThrownBy(() -> service.lookup("abc")).isInstanceOf(ResponseStatusException.class)
            .extracting(ex -> ((ResponseStatusException)ex).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        server.expect(requestTo(containsString("12345678"))).andRespond(withSuccess("{\"status\":0}",MediaType.APPLICATION_JSON));
        assertThatThrownBy(() -> service.lookup("12345678")).isInstanceOf(ResponseStatusException.class)
            .extracting(ex -> ((ResponseStatusException)ex).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        server.verify(); server.reset();
        server.expect(requestTo(containsString("12345678"))).andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS));
        assertThatThrownBy(() -> service.lookup("12345678")).isInstanceOf(ResponseStatusException.class)
            .extracting(ex -> ((ResponseStatusException)ex).getStatusCode()).isEqualTo(HttpStatus.BAD_GATEWAY);
        server.verify(); server.reset();
        server.expect(requestTo(containsString("12345678"))).andRespond(request -> { throw new ResourceAccessException("Timed out"); });
        assertThatThrownBy(() -> service.lookup("12345678")).isInstanceOf(ResponseStatusException.class)
            .extracting(ex -> ((ResponseStatusException)ex).getStatusCode()).isEqualTo(HttpStatus.BAD_GATEWAY);
    }
}
