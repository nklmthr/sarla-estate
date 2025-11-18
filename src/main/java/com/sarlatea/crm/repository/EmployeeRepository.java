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

    /**
     * Find all employees ordered by assignment count (descending) and then by name (ascending)
     */
    @Query(value = "SELECT e.id, e.name, e.phone, e.pf_account_id, e.id_card_type, " +
           "e.id_card_value, e.id_card_photo, e.created_at, e.updated_at " +
           "FROM employees e " +
           "LEFT JOIN work_assignments wa ON e.id = wa.assigned_employee_id " +
           "GROUP BY e.id, e.name, e.phone, e.pf_account_id, e.id_card_type, " +
           "e.id_card_value, e.id_card_photo, e.created_at, e.updated_at " +
           "ORDER BY COUNT(wa.id) DESC, e.name ASC", 
           nativeQuery = true)
    List<Employee> findAllOrderedByName();

    Optional<Employee> findByPhone(String phone);

    @Query("SELECT e FROM Employee e WHERE LOWER(e.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(e.phone) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(e.pfAccountId) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<Employee> searchEmployees(@Param("searchTerm") String searchTerm);

    List<Employee> findByIdCardType(Employee.IdCardType idCardType);
}

