package com.yourmaster.api.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yourmaster.api.Constants;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;

@Embeddable
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class Availability {
    @Column(name = "date")
    @JsonFormat(pattern = Constants.LOCAL_DATETIME_FORMAT)
    @JsonSerialize(using = LocalDateTimeSerializer.class)
    private LocalDateTime date;

    @Getter
    @Column(name = "is_available")
    private Boolean isAvailable;

    // Храним тайм-слоты как JSON в формате Map<String, Boolean>
    @Column(name = "time_slots", columnDefinition = "TEXT")
    private String timeSlots;

    @Column(name = "is_booked")
    private Boolean isBooked = false;

    // Геттер и сеттер для работы с мапой тайм-слотов
    public Map<String, Boolean> getTimeSlotsMap() {
        if (timeSlots == null || timeSlots.isEmpty()) {
            return new HashMap<>();
        }
        try {
            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(timeSlots, new TypeReference<Map<String, Boolean>>() {});
        } catch (JsonProcessingException e) {
            return new HashMap<>();
        }
    }

    public void setTimeSlotsMap(Map<String, Boolean> slots) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            this.timeSlots = mapper.writeValueAsString(slots);
        } catch (JsonProcessingException e) {
            this.timeSlots = "{}";
        }
    }
}
