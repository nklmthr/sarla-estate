package com.sarlatea.crm.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentDocumentDTO {
    private String id;
    private String paymentId;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private String documentType;
    private String description;
    private String uploadedBy;
    private LocalDateTime uploadedAt;
    // Note: fileData (byte[]) is NOT included in DTO for list views
}

