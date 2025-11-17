package com.sarlatea.crm.repository;

import com.sarlatea.crm.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for Employee entity
 */
@Repository
public interface EmployeeRepository extends JpaRepository<Employee, String> {

    Optional<Employee> findByPhone(String phone);

    @Query("SELECT e FROM Employee e WHERE LOWER(e.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(e.phone) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(e.pfAccountId) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<Employee> searchEmployees(@Param("searchTerm") String searchTerm);

    List<Employee> findByIdCardType(Employee.IdCardType idCardType);
}

