package com.yourmaster.api.controller;

import com.yourmaster.api.Constants;
import com.yourmaster.api.dto.request.GroupChatRequest;
import com.yourmaster.api.dto.request.SingleChatRequest;
import com.yourmaster.api.dto.response.ApiStateResponse;
import com.yourmaster.api.dto.ChatDto;
import com.yourmaster.api.model.Chat;
import com.yourmaster.api.model.User;
import com.yourmaster.api.service.ChatService;
import com.yourmaster.api.service.UserService;
import com.yourmaster.api.service.MessageService;
import com.yourmaster.api.util.mappers.ChatMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.HashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/chats")
public class ChatController {

    @Autowired
    private ChatService chatService;

    @Autowired
    private UserService userService;

    @Autowired
    private MessageService messageService;

    @PostMapping("/single")
    public ResponseEntity<Chat> createChat(@RequestBody SingleChatRequest singleChatRequest) {
        User currentUser = userService.getCurrentUser();
        Chat chat = chatService.createChat(currentUser, singleChatRequest.getRecipientId());
        return new ResponseEntity<>(chat, HttpStatus.OK);
    }

    @PostMapping("/group")
    public ResponseEntity<Chat> createGroupChat(@RequestBody GroupChatRequest groupChatRequest) {
        User currentUser = userService.getCurrentUser();
        Chat groupChat = chatService.createGroup(groupChatRequest, currentUser);
        return new ResponseEntity<>(groupChat, HttpStatus.OK);
    }

    @GetMapping("{chatId}")
    public ResponseEntity<Chat> findChatById(@PathVariable UUID chatId) {
        Chat chat = chatService.getChatById(chatId);
        return new ResponseEntity<>(chat, HttpStatus.OK);
    }

    @GetMapping("/current-user")
    public ResponseEntity<List<ChatDto>> findChatsByCurrentUser() {
        UUID userId = userService.getCurrentUser().getId();
        List<Chat> chats = chatService.findAllChatsByUserId(userId);
        
        List<ChatDto> dtos = chats.stream().map(chat -> {
            ChatDto dto = ChatMapper.toChatDto(chat);
            dto.setUnreadCount(messageService.countUnreadMessagesForChat(chat.getId(), userId));
            return dto;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Chat>> findChatsByUserId(@PathVariable UUID userId) {
        List<Chat> currentUserChats = chatService.findAllChatsByUserId(userId);
        return new ResponseEntity<>(currentUserChats, HttpStatus.OK);
    }

    @PutMapping("{chatId}/add/{userId}")
    public ResponseEntity<Chat> addUserToGroup(@PathVariable UUID chatId, @PathVariable UUID userId) {
        Chat chat = chatService.addUserToGroup(chatId, userId);
        return new ResponseEntity<>(chat, HttpStatus.OK);
    }

    @PutMapping("{chatId}/remove/{userId}")
    public ResponseEntity<Chat> removeUserFromGroup(@PathVariable UUID chatId, @PathVariable UUID userId) {
        Chat chat = chatService.removeFromGroup(chatId, userId);
        return new ResponseEntity<>(chat, HttpStatus.OK);
    }

    @DeleteMapping("/delete/{chatId}")
    public ResponseEntity<ApiStateResponse> deleteChat(@PathVariable UUID chatId) {
        UUID deletedChatId = chatService.deleteChat(chatId);
        ApiStateResponse response = new ApiStateResponse(true, String.format(Constants.CHAT_DELETE_SUCCESS_MSG, deletedChatId));
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PutMapping("/{chatId}/rename/{newName}")
    public ResponseEntity<Chat> renameGroup(@PathVariable UUID chatId, @PathVariable String newName) {
        User user = userService.getCurrentUser();
        Chat chat = chatService.renameGroup(chatId, newName, user);
        return new ResponseEntity<>(chat, HttpStatus.OK);
    }

    @GetMapping("/current-user/unread-chats")
    public ResponseEntity<Long> getChatsWithUnreadMessages() {
        UUID userId = userService.getCurrentUser().getId();
        Long unreadChatsCount = chatService.getChatsWithUnreadMessages(userId);
        return new ResponseEntity<>(unreadChatsCount, HttpStatus.OK);
    }

    @GetMapping("/check")
    public ResponseEntity<Map<String, Object>> checkExistingChat(
        @RequestParam UUID recipientId) {
        
        User currentUser = userService.getCurrentUser();
        Optional<Chat> chat = chatService.findSingleChatByUsers(
            currentUser, 
            userService.getUserById(recipientId)
        );
        
        Map<String, Object> response = new HashMap<>();
        response.put("exists", chat.isPresent());
        chat.ifPresent(c -> response.put("chatId", c.getId()));
        
        return ResponseEntity.ok(response);
    }
}
