package com.sarlatea.crm.config;

import com.sarlatea.crm.model.*;
import com.sarlatea.crm.repository.EmployeeStatusRepository;
import com.sarlatea.crm.repository.EmployeeTypeRepository;
import com.sarlatea.crm.repository.PermissionConfigRepository;
import com.sarlatea.crm.repository.RoleRepository;
import com.sarlatea.crm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.HashSet;

/**
 * Data seeder to initialize default master data for Roles, Users, Employee Types, and Statuses
 * This runs once when the application starts
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final EmployeeTypeRepository employeeTypeRepository;
    private final EmployeeStatusRepository employeeStatusRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PermissionConfigRepository permissionConfigRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedRoles();
        seedPermissionConfigs(); // Seed permission configurations
        seedAdminUser();
        seedTestUser(); // Create a test limited user
        seedEmployeeTypes();
        seedEmployeeStatuses();
    }

    private void seedRoles() {
        if (roleRepository.count() > 0) {
            log.info("Roles already exist, skipping seed data");
            return;
        }

        log.info("Seeding default roles...");

        // Create SUPER_ADMIN role - THE ONLY SYSTEM ROLE with all permissions
        Role superAdminRole = new Role();
        superAdminRole.setName("SUPER_ADMIN");
        superAdminRole.setDescription("Super Administrator with unrestricted system access and role management");
        superAdminRole.setPermissions(new HashSet<>(Arrays.asList(Permission.values())));
        superAdminRole.setIsSystemRole(true); // Cannot be deleted or renamed
        superAdminRole.setIsActive(true);
        roleRepository.save(superAdminRole);
        log.debug("Created system role: SUPER_ADMIN");

        // Create ADMIN role (regular role, can be modified/deleted)
        Role adminRole = new Role();
        adminRole.setName("ADMIN");
        adminRole.setDescription("Administrator role with full operational access");
        adminRole.setPermissions(new HashSet<>(Arrays.asList(
                Permission.VIEW_DASHBOARD,
                Permission.VIEW_EMPLOYEES,
                Permission.CREATE_EMPLOYEE,
                Permission.EDIT_EMPLOYEE,
                Permission.DELETE_EMPLOYEE,
                Permission.VIEW_WORK_ACTIVITIES,
                Permission.CREATE_WORK_ACTIVITY,
                Permission.EDIT_WORK_ACTIVITY,
                Permission.DELETE_WORK_ACTIVITY,
                Permission.MANAGE_COMPLETION_CRITERIA,
                Permission.VIEW_ASSIGNMENTS,
                Permission.CREATE_ASSIGNMENT,
                Permission.EDIT_ASSIGNMENT,
                Permission.DELETE_ASSIGNMENT,
                Permission.EVALUATE_ASSIGNMENT,
                Permission.VIEW_REPORTS,
                Permission.GENERATE_PAYMENT_REPORT,
                Permission.GENERATE_ASSIGNMENT_REPORT,
                Permission.EXPORT_REPORTS,
                Permission.VIEW_USERS,
                Permission.CREATE_USER,
                Permission.EDIT_USER,
                Permission.VIEW_SETTINGS,
                Permission.MANAGE_EMPLOYEE_TYPES,
                Permission.MANAGE_EMPLOYEE_STATUSES
        )));
        adminRole.setIsSystemRole(false); // Can be modified/deleted
        adminRole.setIsActive(true);
        roleRepository.save(adminRole);
        log.debug("Created role: ADMIN");

        // Create USER role (regular role, can be modified/deleted)
        Role userRole = new Role();
        userRole.setName("USER");
        userRole.setDescription("Standard user role with basic read-only access");
        userRole.setPermissions(new HashSet<>(Arrays.asList(
                Permission.VIEW_DASHBOARD,
                Permission.VIEW_EMPLOYEES,
                Permission.VIEW_WORK_ACTIVITIES,
                Permission.VIEW_ASSIGNMENTS,
                Permission.VIEW_REPORTS
        )));
        userRole.setIsSystemRole(false); // Can be modified/deleted
        userRole.setIsActive(true);
        roleRepository.save(userRole);
        log.debug("Created role: USER");

        log.info("Roles seeded successfully (1 system role: SUPER_ADMIN, 2 regular roles: ADMIN, USER)");
    }

    private void seedPermissionConfigs() {
        if (permissionConfigRepository.count() > 0) {
            log.info("Permission configurations already exist, skipping seed data");
            return;
        }

        log.info("Seeding default permission configurations...");

        // EMPLOYEE resource configurations
        createPermissionConfig("EMPLOYEE", "VIEW", Permission.VIEW_EMPLOYEES, "View employee list and details");
        createPermissionConfig("EMPLOYEE", "CREATE", Permission.CREATE_EMPLOYEE, "Create new employees");
        createPermissionConfig("EMPLOYEE", "EDIT", Permission.EDIT_EMPLOYEE, "Edit existing employee information");
        createPermissionConfig("EMPLOYEE", "DELETE", Permission.DELETE_EMPLOYEE, "Delete employees from system");

        // WORK_ACTIVITY resource configurations
        createPermissionConfig("WORK_ACTIVITY", "VIEW", Permission.VIEW_WORK_ACTIVITIES, "View work activities list");
        createPermissionConfig("WORK_ACTIVITY", "CREATE", Permission.CREATE_WORK_ACTIVITY, "Create new work activities");
        createPermissionConfig("WORK_ACTIVITY", "EDIT", Permission.EDIT_WORK_ACTIVITY, "Edit existing work activities");
        createPermissionConfig("WORK_ACTIVITY", "DELETE", Permission.DELETE_WORK_ACTIVITY, "Delete work activities");

        // ASSIGNMENT resource configurations
        createPermissionConfig("ASSIGNMENT", "VIEW", Permission.VIEW_ASSIGNMENTS, "View work assignments");
        createPermissionConfig("ASSIGNMENT", "CREATE", Permission.CREATE_ASSIGNMENT, "Create new work assignments");
        createPermissionConfig("ASSIGNMENT", "EDIT", Permission.EDIT_ASSIGNMENT, "Edit existing assignments");
        createPermissionConfig("ASSIGNMENT", "DELETE", Permission.DELETE_ASSIGNMENT, "Delete assignments");
        createPermissionConfig("ASSIGNMENT", "EVALUATE", Permission.EVALUATE_ASSIGNMENT, "Evaluate and complete assignments");

        // REPORT resource configurations
        createPermissionConfig("REPORT", "VIEW", Permission.VIEW_REPORTS, "Access to reports section");
        createPermissionConfig("REPORT", "GENERATE_PAYMENT", Permission.GENERATE_PAYMENT_REPORT, "Generate payment reports");
        createPermissionConfig("REPORT", "GENERATE_ASSIGNMENT", Permission.GENERATE_ASSIGNMENT_REPORT, "Generate assignment reports");

        // USER resource configurations
        createPermissionConfig("USER", "VIEW", Permission.VIEW_USERS, "View user list and details");
        createPermissionConfig("USER", "CREATE", Permission.CREATE_USER, "Create new users");
        createPermissionConfig("USER", "EDIT", Permission.EDIT_USER, "Edit existing user information");
        createPermissionConfig("USER", "DELETE", Permission.DELETE_USER, "Delete users from system");

        // ROLE resource configurations
        createPermissionConfig("ROLE", "VIEW", Permission.VIEW_ROLES, "View role list and details");
        createPermissionConfig("ROLE", "CREATE", Permission.CREATE_ROLE, "Create new roles");
        createPermissionConfig("ROLE", "EDIT", Permission.EDIT_ROLE, "Edit existing roles");
        createPermissionConfig("ROLE", "DELETE", Permission.DELETE_ROLE, "Delete roles from system");

        log.info("Permission configurations seeded successfully");
    }

    private void createPermissionConfig(String resourceType, String operationType, 
                                       Permission requiredPermission, String description) {
        PermissionConfig config = new PermissionConfig();
        config.setResourceType(resourceType);
        config.setOperationType(operationType);
        config.setRequiredPermission(requiredPermission);
        config.setDescription(description);
        config.setIsActive(true);
        permissionConfigRepository.save(config);
        log.debug("Created permission config: {}:{} -> {}", resourceType, operationType, requiredPermission.name());
    }

    private void seedAdminUser() {
        if (userRepository.existsByUsername("nklmthr")) {
            log.info("Super admin user already exists, skipping seed data");
            return;
        }

        log.info("Seeding default super admin user...");

        Role superAdminRole = roleRepository.findByName("SUPER_ADMIN")
                .orElseThrow(() -> new RuntimeException("SUPER_ADMIN role not found. Please seed roles first."));

        User superAdmin = new User();
        superAdmin.setUsername("nklmthr");
        superAdmin.setPassword(passwordEncoder.encode("Kedarnath1312"));
        superAdmin.setFullName("Super Administrator");
        superAdmin.setEmail("superadmin@sarlatea.com");
        superAdmin.setRole(superAdminRole);
        superAdmin.setIsActive(true);
        
        userRepository.save(superAdmin);
        log.info("Super admin user 'nklmthr' created successfully with SUPER_ADMIN role");
        log.info("Super admin credentials - Username: nklmthr, Password: Kedarnath1312");
    }

    private void seedTestUser() {
        if (userRepository.existsByUsername("testuser")) {
            log.info("Test user already exists, skipping seed data");
            return;
        }

        log.info("Seeding test limited user...");

        // Fetch the USER role (with limited permissions)
        Role userRole = roleRepository.findByName("USER")
                .orElseThrow(() -> new RuntimeException("USER role not found. Please seed roles first."));

        User testUser = new User();
        testUser.setUsername("testuser");
        testUser.setPassword(passwordEncoder.encode("Test@123"));
        testUser.setFullName("Test User");
        testUser.setEmail("testuser@sarlatea.com");
        testUser.setRole(userRole);
        testUser.setIsActive(true);
        
        userRepository.save(testUser);
        log.info("Test user 'testuser' created successfully with limited permissions (USER role)");
        log.info("Test user credentials - Username: testuser, Password: Test@123");
    }

    private void seedEmployeeTypes() {
        if (employeeTypeRepository.count() > 0) {
            log.info("Employee types already exist, skipping seed data");
            return;
        }

        log.info("Seeding default employee types...");

        createEmployeeType("PERMANENT", "Permanent Employee", 
            "Full-time permanent employees with regular employment contracts", 1);
        
        createEmployeeType("CONTRACT", "Contract Worker", 
            "Contract-based employees with fixed-term agreements", 2);
        
        createEmployeeType("TEMPORARY", "Temporary Worker", 
            "Temporary or seasonal workers", 3);
        
        createEmployeeType("DAILY_WAGE", "Daily Wage Worker", 
            "Workers paid on a daily wage basis", 4);
        
        createEmployeeType("CONTRACTOR", "Contractor", 
            "Independent contractors or freelancers", 5);
        
        createEmployeeType("APPRENTICE", "Apprentice", 
            "Apprentices or trainees learning the trade", 6);

        log.info("Employee types seeded successfully");
    }

    private void seedEmployeeStatuses() {
        if (employeeStatusRepository.count() > 0) {
            log.info("Employee statuses already exist, skipping seed data");
            return;
        }

        log.info("Seeding default employee statuses...");

        createEmployeeStatus("ACTIVE", "Active", 
            "Currently active and working employees", 1);
        
        createEmployeeStatus("ON_LEAVE", "On Leave", 
            "Employees currently on approved leave", 2);
        
        createEmployeeStatus("SUSPENDED", "Suspended", 
            "Employees under temporary suspension", 3);
        
        createEmployeeStatus("RESIGNED", "Resigned", 
            "Employees who have resigned", 4);
        
        createEmployeeStatus("TERMINATED", "Terminated", 
            "Employees whose contract has been terminated", 5);
        
        createEmployeeStatus("RETIRED", "Retired", 
            "Retired employees", 6);

        log.info("Employee statuses seeded successfully");
    }

    private void createEmployeeType(String code, String name, String description, int displayOrder) {
        EmployeeType type = new EmployeeType();
        type.setCode(code);
        type.setName(name);
        type.setDescription(description);
        type.setIsActive(true);
        type.setDisplayOrder(displayOrder);
        employeeTypeRepository.save(type);
        log.debug("Created employee type: {}", code);
    }

    private void createEmployeeStatus(String code, String name, String description, int displayOrder) {
        EmployeeStatus status = new EmployeeStatus();
        status.setCode(code);
        status.setName(name);
        status.setDescription(description);
        status.setIsActive(true);
        status.setDisplayOrder(displayOrder);
        employeeStatusRepository.save(status);
        log.debug("Created employee status: {}", code);
    }
}

