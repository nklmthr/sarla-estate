package com.sarlatea.crm.controller;

import com.sarlatea.crm.dto.RoleDTO;
import com.sarlatea.crm.model.Permission;
import com.sarlatea.crm.service.RoleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"}, 
             allowedHeaders = "*", 
             methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS, RequestMethod.PATCH},
             allowCredentials = "true")
@RequiredArgsConstructor
@Slf4j
public class RoleController {

    private final RoleService roleService;

    @GetMapping
    @PreAuthorize("hasPermission('ROLE', 'VIEW')")
    public ResponseEntity<List<RoleDTO>> getAllRoles() {
        log.info("GET request to fetch all roles");
        List<RoleDTO> roles = roleService.getAllRoles();
        return ResponseEntity.ok(roles);
    }

    @GetMapping("/active")
    @PreAuthorize("hasPermission('ROLE', 'VIEW')")
    public ResponseEntity<List<RoleDTO>> getActiveRoles() {
        log.info("GET request to fetch active roles");
        List<RoleDTO> roles = roleService.getActiveRoles();
        return ResponseEntity.ok(roles);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission('ROLE', 'VIEW')")
    public ResponseEntity<RoleDTO> getRoleById(@PathVariable String id) {
        log.info("GET request to fetch role with id: {}", id);
        RoleDTO role = roleService.getRoleById(id);
        return ResponseEntity.ok(role);
    }

    @GetMapping("/name/{name}")
    @PreAuthorize("hasPermission('ROLE', 'VIEW')")
    public ResponseEntity<RoleDTO> getRoleByName(@PathVariable String name) {
        log.info("GET request to fetch role with name: {}", name);
        RoleDTO role = roleService.getRoleByName(name);
        return ResponseEntity.ok(role);
    }

    @PostMapping
    @PreAuthorize("hasPermission('ROLE', 'CREATE')")
    public ResponseEntity<RoleDTO> createRole(@RequestBody RoleDTO roleDTO) {
        log.info("POST request to create role: {}", roleDTO.getName());
        RoleDTO createdRole = roleService.createRole(roleDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdRole);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasPermission('ROLE', 'EDIT')")
    public ResponseEntity<RoleDTO> updateRole(@PathVariable String id, @RequestBody RoleDTO roleDTO) {
        log.info("PUT request to update role with id: {}", id);
        RoleDTO updatedRole = roleService.updateRole(id, roleDTO);
        return ResponseEntity.ok(updatedRole);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission('ROLE', 'DELETE')")
    public ResponseEntity<Void> deleteRole(@PathVariable String id) {
        log.info("DELETE request to delete role with id: {}", id);
        roleService.deleteRole(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/permissions")
    @PreAuthorize("hasPermission('ROLE', 'VIEW')")
    public ResponseEntity<List<Permission>> getAllPermissions() {
        log.info("GET request to fetch all permissions");
        List<Permission> permissions = roleService.getAllPermissions();
        return ResponseEntity.ok(permissions);
    }
}

