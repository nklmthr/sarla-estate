package com.sarlatea.crm.repository;

import com.sarlatea.crm.model.PaymentHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentHistoryRepository extends JpaRepository<PaymentHistory, String> {

    // Find all history entries for a payment, ordered by date descending
    List<PaymentHistory> findByPaymentIdOrderByChangedAtDesc(String paymentId);

    // Find history entries by change type
    List<PaymentHistory> findByPaymentIdAndChangeType(String paymentId, PaymentHistory.ChangeType changeType);

    // Find recent history entries
    List<PaymentHistory> findTop10ByPaymentIdOrderByChangedAtDesc(String paymentId);
}

