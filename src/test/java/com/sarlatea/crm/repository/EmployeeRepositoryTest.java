package com.sarlatea.crm.repository;

import com.sarlatea.crm.model.Employee;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
public class EmployeeRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Test
    public void whenFindByName_thenReturnEmployee() {
        // given
        Employee employee = new Employee();
        employee.setName("John Doe");
        employee.setPhone("1234567890");
        entityManager.persist(employee);
        entityManager.flush();

        // when
        List<Employee> found = employeeRepository.searchEmployees("John");

        // then
        assertThat(found).extracting(Employee::getName).contains("John Doe");
    }

    @Test
    public void whenFindByPhone_thenReturnEmployee() {
        // given
        Employee employee = new Employee();
        employee.setName("Jane Doe");
        employee.setPhone("9876543210");
        entityManager.persist(employee);
        entityManager.flush();

        // when
        Optional<Employee> found = employeeRepository.findByPhone("9876543210");

        // then
        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("Jane Doe");
    }
}
