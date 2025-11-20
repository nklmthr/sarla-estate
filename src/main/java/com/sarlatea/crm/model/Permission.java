package com.sarlatea.crm.model;

/**
 * Enum defining all available permissions in the system
 * These will be assigned to roles to control access to features
 */
public enum Permission {
    // Dashboard
    VIEW_DASHBOARD("View Dashboard", "Access to main dashboard"),
    
    // Employee Management
    VIEW_EMPLOYEES("View Employees", "View employee list and details"),
    CREATE_EMPLOYEE("Create Employee", "Create new employees"),
    EDIT_EMPLOYEE("Edit Employee", "Edit existing employee information"),
    DELETE_EMPLOYEE("Delete Employee", "Delete employees from system"),
    
    // Work Activity Management
    VIEW_WORK_ACTIVITIES("View Work Activities", "View work activities list"),
    CREATE_WORK_ACTIVITY("Create Work Activity", "Create new work activities"),
    EDIT_WORK_ACTIVITY("Edit Work Activity", "Edit existing work activities"),
    DELETE_WORK_ACTIVITY("Delete Work Activity", "Delete work activities"),
    MANAGE_COMPLETION_CRITERIA("Manage Completion Criteria", "Manage activity completion criteria"),
    
    // Assignment Management
    VIEW_ASSIGNMENTS("View Assignments", "View work assignments"),
    CREATE_ASSIGNMENT("Create Assignment", "Create new work assignments"),
    EDIT_ASSIGNMENT("Edit Assignment", "Edit existing assignments"),
    DELETE_ASSIGNMENT("Delete Assignment", "Delete assignments"),
    EVALUATE_ASSIGNMENT("Evaluate Assignment", "Evaluate and mark assignments as complete"),
    
    // Reports
    VIEW_REPORTS("View Reports", "Access to reports section"),
    GENERATE_PAYMENT_REPORT("Generate Payment Report", "Generate payment reports"),
    GENERATE_ASSIGNMENT_REPORT("Generate Assignment Report", "Generate assignment reports"),
    EXPORT_REPORTS("Export Reports", "Export reports to PDF/Excel"),
    
    // User Management
    VIEW_USERS("View Users", "View user list and details"),
    CREATE_USER("Create User", "Create new users"),
    EDIT_USER("Edit User", "Edit existing user information"),
    DELETE_USER("Delete User", "Delete users from system"),
    RESET_USER_PASSWORD("Reset User Password", "Reset user passwords"),
    
    // Role Management
    VIEW_ROLES("View Roles", "View role list and details"),
    CREATE_ROLE("Create Role", "Create new roles"),
    EDIT_ROLE("Edit Role", "Edit existing roles"),
    DELETE_ROLE("Delete Role", "Delete roles from system"),
    ASSIGN_PERMISSIONS("Assign Permissions", "Assign permissions to roles"),
    
    // Settings & Configuration
    VIEW_SETTINGS("View Settings", "Access to settings section"),
    MANAGE_EMPLOYEE_TYPES("Manage Employee Types", "Manage employee type master data"),
    MANAGE_EMPLOYEE_STATUSES("Manage Employee Statuses", "Manage employee status master data"),
    
    // System Administration
    SYSTEM_ADMIN("System Administration", "Full system administration access");

    private final String displayName;
    private final String description;

    Permission(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }
}

