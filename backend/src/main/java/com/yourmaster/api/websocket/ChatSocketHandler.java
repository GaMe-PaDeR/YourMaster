package com.yourmaster.api.websocket;

import com.yourmaster.api.dto.request.SendMessageRequest;
import com.yourmaster.api.model.Message;
import com.yourmaster.api.service.MessageService;
import com.yourmaster.api.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import javax.websocket.OnClose;
import javax.websocket.OnError;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.ServerEndpoint;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import java.util.Map;
import java.util.HashMap;

import java.util.UUID;
import com.yourmaster.api.security.JwtService;
import com.yourmaster.api.model.User;

@ServerEndpoint("/chat")
@Component
public class ChatSocketHandler {

    @Autowired
    private MessageService messageService;

    @Autowired
    private UserService userService;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

    @OnOpen
    public void onOpen(Session session) {
        try {
            String token = session.getRequestParameterMap().get("token").get(0);
            String username = jwtService.extractUsername(token);
            User user = userService.getUserByEmail(username);
            
            session.getUserProperties().put("userId", user.getId());
            userService.updateUserOnlineStatus(user.getId(), true);
        } catch (Exception e) {
            System.err.println("Ошибка аутентификации: " + e.getMessage());
        }
    }

    @OnMessage
    public void onMessage(String message, Session session) {
        try {
            // Десериализуем в SendMessageRequest
            SendMessageRequest request = objectMapper.readValue(message, SendMessageRequest.class);
            
            // Вызываем существующий метод сервиса
            Message savedMessage = messageService.sendMessage(request);
            
            // Формируем ответ с данными из сохраненного сообщения
            Map<String, Object> response = new HashMap<>();
            response.put("id", savedMessage.getId());
            response.put("content", savedMessage.getContent());
            response.put("createdAt", savedMessage.getCreatedAt());
            response.put("senderId", savedMessage.getSender().getId());
            response.put("chatId", savedMessage.getChat().getId());
            
            session.getAsyncRemote().sendText(objectMapper.writeValueAsString(response));
            
        } catch (Exception e) {
            sendError(session, "Ошибка обработки: " + e.getMessage());
        }
    }

    private void sendError(Session session, String error) {
        try {
            session.getAsyncRemote().sendText(
                objectMapper.writeValueAsString(Map.of("error", error))
            );
        } catch (JsonProcessingException ex) {
            session.getAsyncRemote().sendText("{\"error\":\"Error serialization failed\"}");
        }
    }

    @OnClose
    public void onClose(Session session) {
        UUID userId = (UUID) session.getUserProperties().get("userId");
        if (userId != null) {
            userService.updateUserOnlineStatus(userId, false);
        }
    }

    @OnError
    public void onError(Session session, Throwable throwable) {
        System.err.println("Error in connection: " + session.getId());
        throwable.printStackTrace();
    }
} 