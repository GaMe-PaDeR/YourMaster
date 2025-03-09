package com.yourmaster.api.deserializer;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yourmaster.api.enums.Category;
import com.yourmaster.api.model.Availability;
import com.yourmaster.api.model.Service;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ServiceDeserializer extends JsonDeserializer<Service> {
    @Override
    public Service deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        ObjectMapper mapper = (ObjectMapper) p.getCodec();
        JsonNode node = mapper.readTree(p);
        
        Service service = new Service();
        service.setTitle(node.get("title").asText());
        service.setDescription(node.get("description").asText());

        service.setCategory(Category.valueOf(node.get("category").asText()));
        service.setPrice(node.get("price").asDouble());
        service.setEstimatedDuration((double) node.get("estimatedDuration").asInt());
        
        List<Availability> availabilityList = new ArrayList<>();
        JsonNode availabilityNode = node.get("availability");
        if (availabilityNode != null && availabilityNode.isArray()) {
            for (JsonNode avNode : availabilityNode) {
                Availability availability = new Availability();
                JsonNode dateNode = avNode.get("date");
                if (dateNode != null) {
                    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
                    String dateString = dateNode.asText().substring(0, 10);
                    LocalDate date = LocalDate.parse(dateString, formatter);
                    availability.setDate(date);
                }

                Map<String, Boolean> timeSlots = new HashMap<>();
                JsonNode timeSlotsNode = avNode.get("timeSlots");
                if (timeSlotsNode != null && timeSlotsNode.isArray()) {
                    timeSlotsNode.forEach(slot -> {
                        String time = slot.asText();
                        if (!time.isEmpty()) {
                            timeSlots.put(time, true);
                        }
                    });
                }
                availability.setTimeSlotsMap(timeSlots);
                availabilityList.add(availability);
            }
        }
        service.setAvailability(availabilityList);

        // Добавляем стандартные тайм-слоты
        List<String> standardTimeSlots = new ArrayList<>();
        JsonNode standardTimeSlotsNode = node.get("standardTimeSlots");
        if (standardTimeSlotsNode != null && standardTimeSlotsNode.isArray()) {
            standardTimeSlotsNode.forEach(slot -> standardTimeSlots.add(slot.asText()));
        }
        service.setStandardTimeSlots(standardTimeSlots);
        
        return service;
    }
} 