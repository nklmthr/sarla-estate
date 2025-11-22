package com.sarlatea.crm.controller;

import com.sarlatea.crm.dto.ChangePasswordDTO;
import com.sarlatea.crm.dto.UpdateProfileDTO;
import com.sarlatea.crm.dto.UserDTO;
import com.sarlatea.crm.dto.UserProfileDTO;
import com.sarlatea.crm.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001" }, allowedHeaders = "*", methods = {
        RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS,
        RequestMethod.PATCH }, allowCredentials = "true")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<UserProfileDTO> getProfile() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        log.info("GET request to fetch profile for user: {}", username);

        // We need to get ID from username first, or modify service to get by username
        // For now, let's get the user DTO to get ID
        UserDTO user = userService.getUserByUsername(username);
        UserProfileDTO profile = userService.getUserProfile(user.getId());

        return ResponseEntity.ok(profile);
    }

    @PutMapping("/profile")
    public ResponseEntity<UserProfileDTO> updateProfile(@RequestBody UpdateProfileDTO dto) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        log.info("PUT request to update profile for user: {}", username);

        UserDTO user = userService.getUserByUsername(username);
        UserProfileDTO updatedProfile = userService.updateProfile(user.getId(), dto);

        return ResponseEntity.ok(updatedProfile);
    }

    @PutMapping("/profile/password")
    public ResponseEntity<Void> changePassword(@RequestBody ChangePasswordDTO dto) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        log.info("PUT request to change password for user: {}", username);

        UserDTO user = userService.getUserByUsername(username);
        userService.changePassword(user.getId(), dto);

        return ResponseEntity.ok().build();
    }

    @PostMapping("/profile/picture")
    public ResponseEntity<UserProfileDTO> uploadProfilePicture(
            @RequestParam("file") MultipartFile file) throws IOException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        log.info("POST request to upload profile picture for user: {}", username);

        UserDTO user = userService.getUserByUsername(username);
        UserProfileDTO updatedProfile = userService.uploadProfilePicture(user.getId(), file);

        return ResponseEntity.ok(updatedProfile);
    }

    @DeleteMapping("/profile/picture")
    public ResponseEntity<UserProfileDTO> deleteProfilePicture() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        log.info("DELETE request to remove profile picture for user: {}", username);

        UserDTO user = userService.getUserByUsername(username);
        UserProfileDTO updatedProfile = userService.deleteProfilePicture(user.getId());

        return ResponseEntity.ok(updatedProfile);
    }

    @GetMapping("/profile/picture/{userId}")
    public ResponseEntity<byte[]> getProfilePicture(@PathVariable String userId) {
        log.info("GET request to fetch profile picture for user: {}", userId);

        byte[] imageBytes = userService.getProfilePicture(userId);

        if (imageBytes == null || imageBytes.length == 0) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .header("Content-Type", "image/jpeg") // Default to JPEG
                .body(imageBytes);
    }

    @GetMapping
    @PreAuthorize("hasPermission('USER', 'VIEW')")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        log.info("GET request to fetch all users");
        List<UserDTO> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission('USER', 'VIEW')")
    public ResponseEntity<UserDTO> getUserById(@PathVariable String id) {
        log.info("GET request to fetch user with id: {}", id);
        UserDTO user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    @GetMapping("/username/{username}")
    @PreAuthorize("hasPermission('USER', 'VIEW')")
    public ResponseEntity<UserDTO> getUserByUsername(@PathVariable String username) {
        log.info("GET request to fetch user with username: {}", username);
        UserDTO user = userService.getUserByUsername(username);
        return ResponseEntity.ok(user);
    }

    @PostMapping
    @PreAuthorize("hasPermission('USER', 'CREATE')")
    public ResponseEntity<UserDTO> createUser(@RequestBody UserDTO userDTO) {
        log.info("POST request to create user: {}", userDTO.getUsername());
        UserDTO createdUser = userService.createUser(userDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdUser);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasPermission('USER', 'EDIT')")
    public ResponseEntity<UserDTO> updateUser(@PathVariable String id, @RequestBody UserDTO userDTO) {
        log.info("PUT request to update user with id: {}", id);
        UserDTO updatedUser = userService.updateUser(id, userDTO);
        return ResponseEntity.ok(updatedUser);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission('USER', 'DELETE')")
    public ResponseEntity<Void> deleteUser(@PathVariable String id) {
        log.info("DELETE request to delete user with id: {}", id);
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
