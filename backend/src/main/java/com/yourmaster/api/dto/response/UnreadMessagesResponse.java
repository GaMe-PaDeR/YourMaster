package com.yourmaster.api.dto.response;

import com.yourmaster.api.model.Message;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UnreadMessagesResponse {
    private List<Message> messages;
    private int count;
}
