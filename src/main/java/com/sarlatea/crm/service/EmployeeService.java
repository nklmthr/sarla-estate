package com.sarlatea.crm.service;

import com.sarlatea.crm.dto.EmployeeDTO;
import com.sarlatea.crm.exception.ResourceNotFoundException;
import com.sarlatea.crm.model.AuditLog;
import com.sarlatea.crm.model.Employee;
import com.sarlatea.crm.model.EmployeeType;
import com.sarlatea.crm.model.EmployeeStatus;
import com.sarlatea.crm.repository.EmployeeRepository;
import com.sarlatea.crm.repository.EmployeeTypeRepository;
import com.sarlatea.crm.repository.EmployeeStatusRepository;
import com.sarlatea.crm.repository.EmployeeSalaryRepository;
import com.sarlatea.crm.repository.WorkAssignmentRepository;
import com.sarlatea.crm.repository.PaymentLineItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service class for Employee operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final EmployeeTypeRepository employeeTypeRepository;
    private final EmployeeStatusRepository employeeStatusRepository;
    private final EmployeeSalaryRepository employeeSalaryRepository;
    private final WorkAssignmentRepository workAssignmentRepository;
    private final PaymentLineItemRepository paymentLineItemRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<EmployeeDTO> getAllEmployees() {
        log.debug("Fetching all employees ordered by assignment count and name");
        return employeeRepository.findAllOrderedByName().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<EmployeeDTO> getEmployeesPaginated(Pageable pageable) {
        log.debug("Fetching paginated employees - page: {}, size: {}", 
                pageable.getPageNumber(), pageable.getPageSize());
        Page<Employee> employeePage = employeeRepository.findAllOrderedByNamePageable(pageable);
        return employeePage.map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public EmployeeDTO getEmployeeById(String id) {
        log.debug("Fetching employee with id: {}", id);
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
        return convertToDTO(employee);
    }

    @Transactional
    public EmployeeDTO createEmployee(EmployeeDTO employeeDTO) {
        log.debug("Creating new employee: {}", employeeDTO.getName());
        Employee employee = convertToEntity(employeeDTO);
        Employee savedEmployee = employeeRepository.save(employee);
        
        // Audit log for creation
        auditLogService.logAudit(
            AuditLog.OperationType.CREATE,
            "Employee",
            savedEmployee.getId(),
            savedEmployee.getName()
        );
        
        return convertToDTO(savedEmployee);
    }

    @Transactional
    public EmployeeDTO updateEmployee(String id, EmployeeDTO employeeDTO) {
        log.debug("Updating employee with id: {}", id);
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
        
        // Capture old state for audit
        EmployeeDTO oldState = convertToDTO(employee);
        
        updateEmployeeFields(employee, employeeDTO);
        Employee updatedEmployee = employeeRepository.save(employee);
        
        // Audit log for update with old and new values
        EmployeeDTO newState = convertToDTO(updatedEmployee);
        auditLogService.logAuditWithChanges(
            AuditLog.OperationType.EDIT,
            "Employee",
            updatedEmployee.getId(),
            updatedEmployee.getName(),
            oldState,
            newState
        );
        
        return newState;
    }

    @Transactional
    public void deleteEmployee(String id) {
        log.debug("Deleting employee with id: {}", id);
        if (!employeeRepository.existsById(id)) {
            throw new ResourceNotFoundException("Employee not found with id: " + id);
        }
        
        // Check for related records
        List<String> relatedRecords = new ArrayList<>();
        
        // Check for salary records
        long salaryCount = employeeSalaryRepository.findSalaryHistoryByEmployeeId(id).size();
        if (salaryCount > 0) {
            relatedRecords.add(salaryCount + " salary record(s)");
        }
        
        // Check for work assignments
        long assignmentCount = workAssignmentRepository.findByAssignedEmployeeIdAndDeletedFalse(id).size();
        if (assignmentCount > 0) {
            relatedRecords.add(assignmentCount + " work assignment(s)");
        }
        
        // Check for payment line items
        long paymentLineItemCount = paymentLineItemRepository.findByEmployeeId(id).size();
        if (paymentLineItemCount > 0) {
            relatedRecords.add(paymentLineItemCount + " payment line item(s)");
        }
        
        if (!relatedRecords.isEmpty()) {
            String message = "Cannot delete employee because they have " + 
                           String.join(", ", relatedRecords) + 
                           ". Please delete or reassign these records first.";
            log.warn("Cannot delete employee {}: {}", id, message);
            throw new DataIntegrityViolationException(message);
        }
        
        // Get employee name before deletion for audit log
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
        String employeeName = employee.getName();
        
        employeeRepository.deleteById(id);
        log.info("Successfully deleted employee with id: {}", id);
        
        // Audit log for deletion
        auditLogService.logAudit(
            AuditLog.OperationType.DELETE,
            "Employee",
            id,
            employeeName
        );
    }

    @Transactional(readOnly = true)
    public List<EmployeeDTO> searchEmployees(String searchTerm) {
        log.debug("Searching employees with term: {}", searchTerm);
        return employeeRepository.searchEmployees(searchTerm).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<EmployeeDTO> searchEmployeesPaginated(String searchTerm, Pageable pageable) {
        log.debug("Searching employees with term: '{}' - page: {}, size: {}", 
                searchTerm, pageable.getPageNumber(), pageable.getPageSize());
        Page<Employee> employeePage = employeeRepository.searchEmployeesPaginated(searchTerm, pageable);
        return employeePage.map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public byte[] getEmployeePhoto(String id) {
        log.debug("Fetching photo for employee with id: {}", id);
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
        return employee.getIdCardPhoto();
    }

    @Transactional
    public void updateEmployeePhoto(String id, byte[] photo) {
        log.debug("Updating photo for employee with id: {}", id);
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
        employee.setIdCardPhoto(photo);
        employeeRepository.save(employee);
    }

    private EmployeeDTO convertToDTO(Employee employee) {
        EmployeeDTO dto = new EmployeeDTO();
        dto.setId(employee.getId());
        dto.setName(employee.getName());
        dto.setPhone(employee.getPhone());
        dto.setPfAccountId(employee.getPfAccountId());
        dto.setIdCardType(employee.getIdCardType());
        dto.setIdCardValue(employee.getIdCardValue());
        
        // Set employee type if present
        if (employee.getEmployeeType() != null) {
            dto.setEmployeeTypeId(employee.getEmployeeType().getId());
            dto.setEmployeeTypeName(employee.getEmployeeType().getName());
        }
        
        // Set employee status if present
        if (employee.getEmployeeStatus() != null) {
            dto.setEmployeeStatusId(employee.getEmployeeStatus().getId());
            dto.setEmployeeStatusName(employee.getEmployeeStatus().getName());
        }
        
        // Note: idCardPhoto (byte[]) not included in DTO for typical list/get operations
        return dto;
    }

    private Employee convertToEntity(EmployeeDTO dto) {
        Employee employee = new Employee();
        employee.setName(dto.getName());
        employee.setPhone(dto.getPhone());
        employee.setPfAccountId(dto.getPfAccountId());
        employee.setIdCardType(dto.getIdCardType());
        employee.setIdCardValue(dto.getIdCardValue());
        
        // Set employee type if provided
        if (dto.getEmployeeTypeId() != null) {
            EmployeeType employeeType = employeeTypeRepository.findById(dto.getEmployeeTypeId())
                    .orElse(null);
            employee.setEmployeeType(employeeType);
        }
        
        // Set employee status if provided
        if (dto.getEmployeeStatusId() != null) {
            EmployeeStatus employeeStatus = employeeStatusRepository.findById(dto.getEmployeeStatusId())
                    .orElse(null);
            employee.setEmployeeStatus(employeeStatus);
        }
        
        return employee;
    }

    private void updateEmployeeFields(Employee employee, EmployeeDTO dto) {
        employee.setName(dto.getName());
        employee.setPhone(dto.getPhone());
        employee.setPfAccountId(dto.getPfAccountId());
        employee.setIdCardType(dto.getIdCardType());
        employee.setIdCardValue(dto.getIdCardValue());
        
        // Update employee type if provided
        if (dto.getEmployeeTypeId() != null) {
            EmployeeType employeeType = employeeTypeRepository.findById(dto.getEmployeeTypeId())
                    .orElse(null);
            employee.setEmployeeType(employeeType);
        }
        
        // Update employee status if provided
        if (dto.getEmployeeStatusId() != null) {
            EmployeeStatus employeeStatus = employeeStatusRepository.findById(dto.getEmployeeStatusId())
                    .orElse(null);
            employee.setEmployeeStatus(employeeStatus);
        }
    }
}

