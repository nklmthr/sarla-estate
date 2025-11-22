package com.sarlatea.crm.repository;

import com.sarlatea.crm.model.PaymentDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentDocumentRepository extends JpaRepository<PaymentDocument, String> {

    // Find all documents for a payment
    List<PaymentDocument> findByPaymentId(String paymentId);

    // Find documents by type
    List<PaymentDocument> findByPaymentIdAndDocumentType(String paymentId, String documentType);

    // Count documents for a payment
    long countByPaymentId(String paymentId);
}

