package com.sarlatea.crm.controller;

import com.sarlatea.crm.dto.*;
import com.sarlatea.crm.model.Payment;
import com.sarlatea.crm.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001" }, allowedHeaders = "*", methods = {
        RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS },
        allowCredentials = "true")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PaymentService paymentService;

    // ==================== Query Endpoints ====================

    @GetMapping
    @PreAuthorize("hasPermission('PAYMENT', 'VIEW')")
    public ResponseEntity<List<PaymentDTO>> getAllPayments(
            @RequestParam(required = false) Payment.PaymentStatus status) {
        log.info("GET request to fetch all payments" + (status != null ? " with status: " + status : ""));

        List<PaymentDTO> payments = status != null ?
                paymentService.getPaymentsByStatus(status) :
                paymentService.getAllPayments();

        return ResponseEntity.ok(payments);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission('PAYMENT', 'VIEW')")
    public ResponseEntity<PaymentDTO> getPaymentById(@PathVariable String id) {
        log.info("GET request to fetch payment with id: {}", id);
        PaymentDTO payment = paymentService.getPaymentById(id);
        return ResponseEntity.ok(payment);
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("hasPermission('PAYMENT', 'VIEW')")
    public ResponseEntity<List<PaymentHistoryDTO>> getPaymentHistory(@PathVariable String id) {
        log.info("GET request to fetch payment history for payment: {}", id);
        List<PaymentHistoryDTO> history = paymentService.getPaymentHistory(id);
        return ResponseEntity.ok(history);
    }

    // ==================== Draft Management ====================

    @PostMapping("/draft")
    @PreAuthorize("hasPermission('PAYMENT', 'CREATE')")
    public ResponseEntity<PaymentDTO> createDraft(@RequestBody CreatePaymentDraftRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        log.info("POST request to create payment draft by: {}", username);

        PaymentDTO payment = paymentService.createDraft(request, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(payment);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasPermission('PAYMENT', 'EDIT')")
    public ResponseEntity<PaymentDTO> updateDraft(
            @PathVariable String id,
            @RequestBody PaymentDTO updates) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        log.info("PUT request to update payment {} by: {}", id, username);

        // For now, we'll just return the current payment
        // Full update logic can be added as needed
        PaymentDTO payment = paymentService.getPaymentById(id);
        return ResponseEntity.ok(payment);
    }

    // ==================== Line Item Management ====================

    @PostMapping("/{id}/line-items")
    @PreAuthorize("hasPermission('PAYMENT', 'EDIT')")
    public ResponseEntity<PaymentDTO> addLineItem(
            @PathVariable String id,
            @RequestBody AddLineItemRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        log.info("POST request to add line item to payment {} by: {}", id, username);

        PaymentDTO payment = paymentService.addLineItem(id, request.getAssignmentId(), username);
        return ResponseEntity.ok(payment);
    }

    @PostMapping("/{id}/line-items/batch")
    @PreAuthorize("hasPermission('PAYMENT', 'EDIT')")
    public ResponseEntity<PaymentDTO> addLineItemsBatch(
            @PathVariable String id,
            @RequestBody AddLineItemsBatchRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        log.info("POST request to add {} line items to payment {} by: {}", 
                request.getAssignmentIds().size(), id, username);

        PaymentDTO payment = paymentService.addLineItemsBatch(id, request.getAssignmentIds(), username);
        return ResponseEntity.ok(payment);
    }

    @DeleteMapping("/{id}/line-items/{lineItemId}")
    @PreAuthorize("hasPermission('PAYMENT', 'EDIT')")
    public ResponseEntity<PaymentDTO> removeLineItem(
            @PathVariable String id,
            @PathVariable String lineItemId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        log.info("DELETE request to remove line item {} from payment {} by: {}", lineItemId, id, username);

        PaymentDTO payment = paymentService.removeLineItem(id, lineItemId, username);
        return ResponseEntity.ok(payment);
    }

    // ==================== Workflow Endpoints ====================

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasPermission('PAYMENT', 'EDIT')")
    public ResponseEntity<PaymentDTO> submitForApproval(
            @PathVariable String id,
            @RequestBody SubmitPaymentRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        log.info("POST request to submit payment {} for approval by: {}", id, username);

        PaymentDTO payment = paymentService.submitForApproval(id, request, username);
        return ResponseEntity.ok(payment);
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasPermission('PAYMENT', 'APPROVE')")
    public ResponseEntity<PaymentDTO> approvePayment(
            @PathVariable String id,
            @RequestBody ApprovePaymentRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        log.info("POST request to approve payment {} by: {}", id, username);

        PaymentDTO payment = paymentService.approvePayment(id, request, username);
        return ResponseEntity.ok(payment);
    }

    @PostMapping("/{id}/record-payment")
    @PreAuthorize("hasPermission('PAYMENT', 'EDIT')")
    public ResponseEntity<PaymentDTO> recordPayment(
            @PathVariable String id,
            @RequestBody RecordPaymentRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        log.info("POST request to record payment {} by: {}", id, username);

        PaymentDTO payment = paymentService.recordPayment(id, request, username);
        return ResponseEntity.ok(payment);
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasPermission('PAYMENT', 'EDIT')")
    public ResponseEntity<PaymentDTO> cancelPayment(
            @PathVariable String id,
            @RequestBody CancelPaymentRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        log.info("POST request to cancel payment {} by: {}", id, username);

        PaymentDTO payment = paymentService.cancelPayment(id, request, username);
        return ResponseEntity.ok(payment);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission('PAYMENT', 'DELETE')")
    public ResponseEntity<Void> deletePayment(@PathVariable String id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        log.info("DELETE request for payment {} by: {}", id, username);

        paymentService.deletePayment(id, username);
        return ResponseEntity.noContent().build();
    }

    // ==================== Document Management ====================

    @PostMapping("/{id}/documents")
    @PreAuthorize("hasPermission('PAYMENT', 'EDIT')")
    public ResponseEntity<PaymentDTO> uploadDocument(
            @PathVariable String id,
            @RequestParam("file") MultipartFile file,
            @RequestParam("documentType") String documentType,
            @RequestParam(value = "description", required = false) String description) throws IOException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        log.info("POST request to upload document to payment {} by: {}", id, username);

        PaymentDTO payment = paymentService.uploadDocument(id, file, documentType, description, username);
        return ResponseEntity.ok(payment);
    }

    @GetMapping("/{id}/documents/{documentId}")
    @PreAuthorize("hasPermission('PAYMENT', 'VIEW')")
    public ResponseEntity<byte[]> downloadDocument(
            @PathVariable String id,
            @PathVariable String documentId) {
        log.info("GET request to download document {} from payment {}", documentId, id);

        byte[] documentData = paymentService.downloadDocument(id, documentId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDispositionFormData("attachment", "document");

        return ResponseEntity.ok()
                .headers(headers)
                .body(documentData);
    }

    // ==================== Helper DTOs ====================

    public static class AddLineItemRequest {
        private String assignmentId;

        public String getAssignmentId() {
            return assignmentId;
        }

        public void setAssignmentId(String assignmentId) {
            this.assignmentId = assignmentId;
        }
    }

    public static class AddLineItemsBatchRequest {
        private List<String> assignmentIds;

        public List<String> getAssignmentIds() {
            return assignmentIds;
        }

        public void setAssignmentIds(List<String> assignmentIds) {
            this.assignmentIds = assignmentIds;
        }
    }
}

