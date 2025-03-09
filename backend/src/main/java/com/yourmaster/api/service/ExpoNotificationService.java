package com.yourmaster.api.service;

import com.yourmaster.api.model.User;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@Service
public class ExpoNotificationService {

    private static final String EXPO_API_URL = "https://exp.host/--/api/v2/push/send";

    public void sendNotification(String pushToken, String title, String body) {
        RestTemplate restTemplate = new RestTemplate();

        Map<String, Object> request = new HashMap<>();
        request.put("to", pushToken);
        request.put("title", title);
        request.put("body", body);

        restTemplate.postForObject(EXPO_API_URL, Collections.singletonList(request), String.class);
    }
} 