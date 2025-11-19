package com.sarlatea.crm.config;

import com.sarlatea.crm.model.EmployeeStatus;
import com.sarlatea.crm.model.EmployeeType;
import com.sarlatea.crm.repository.EmployeeStatusRepository;
import com.sarlatea.crm.repository.EmployeeTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Data seeder to initialize default master data for Employee Types and Statuses
 * This runs once when the application starts
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final EmployeeTypeRepository employeeTypeRepository;
    private final EmployeeStatusRepository employeeStatusRepository;

    @Override
    public void run(String... args) {
        seedEmployeeTypes();
        seedEmployeeStatuses();
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

