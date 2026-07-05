package com.eventagent.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.eventagent.dto.UserProfileDto;
import com.eventagent.entity.User;
import com.eventagent.repository.UserRepository;

@Service
public class UserProfileService {

    private final UserRepository userRepository;

    @Autowired
    public UserProfileService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserProfileDto getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
        return toDto(user);
    }

    public UserProfileDto updateProfile(Long userId, UserProfileDto dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));

        if (dto.getFullName() != null && !dto.getFullName().isBlank()) {
            user.setFullName(dto.getFullName().trim());
        }
        if (dto.getPhoneNumber() != null) {
            user.setPhoneNumber(dto.getPhoneNumber().trim());
        }
        if (dto.getAddress() != null) {
            user.setAddress(dto.getAddress().trim());
        }
        if (dto.getInterests() != null) {
            user.setInterests(dto.getInterests().trim());
        }
        if (dto.getAge() != null) {
            user.setAge(dto.getAge());
        }
        if (dto.getUserType() != null) {
            user.setUserType(dto.getUserType().trim());
        }
        if (dto.getIndustry() != null) {
            user.setIndustry(dto.getIndustry().trim());
        }

        userRepository.save(user);
        return toDto(user);
    }

    private UserProfileDto toDto(User user) {
        UserProfileDto dto = new UserProfileDto();
        dto.setFullName(user.getFullName());
        dto.setEmail(user.getEmail());
        dto.setPhoneNumber(user.getPhoneNumber());
        dto.setAddress(user.getAddress());
        dto.setInterests(user.getInterests());
        dto.setAge(user.getAge());
        dto.setUserType(user.getUserType());
        dto.setIndustry(user.getIndustry());
        return dto;
    }
}
