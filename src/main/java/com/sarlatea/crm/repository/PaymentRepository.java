package com.sarlatea.crm.repository;

import com.sarlatea.crm.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, String> {

    // Find payments by status
    List<Payment> findByStatus(Payment.PaymentStatus status);

    // Find payments by status ordered by created date desc
    List<Payment> findByStatusOrderByCreatedAtDesc(Payment.PaymentStatus status);

    // Find payments by month and year
    List<Payment> findByPaymentMonthAndPaymentYear(Integer month, Integer year);

    // Find draft payment for a specific month/year (should be only one)
    Optional<Payment> findByPaymentMonthAndPaymentYearAndStatus(
            Integer month, Integer year, Payment.PaymentStatus status);

    // Find all payments within date range
    @Query("SELECT p FROM Payment p WHERE p.paymentDate BETWEEN :startDate AND :endDate ORDER BY p.paymentDate DESC")
    List<Payment> findPaymentsBetweenDates(
            @Param("startDate") java.time.LocalDate startDate,
            @Param("endDate") java.time.LocalDate endDate);

    // Find payments by created date range
    @Query("SELECT p FROM Payment p WHERE p.createdAt BETWEEN :startDate AND :endDate ORDER BY p.createdAt DESC")
    List<Payment> findByCreatedAtBetween(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    // Get all payments ordered by payment date descending
    List<Payment> findAllByOrderByPaymentDateDesc();

    // Find payments by reference number
    Optional<Payment> findByReferenceNumber(String referenceNumber);
}

