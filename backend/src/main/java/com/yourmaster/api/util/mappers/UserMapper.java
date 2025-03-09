package com.yourmaster.api.util.mappers;

import com.yourmaster.api.dto.UserDto;
import com.yourmaster.api.model.User;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import java.util.List;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface UserMapper {
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateUserFromDto(UserDto userDto, @MappingTarget User entity);

//    @Mapping(target = "friends", ignore = true)
     UserDto userToUserDto(User user);

    User userDtoToUser(UserDto userDto);
//
//    public static List<UserDto> toUserDtoList(List<User> users) {
//        return users.stream()
//            .map(UserMapper::userToUserDto)
//            .collect(Collectors.toList());
//    }
}
