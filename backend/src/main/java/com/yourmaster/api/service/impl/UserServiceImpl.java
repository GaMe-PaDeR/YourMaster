package com.yourmaster.api.service.impl;

import com.yourmaster.api.Constants;
import com.yourmaster.api.dto.UserDto;
import com.yourmaster.api.enums.Role;
import com.yourmaster.api.exception.ResourceNotFoundException;
import com.yourmaster.api.model.User;
import com.yourmaster.api.repository.UserRepository;
import com.yourmaster.api.service.FileService;
import com.yourmaster.api.service.UserService;
import com.yourmaster.api.util.mappers.UserMapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Slf4j
public class UserServiceImpl implements UserService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FileService fileService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    private UserMapper userMapper;

    @Value("${project.avatar}")
    private String avatarFolderName;

    @Override
    public User addUser(UserDto userDto, MultipartFile file) throws IOException {
        String avatarUrl = file == null ? null : fileService.uploadFile(avatarFolderName, file);

        User user = User.builder()
                .email(userDto.getEmail())
                .password(passwordEncoder.encode(userDto.getPassword()))
                .firstName(userDto.getFirstName())
                .lastName(userDto.getLastName())
                .birthday(userDto.getBirthday())
                .phoneNumber(userDto.getPhoneNumber())
                .city(userDto.getCity())
                .country(userDto.getCountry())
                .gender(userDto.getGender())
                .avatarUrl(avatarUrl)
                .description(userDto.getDescription())
                .role(userDto.getRole())
                .build();

        return userRepository.save(user);
    }
// Заготовки из другого проекта для переделки
//    @Override
//    public User addFriend(UUID friendId) throws IOException {
//        User user = getCurrentUser();
//        User newFriend = getUserById(friendId);
//
//        user.getFriends().add(newFriend);
//        log.info("addFriend[1]: Friend added successfully ID {}", friendId);
//
//        newFriend.getFriends().add(user);
//        log.info("addFriend[2]: Friends list {}", user.getFriends());
//
//        userRepository.save(user);
//        userRepository.save(newFriend);
//        return user;
//    }

//    @Override
//    public User deleteFriend(UUID friendId) throws IOException {
//        User user = getCurrentUser();
//        User delFriend = userRepository.findById(friendId)
//                .orElseThrow(() -> new ResourceNotFoundException(
//                        Constants.USER_RESOURCE_NAME, Constants.ID_FIELD, friendId)
//                );
//
//        user.getFriends().remove(delFriend);
//        log.info("deleteFriend[1]: Friend deleted successfully ID {}", friendId);
//        updateUser(user.getId(), userMapper.userToUserDto(user));
//        return user;
//    }

    @Override
    public User getUserById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        Constants.USER_RESOURCE_NAME, Constants.ID_FIELD, id)
                );
    }

    @Override
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(
                        Constants.USER_RESOURCE_NAME, Constants.EMAIL_FIELD, email)
                );
    }

    @Override
    public User getCurrentUser() {
        var username = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        return getUserByEmail(username);
    }

//    @Override
//    public List<User> getUsersByIds(List<UUID> ids) {
//        return userRepository.findByUserIds(ids);
//    }
//
//    @Override
//    public List<User> getUserFriendsById(UUID id) {
//        log.info("getUserFriendsById[1]: getting user's: {} friends", id);
//        User user = getUserById(id);
//        log.info("getUserFriendsById[2]: user: {}", user);
//        log.info("getUserFriendsById[3]: user's friends: {}", user.getFriends());
//        return user.getFriends();
//    }

    @Override
    public List<User> searchByFullName(String name) {
        log.info("searchByFullName[1]: searching users with name: {}", name);
        if (name.contains(" ")) {
            String[] parts = name.split("\\s+");
            String firstName = parts[0];
            String lastName = parts.length > 1 ? parts[1] : "";

            return userRepository.findByFirstNameContainingIgnoreCaseAndLastNameContainingIgnoreCase(firstName, lastName);
        } else {
            return userRepository.findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(name, name);
        }
    }

    @Override
    public UUID deleteUser(UUID userId) throws IOException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        Constants.USER_RESOURCE_NAME, Constants.ID_FIELD, userId)
                );

        String fileName = user.getAvatarUrl();
        Files.deleteIfExists(fileService.getStaticFilePath(avatarFolderName, fileName));

        userRepository.delete(user);
        return user.getId();
    }

    @Override
    public UserDto updateUser(UUID userId, UserDto userDto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                Constants.USER_RESOURCE_NAME, Constants.ID_FIELD, userId)
                );

        userMapper.updateUserFromDto(userDto, user);
        userRepository.save(user);
        return userMapper.userToUserDto(user);
    }

    @Override
    public UserDto updateUser(UUID userId, UserDto userDto, MultipartFile file) throws IOException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        Constants.USER_RESOURCE_NAME, Constants.ID_FIELD, userId)
                );

        String fileName = user.getAvatarUrl();

        if (file != null) {
            if (fileName != null) {
                Files.deleteIfExists(fileService.getStaticFilePath(avatarFolderName, fileName));
            }

            fileName = fileService.uploadFile(avatarFolderName, file);
        }

        userMapper.updateUserFromDto(userDto, user);
        user.setAvatarUrl(fileName);

        userRepository.save(user);

        return userMapper.userToUserDto(user);
    }

    @Override
    public Boolean checkEmailAvailability(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    public User toggleUserOnline() {
        User currentUser = getCurrentUser();
        currentUser.setOnline(!currentUser.isOnline());

        if (!currentUser.isOnline())
            currentUser.setLastOnline(LocalDateTime.now());
        else currentUser.setLastOnline(null);

        userRepository.save(currentUser);
        return currentUser;
    }
}
