package com.sarlatea.crm.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "payment_documents")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id", nullable = false)
    private Payment payment;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "file_type")
    private String fileType;

    @Column(name = "file_size")
    private Long fileSize;

    @Lob
    @Column(name = "file_data", columnDefinition = "LONGBLOB")
    private byte[] fileData;

    @Column(name = "document_type")
    private String documentType; // e.g., "CHALLAN", "RECEIPT", "BANK_STATEMENT", "OTHER"

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "uploaded_by")
    private String uploadedBy;

    @CreationTimestamp
    @Column(name = "uploaded_at", updatable = false)
    private LocalDateTime uploadedAt;
}

