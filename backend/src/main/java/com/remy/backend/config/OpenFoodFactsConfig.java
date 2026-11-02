package com.remy.backend.config;

import java.net.http.HttpClient;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
public class OpenFoodFactsConfig {
    @Bean
    RestClient openFoodFactsClient(RestClient.Builder builder,
            @Value("${app.open-food-facts.base-url:https://world.openfoodfacts.org}") String baseUrl) {
        var factory = new JdkClientHttpRequestFactory(HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5)).build());
        factory.setReadTimeout(Duration.ofSeconds(10));
        return builder.baseUrl(baseUrl).requestFactory(factory)
                .defaultHeader("User-Agent", "Remy/0.1 (https://github.com/zevgaslin/Remy)")
                .build();
    }
}
