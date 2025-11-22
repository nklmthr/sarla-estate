package com.sarlatea.crm.service;

import com.sarlatea.crm.dto.EmployeeDTO;
import com.sarlatea.crm.model.Employee;
import com.sarlatea.crm.repository.EmployeeRepository;
import com.sarlatea.crm.repository.EmployeeStatusRepository;
import com.sarlatea.crm.repository.EmployeeTypeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
public class EmployeeServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private EmployeeTypeRepository employeeTypeRepository;

    @Mock
    private EmployeeStatusRepository employeeStatusRepository;

    @InjectMocks
    private EmployeeService employeeService;

    private Employee employee;
    private EmployeeDTO employeeDTO;

    @BeforeEach
    public void setUp() {
        employee = new Employee();
        employee.setId("1");
        employee.setName("John Doe");
        employee.setPhone("1234567890");

        employeeDTO = new EmployeeDTO();
        employeeDTO.setName("John Doe");
        employeeDTO.setPhone("1234567890");
    }

    @Test
    public void whenCreateEmployee_thenReturnSavedEmployee() {
        // given
        given(employeeRepository.save(any(Employee.class))).willReturn(employee);

        // when
        EmployeeDTO savedEmployee = employeeService.createEmployee(employeeDTO);

        // then
        assertThat(savedEmployee.getName()).isEqualTo(employee.getName());
        verify(employeeRepository).save(any(Employee.class));
    }

    @Test
    public void whenGetEmployeeById_thenReturnEmployee() {
        // given
        given(employeeRepository.findById("1")).willReturn(Optional.of(employee));

        // when
        EmployeeDTO foundEmployee = employeeService.getEmployeeById("1");

        // then
        assertThat(foundEmployee.getName()).isEqualTo(employee.getName());
    }
}
