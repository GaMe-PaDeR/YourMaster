package com.yourmaster.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.lang.Nullable;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SendMessageRequest {
    @NotNull
    private UUID chatId;
    
    @NotNull
    private UUID userId;
    
    @NotBlank
    private String content;
    
    @Nullable
    private UUID replyToMessageId;
}
