package com.sarlatea.crm.repository;

import com.sarlatea.crm.model.Contact;
import com.sarlatea.crm.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * Repository interface for Contact entity
 */
@Repository
public interface ContactRepository extends JpaRepository<Contact, String> {

    List<Contact> findByEmployee(Employee employee);

    List<Contact> findByEmployeeId(String employeeId);

    List<Contact> findByContactType(Contact.ContactType contactType);

    List<Contact> findByContactDateBetween(LocalDate startDate, LocalDate endDate);

    @Query("SELECT c FROM Contact c WHERE c.followUpDate IS NOT NULL AND c.followUpDate <= :date")
    List<Contact> findUpcomingFollowUps(@Param("date") LocalDate date);

    List<Contact> findByContactedBy(String contactedBy);
}

