package com.yourmaster.api.controller;

import com.yourmaster.api.Constants;
import com.yourmaster.api.dto.UserDto;
import com.yourmaster.api.model.User;
import com.yourmaster.api.service.UserService;
import com.yourmaster.api.util.mappers.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {
    @Autowired
    private UserService userService;

    @Autowired
    private UserMapper userMapper;

    @GetMapping("/{userId}")
    public ResponseEntity<UserDto> getUser(@PathVariable  UUID userId) {
        User user = userService.getUserById(userId);
        return new ResponseEntity<>(userMapper.userToUserDto(user), HttpStatus.OK);
    }

    @PutMapping("/update/{userId}")
    public ResponseEntity<UserDto> updateUser(
            @PathVariable UUID userId,
            @RequestPart UserDto userDto,
            @RequestPart(
                required = false,
                name = Constants.FILE_REQUEST_PART_ID
            ) MultipartFile file
    ) throws IOException {
        return ResponseEntity.ok(userService.updateUser(userId, userDto, file));
    }

    @DeleteMapping("/delete/{userId}")
    public ResponseEntity<UUID> deleteUser(@PathVariable UUID userId) throws IOException {
        return ResponseEntity.ok(userService.deleteUser(userId));
    }

    @GetMapping("/currentUser")
    public ResponseEntity<User> getCurrentUser() {
        User currentUser = userService.getCurrentUser();
        return new ResponseEntity<>(currentUser, HttpStatus.OK);
    }

//    @PutMapping("/addFriend/{friendId}")
//    public ResponseEntity<User> addFriend(@PathVariable UUID friendId) throws IOException {
//        return ResponseEntity.ok(userService.addFriend(friendId));
//    }
//
//    @PutMapping("/deleteFriend/{friendId}")
//    public ResponseEntity<User> deleteFriend(@PathVariable UUID friendId) throws IOException {
//        return ResponseEntity.ok(userService.deleteFriend(friendId));
//    }
//
//    @GetMapping("/{userId}/friends")
//    public ResponseEntity<List<User>> getUserFriendsById(@PathVariable UUID userId) {
//        return new ResponseEntity<>(userService.getUserFriendsById(userId), HttpStatus.OK);
//    }

//    @GetMapping("/search")
//    public ResponseEntity<List<User>> searchUsersByFullName(@RequestParam String name) {
//        List<User> users = userService.searchByFullName(name);
//        if (users.isEmpty()) {
//            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
//        }
//        return new ResponseEntity<>(users, HttpStatus.OK);
//    }
//
    @PutMapping("/toggleOnline")
    public ResponseEntity<User> toggleUserOnline() {
        return new ResponseEntity<>(userService.toggleUserOnline(), HttpStatus.OK);
    }

    @GetMapping("/interlocutor/{chatId}")
    public ResponseEntity<User> getInterlocutorInfo(
        @PathVariable UUID chatId,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        User currentUser = userService.getUserByEmail(userDetails.getUsername());
        User interlocutor = userService.getInterlocutorInfo(chatId, currentUser.getId());
        return ResponseEntity.ok(interlocutor);
    }
}