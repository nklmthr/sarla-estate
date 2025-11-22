package com.sarlatea.crm.repository;

import com.sarlatea.crm.model.PaymentLineItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentLineItemRepository extends JpaRepository<PaymentLineItem, String> {

    // Find all line items for a payment
    List<PaymentLineItem> findByPaymentId(String paymentId);

    // Find line items by assignment
    List<PaymentLineItem> findByAssignmentId(String assignmentId);

    // Find line items by employee
    List<PaymentLineItem> findByEmployeeId(String employeeId);

    // Find line items by employee and payment
    List<PaymentLineItem> findByPaymentIdAndEmployeeId(String paymentId, String employeeId);

    // Check if assignment is already included in a payment
    @Query("SELECT COUNT(pli) > 0 FROM PaymentLineItem pli WHERE pli.assignment.id = :assignmentId")
    boolean existsByAssignmentId(@Param("assignmentId") String assignmentId);

    // Get all line items for assignments in a specific payment
    @Query("SELECT pli FROM PaymentLineItem pli WHERE pli.payment.id = :paymentId ORDER BY pli.employee.name, pli.workActivity.name")
    List<PaymentLineItem> findByPaymentIdOrderedByEmployeeAndActivity(@Param("paymentId") String paymentId);
}

