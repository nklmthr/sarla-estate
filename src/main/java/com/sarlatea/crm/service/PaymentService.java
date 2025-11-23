package com.sarlatea.crm.service;

import com.sarlatea.crm.dto.*;
import com.sarlatea.crm.exception.DataIntegrityException;
import com.sarlatea.crm.exception.ResourceNotFoundException;
import com.sarlatea.crm.model.*;
import com.sarlatea.crm.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentLineItemRepository paymentLineItemRepository;
    private final PaymentDocumentRepository paymentDocumentRepository;
    private final PaymentHistoryRepository paymentHistoryRepository;
    private final WorkAssignmentRepository workAssignmentRepository;
    private final EmployeeSalaryRepository employeeSalaryRepository;
    private final WorkActivityCompletionCriteriaRepository completionCriteriaRepository;

    // ==================== Query Methods ====================

    @Transactional(readOnly = true)
    public List<PaymentDTO> getAllPayments() {
        log.debug("Fetching all payments ordered by status priority");
        return paymentRepository.findAllOrderedByStatusPriority().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PaymentDTO> getPaymentsByStatus(Payment.PaymentStatus status) {
        log.debug("Fetching payments with status: {}", status);
        return paymentRepository.findByStatusOrderByCreatedAtDesc(status).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PaymentDTO getPaymentById(String id) {
        log.debug("Fetching payment with id: {}", id);
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + id));
        return convertToDTOWithDetails(payment);
    }

    @Transactional
    public PaymentDTO updatePayment(String id, PaymentDTO updates, String username) {
        log.debug("Updating payment {} by {}", id, username);
        
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + id));

        // Only allow updates to draft payments
        if (payment.getStatus() != Payment.PaymentStatus.DRAFT) {
            throw new IllegalArgumentException("Only draft payments can be updated");
        }

        boolean hasChanges = false;

        // Update payment title if provided
        if (updates.getPaymentTitle() != null && !updates.getPaymentTitle().equals(payment.getPaymentTitle())) {
            String oldTitle = payment.getPaymentTitle();
            payment.setPaymentTitle(updates.getPaymentTitle());
            hasChanges = true;
            
            createHistoryEntry(payment, PaymentHistory.ChangeType.LINE_ITEM_UPDATED,
                    null, null, username,
                    String.format("Payment title updated from '%s' to '%s'", oldTitle, updates.getPaymentTitle()));
        }

        // Update remarks if provided
        if (updates.getRemarks() != null && !updates.getRemarks().equals(payment.getRemarks())) {
            payment.setRemarks(updates.getRemarks());
            hasChanges = true;
        }

        if (hasChanges) {
            payment.setUpdatedBy(username);
            paymentRepository.save(payment);
        }

        return convertToDTOWithDetails(payment);
    }

    // ==================== Draft Management ====================

    @Transactional
    public PaymentDTO createDraft(CreatePaymentDraftRequest request, String username) {
        log.info("Creating payment draft for {}/{} by {}", request.getPaymentMonth(), request.getPaymentYear(), username);

        // Validate month/year
        if (request.getPaymentMonth() == null || request.getPaymentMonth() < 1 || request.getPaymentMonth() > 12) {
            throw new IllegalArgumentException("Invalid payment month. Must be between 1 and 12");
        }
        if (request.getPaymentYear() == null || request.getPaymentYear() < 2000) {
            throw new IllegalArgumentException("Invalid payment year");
        }

        // Check if draft already exists for this period
        paymentRepository.findByPaymentMonthAndPaymentYearAndStatus(
                request.getPaymentMonth(), 
                request.getPaymentYear(), 
                Payment.PaymentStatus.DRAFT
        ).ifPresent(existing -> {
            throw new DataIntegrityException(
                    "A draft payment already exists for this period. Please edit the existing draft or create payment for a different period.");
        });

        // Create payment
        Payment payment = new Payment();
        payment.setPaymentMonth(request.getPaymentMonth());
        payment.setPaymentYear(request.getPaymentYear());
        payment.setStatus(Payment.PaymentStatus.DRAFT);
        payment.setTotalAmount(BigDecimal.ZERO);
        payment.setRemarks(request.getRemarks());
        payment.setPaymentTitle(generateDefaultPaymentTitle(request.getPaymentMonth(), request.getPaymentYear()));
        payment.setCreatedBy(username);

        Payment savedPayment = paymentRepository.save(payment);

        // Create history entry
        createHistoryEntry(savedPayment, PaymentHistory.ChangeType.CREATED, null, 
                Payment.PaymentStatus.DRAFT, username, "Payment draft created");

        // If specific assignments provided, add them
        if (request.getAssignmentIds() != null && !request.getAssignmentIds().isEmpty()) {
            for (String assignmentId : request.getAssignmentIds()) {
                addLineItemToPayment(savedPayment, assignmentId, username);
            }
            savedPayment.recalculateTotalAmount();
            savedPayment = paymentRepository.save(savedPayment);
        }

        log.info("Payment draft created successfully: {}", savedPayment.getId());
        return convertToDTOWithDetails(savedPayment);
    }

    @Transactional
    public PaymentDTO addLineItem(String paymentId, String assignmentId, String username) {
        log.debug("Adding line item to payment {}: assignment {}", paymentId, assignmentId);

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + paymentId));

        if (payment.getStatus() != Payment.PaymentStatus.DRAFT) {
            throw new IllegalStateException("Can only add line items to draft payments");
        }

        addLineItemToPayment(payment, assignmentId, username);
        payment.recalculateTotalAmount();
        Payment savedPayment = paymentRepository.save(payment);

        createHistoryEntry(savedPayment, PaymentHistory.ChangeType.LINE_ITEM_ADDED, 
                null, null, username, "Added assignment " + assignmentId);

        return convertToDTOWithDetails(savedPayment);
    }

    @Transactional
    public PaymentDTO addLineItemsBatch(String paymentId, List<String> assignmentIds, String username) {
        log.debug("Adding {} line items to payment {}", assignmentIds.size(), paymentId);

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + paymentId));

        if (payment.getStatus() != Payment.PaymentStatus.DRAFT) {
            throw new IllegalStateException("Can only add line items to draft payments");
        }

        // Add all line items in a single transaction
        for (String assignmentId : assignmentIds) {
            addLineItemToPayment(payment, assignmentId, username);
        }
        
        payment.recalculateTotalAmount();
        Payment savedPayment = paymentRepository.save(payment);

        createHistoryEntry(savedPayment, PaymentHistory.ChangeType.LINE_ITEM_ADDED, 
                null, null, username, "Added " + assignmentIds.size() + " assignments in batch");

        log.info("Successfully added {} line items to payment {}", assignmentIds.size(), paymentId);
        return convertToDTOWithDetails(savedPayment);
    }

    private void addLineItemToPayment(Payment payment, String assignmentId, String username) {
        WorkAssignment assignment = workAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + assignmentId));

        // Validate assignment
        if (assignment.getAssignmentStatus() != WorkAssignment.AssignmentStatus.COMPLETED) {
            throw new IllegalStateException("Only completed assignments can be included in payments");
        }

        if (assignment.getPaymentStatus() == WorkAssignment.PaymentStatus.PAID) {
            throw new IllegalStateException("Assignment already paid in another payment");
        }

        // Check if already in a non-cancelled payment
        if (assignment.getIncludedInPaymentId() != null && 
            assignment.getPaymentStatus() != WorkAssignment.PaymentStatus.CANCELLED &&
            assignment.getPaymentStatus() != WorkAssignment.PaymentStatus.UNPAID) {
            throw new IllegalStateException("Assignment already included in payment: " + assignment.getIncludedInPaymentId());
        }

        // Get employee and activity
        Employee employee = assignment.getAssignedEmployee();
        WorkActivity activity = assignment.getWorkActivity();

        if (employee == null || activity == null) {
            throw new IllegalStateException("Assignment must have employee and activity assigned");
        }

        // Get active salary for calculation
        EmployeeSalary activeSalary = employeeSalaryRepository.findCurrentSalaryByEmployeeId(employee.getId())
                .orElseThrow(() -> new IllegalStateException("No active salary found for employee: " + employee.getName()));

        // Calculate payment amounts following the same logic as Payment Report
        // Formula: Amount = (Daily Rate) × (Completion % / 100)
        // Daily Rate is calculated based on salary type (DAILY/WEEKLY/MONTHLY)
        
        BigDecimal dailyRate = activeSalary.calculateDailyRate(); // Use the new method that handles all salary types
        Integer completionPercentage = assignment.getCompletionPercentage() != null ? 
                assignment.getCompletionPercentage() : 0;
        BigDecimal completionRate = BigDecimal.valueOf(completionPercentage).divide(new BigDecimal("100"), 4, java.math.RoundingMode.HALF_UP);
        
        // Quantity = 1 (one day of work)
        BigDecimal quantity = BigDecimal.ONE;
        
        // Rate = Daily Rate (base rate before applying completion percentage)
        BigDecimal rate = dailyRate;
        
        // Amount = Daily Rate × Completion Rate
        BigDecimal amount = dailyRate.multiply(completionRate).setScale(2, java.math.RoundingMode.HALF_UP);
        
        // Calculate PF breakdowns
        BigDecimal employeePfPercentage = new BigDecimal("12.00"); // Mandatory 12%
        BigDecimal voluntaryPfPercentage = activeSalary.getVoluntaryPfPercentage() != null ? 
                activeSalary.getVoluntaryPfPercentage() : BigDecimal.ZERO;
        BigDecimal employerPfPercentage = new BigDecimal("12.00"); // Employer contribution 12%
        
        // Employee PF deduction = Employee PF (12%) + Voluntary PF
        BigDecimal employeePf = amount.multiply(employeePfPercentage).divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);
        BigDecimal voluntaryPf = amount.multiply(voluntaryPfPercentage).divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);
        BigDecimal pfAmount = employeePf.add(voluntaryPf);
        
        BigDecimal otherDeductions = BigDecimal.ZERO;
        
        // Net Amount = Amount - Employee PF - Voluntary PF
        BigDecimal netAmount = amount.subtract(pfAmount).subtract(otherDeductions);

        // Create line item
        PaymentLineItem lineItem = new PaymentLineItem();
        lineItem.setPayment(payment);
        lineItem.setAssignment(assignment);
        lineItem.setEmployee(employee);
        lineItem.setWorkActivity(activity);
        lineItem.setAssignmentDate(assignment.getAssignmentDate());
        lineItem.setQuantity(quantity);
        lineItem.setRate(rate);
        lineItem.setAmount(amount);
        lineItem.setEmployeePf(employeePf);
        lineItem.setVoluntaryPf(voluntaryPf);
        lineItem.setEmployerPf(amount.multiply(employerPfPercentage).divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP));
        lineItem.setPfAmount(pfAmount);
        lineItem.setOtherDeductions(otherDeductions);
        lineItem.setNetAmount(netAmount);

        payment.addLineItem(lineItem);

        // Update assignment status
        assignment.includeInPaymentDraft(payment.getId());
        workAssignmentRepository.save(assignment);
    }

    @Transactional
    public PaymentDTO removeLineItem(String paymentId, String lineItemId, String username) {
        log.debug("Removing line item {} from payment {}", lineItemId, paymentId);

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + paymentId));

        if (payment.getStatus() != Payment.PaymentStatus.DRAFT) {
            throw new IllegalStateException("Can only remove line items from draft payments");
        }

        PaymentLineItem lineItem = paymentLineItemRepository.findById(lineItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Line item not found with id: " + lineItemId));

        if (!lineItem.getPayment().getId().equals(paymentId)) {
            throw new IllegalStateException("Line item does not belong to this payment");
        }

        // Update assignment status back to unpaid
        WorkAssignment assignment = lineItem.getAssignment();
        assignment.setPaymentStatus(WorkAssignment.PaymentStatus.UNPAID);
        assignment.setIncludedInPaymentId(null);
        workAssignmentRepository.save(assignment);

        // Remove line item
        payment.removeLineItem(lineItem);
        paymentLineItemRepository.delete(lineItem);

        payment.recalculateTotalAmount();
        Payment savedPayment = paymentRepository.save(payment);

        createHistoryEntry(savedPayment, PaymentHistory.ChangeType.LINE_ITEM_REMOVED,
                null, null, username, "Removed line item for assignment " + assignment.getId());

        return convertToDTOWithDetails(savedPayment);
    }

    // ==================== Workflow Methods ====================

    @Transactional
    public PaymentDTO submitForApproval(String paymentId, SubmitPaymentRequest request, String username) {
        log.info("Submitting payment {} for approval by {}", paymentId, username);

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + paymentId));

        if (payment.getStatus() != Payment.PaymentStatus.DRAFT) {
            throw new IllegalStateException("Only draft payments can be submitted for approval");
        }

        if (payment.getLineItems().isEmpty()) {
            throw new IllegalStateException("Cannot submit payment without line items");
        }

        // CRITICAL: Lock all assignments and capture snapshots
        for (PaymentLineItem lineItem : payment.getLineItems()) {
            WorkAssignment assignment = lineItem.getAssignment();
            
            // Lock assignment
            assignment.lockForPaymentRequest(payment.getId());
            workAssignmentRepository.save(assignment);

            // Capture snapshot
            captureLineItemSnapshot(lineItem);
            paymentLineItemRepository.save(lineItem);
        }

        // Update payment status
        payment.recalculateTotalAmount();
        payment.setStatus(Payment.PaymentStatus.PENDING_APPROVAL);
        payment.setSubmittedBy(username);
        payment.setSubmittedAt(LocalDateTime.now());
        if (request.getRemarks() != null) {
            payment.setRemarks(payment.getRemarks() != null ? 
                    payment.getRemarks() + "\n" + request.getRemarks() : request.getRemarks());
        }

        Payment savedPayment = paymentRepository.save(payment);

        // Create history entry
        createHistoryEntry(savedPayment, PaymentHistory.ChangeType.SUBMITTED,
                Payment.PaymentStatus.DRAFT, Payment.PaymentStatus.PENDING_APPROVAL,
                username, "Payment submitted for approval. " + payment.getLineItems().size() + " assignments locked.");

        log.info("Payment {} submitted successfully. {} assignments locked", paymentId, payment.getLineItems().size());
        return convertToDTOWithDetails(savedPayment);
    }

    @Transactional
    public PaymentDTO approvePayment(String paymentId, ApprovePaymentRequest request, String username) {
        log.info("Approving payment {} by {}", paymentId, username);

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + paymentId));

        if (payment.getStatus() != Payment.PaymentStatus.PENDING_APPROVAL) {
            throw new IllegalStateException("Only pending payments can be approved");
        }

        // Update payment status
        payment.setStatus(Payment.PaymentStatus.APPROVED);
        payment.setApprovedBy(username);
        payment.setApprovedAt(LocalDateTime.now());

        // Update assignment status
        for (PaymentLineItem lineItem : payment.getLineItems()) {
            WorkAssignment assignment = lineItem.getAssignment();
            assignment.setPaymentStatus(WorkAssignment.PaymentStatus.APPROVED);
            workAssignmentRepository.save(assignment);
        }

        Payment savedPayment = paymentRepository.save(payment);

        createHistoryEntry(savedPayment, PaymentHistory.ChangeType.APPROVED,
                Payment.PaymentStatus.PENDING_APPROVAL, Payment.PaymentStatus.APPROVED,
                username, request.getRemarks());

        log.info("Payment {} approved successfully", paymentId);
        return convertToDTOWithDetails(savedPayment);
    }

    @Transactional
    public PaymentDTO recordPayment(String paymentId, RecordPaymentRequest request, String username) {
        log.info("Recording payment {} by {}", paymentId, username);

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + paymentId));

        if (payment.getStatus() != Payment.PaymentStatus.APPROVED) {
            throw new IllegalStateException("Only approved payments can be recorded as paid");
        }

        if (request.getPaymentDate() == null || request.getReferenceNumber() == null) {
            throw new IllegalArgumentException("Payment date and reference number are required");
        }

        // Update payment
        payment.setStatus(Payment.PaymentStatus.PAID);
        payment.setPaymentDate(request.getPaymentDate());
        payment.setReferenceNumber(request.getReferenceNumber());
        payment.setPaidBy(username);
        payment.setPaidAt(LocalDateTime.now());

        // Update assignment status to PAID
        for (PaymentLineItem lineItem : payment.getLineItems()) {
            WorkAssignment assignment = lineItem.getAssignment();
            assignment.lockForPayment(payment.getId());
            workAssignmentRepository.save(assignment);
        }

        Payment savedPayment = paymentRepository.save(payment);

        createHistoryEntry(savedPayment, PaymentHistory.ChangeType.PAID,
                Payment.PaymentStatus.APPROVED, Payment.PaymentStatus.PAID,
                username, "Payment recorded. Reference: " + request.getReferenceNumber());

        log.info("Payment {} recorded successfully", paymentId);
        return convertToDTOWithDetails(savedPayment);
    }

    @Transactional
    public PaymentDTO cancelPayment(String paymentId, CancelPaymentRequest request, String username) {
        log.info("Cancelling payment {} by {}", paymentId, username);

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + paymentId));

        if (payment.getStatus() == Payment.PaymentStatus.PAID) {
            throw new IllegalStateException("Cannot cancel paid payments");
        }

        if (payment.getStatus() == Payment.PaymentStatus.CANCELLED) {
            throw new IllegalStateException("Payment is already cancelled");
        }

        if (request.getCancellationReason() == null || request.getCancellationReason().trim().isEmpty()) {
            throw new IllegalArgumentException("Cancellation reason is required");
        }

        Payment.PaymentStatus previousStatus = payment.getStatus();

        // CRITICAL: Unlock all assignments
        for (PaymentLineItem lineItem : payment.getLineItems()) {
            WorkAssignment assignment = lineItem.getAssignment();
            assignment.unlockFromCancelledPayment();
            workAssignmentRepository.save(assignment);
        }

        // Update payment status
        payment.setStatus(Payment.PaymentStatus.CANCELLED);
        payment.setCancellationReason(request.getCancellationReason());
        payment.setCancelledBy(username);
        payment.setCancelledAt(LocalDateTime.now());

        Payment savedPayment = paymentRepository.save(payment);

        createHistoryEntry(savedPayment, PaymentHistory.ChangeType.CANCELLED,
                previousStatus, Payment.PaymentStatus.CANCELLED,
                username, "Reason: " + request.getCancellationReason());

        log.info("Payment {} cancelled. {} assignments unlocked", paymentId, payment.getLineItems().size());
        return convertToDTOWithDetails(savedPayment);
    }

    @Transactional
    public void deletePayment(String paymentId, String username) {
        log.info("Deleting payment {} by {}", paymentId, username);

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + paymentId));

        // Only allow deletion of DRAFT payments
        if (payment.getStatus() != Payment.PaymentStatus.DRAFT) {
            throw new IllegalStateException("Only DRAFT payments can be deleted. Use cancel for other statuses.");
        }

        // Unlock all assignments
        for (PaymentLineItem lineItem : payment.getLineItems()) {
            WorkAssignment assignment = lineItem.getAssignment();
            assignment.unlockFromCancelledPayment();
            workAssignmentRepository.save(assignment);
        }

        // Delete the payment (cascade will handle line items, documents, and history)
        paymentRepository.delete(payment);

        log.info("Payment {} deleted. {} assignments unlocked", paymentId, payment.getLineItems().size());
    }

    // ==================== Document Management ====================

    @Transactional
    public PaymentDTO uploadDocument(String paymentId, MultipartFile file, String documentType, 
                                     String description, String username) throws IOException {
        log.debug("Uploading document to payment {}", paymentId);

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + paymentId));

        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        if (file.getSize() > 10 * 1024 * 1024) { // 10MB limit
            throw new IllegalArgumentException("File size must not exceed 10MB");
        }

        PaymentDocument document = new PaymentDocument();
        document.setPayment(payment);
        document.setFileName(file.getOriginalFilename());
        document.setFileType(file.getContentType());
        document.setFileSize(file.getSize());
        document.setFileData(file.getBytes());
        document.setDocumentType(documentType);
        document.setDescription(description);
        document.setUploadedBy(username);
        document.setUploadedAt(LocalDateTime.now());

        payment.addDocument(document);
        paymentRepository.save(payment);

        createHistoryEntry(payment, PaymentHistory.ChangeType.DOCUMENT_ADDED,
                null, null, username, "Uploaded document: " + file.getOriginalFilename());

        log.info("Document uploaded to payment {}: {}", paymentId, file.getOriginalFilename());
        return convertToDTOWithDetails(payment);
    }

    @Transactional(readOnly = true)
    public byte[] downloadDocument(String paymentId, String documentId) {
        log.debug("Downloading document {} from payment {}", documentId, paymentId);

        PaymentDocument document = paymentDocumentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with id: " + documentId));

        if (!document.getPayment().getId().equals(paymentId)) {
            throw new IllegalStateException("Document does not belong to this payment");
        }

        return document.getFileData();
    }

    // ==================== History ====================

    @Transactional(readOnly = true)
    public List<PaymentHistoryDTO> getPaymentHistory(String paymentId) {
        log.debug("Fetching history for payment {}", paymentId);
        
        paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + paymentId));

        return paymentHistoryRepository.findByPaymentIdOrderByChangedAtDesc(paymentId).stream()
                .map(this::convertHistoryToDTO)
                .collect(Collectors.toList());
    }

    // ==================== Helper Methods ====================

    private void captureLineItemSnapshot(PaymentLineItem lineItem) {
        // Capture basic snapshot from assignment/employee/activity
        lineItem.captureSnapshot();

        // Get active salary
        EmployeeSalary activeSalary = employeeSalaryRepository
                .findCurrentSalaryByEmployeeId(lineItem.getEmployee().getId())
                .orElse(null);

        if (activeSalary != null) {
            // EmployeeSalary uses 'amount' field and 'voluntaryPfPercentage'
            // Note: For snapshot, we store base amount, no DA field in EmployeeSalary
            BigDecimal mandatoryPfPercentage = new BigDecimal("12.00"); // Standard 12%
            lineItem.captureSalarySnapshot(
                    activeSalary.getAmount(), // Base salary
                    BigDecimal.ZERO, // No DA percentage in current model
                    mandatoryPfPercentage.add(activeSalary.getVoluntaryPfPercentage()), // Total employee PF %
                    activeSalary.getVoluntaryPfPercentage() // Voluntary PF only
            );
        }

        // Get active completion criteria
        WorkActivityCompletionCriteria criteria = completionCriteriaRepository
                .findActiveByWorkActivityId(lineItem.getWorkActivity().getId())
                .orElse(null);

        if (criteria != null) {
            // WorkActivityCompletionCriteria uses 'unit' and 'value' fields
            lineItem.captureCriteriaSnapshot(
                    "UNIT_BASED", // Simplified criteria type
                    criteria.getValue(), // Unit rate/value
                    criteria.getUnit(), // Unit of measure
                    BigDecimal.ZERO // No salary percentage in current model
            );
        }
    }

    private void createHistoryEntry(Payment payment, PaymentHistory.ChangeType changeType,
                                   Payment.PaymentStatus previousStatus, Payment.PaymentStatus newStatus,
                                   String changedBy, String remarks) {
        PaymentHistory history = new PaymentHistory();
        history.setPayment(payment);
        history.setChangeType(changeType);
        history.setPreviousStatus(previousStatus);
        history.setNewStatus(newStatus);
        history.setChangedBy(changedBy);
        history.setChangedAt(LocalDateTime.now());
        history.setRemarks(remarks);

        if (previousStatus != null && newStatus != null) {
            history.setPreviousAmount(payment.getTotalAmount());
            history.setNewAmount(payment.getTotalAmount());
        }

        payment.addHistory(history);
    }

    // ==================== Conversion Methods ====================

    private PaymentDTO convertToDTO(Payment payment) {
        PaymentDTO dto = new PaymentDTO();
        dto.setId(payment.getId());
        dto.setPaymentDate(payment.getPaymentDate());
        dto.setPaymentTitle(payment.getPaymentTitle());
        dto.setStatus(payment.getStatus());
        dto.setTotalAmount(payment.getTotalAmount());
        dto.setPaymentMonth(payment.getPaymentMonth());
        dto.setPaymentYear(payment.getPaymentYear());
        dto.setReferenceNumber(payment.getReferenceNumber());
        dto.setRemarks(payment.getRemarks());
        dto.setApprovedBy(payment.getApprovedBy());
        dto.setApprovedAt(payment.getApprovedAt());
        dto.setPaidBy(payment.getPaidBy());
        dto.setPaidAt(payment.getPaidAt());
        dto.setSubmittedBy(payment.getSubmittedBy());
        dto.setSubmittedAt(payment.getSubmittedAt());
        dto.setCancelledBy(payment.getCancelledBy());
        dto.setCancelledAt(payment.getCancelledAt());
        dto.setCancellationReason(payment.getCancellationReason());
        dto.setCreatedBy(payment.getCreatedBy());
        dto.setCreatedAt(payment.getCreatedAt());
        dto.setUpdatedBy(payment.getUpdatedBy());
        dto.setUpdatedAt(payment.getUpdatedAt());
        dto.setLineItemCount(payment.getLineItems() != null ? payment.getLineItems().size() : 0);
        dto.setDocumentCount(payment.getDocuments() != null ? payment.getDocuments().size() : 0);
        return dto;
    }

    private PaymentDTO convertToDTOWithDetails(Payment payment) {
        PaymentDTO dto = convertToDTO(payment);
        
        if (payment.getLineItems() != null) {
            dto.setLineItems(payment.getLineItems().stream()
                    .map(this::convertLineItemToDTO)
                    .collect(Collectors.toList()));
        }

        if (payment.getDocuments() != null) {
            dto.setDocuments(payment.getDocuments().stream()
                    .map(this::convertDocumentToDTO)
                    .collect(Collectors.toList()));
        }

        return dto;
    }

    private PaymentLineItemDTO convertLineItemToDTO(PaymentLineItem lineItem) {
        PaymentLineItemDTO dto = new PaymentLineItemDTO();
        dto.setId(lineItem.getId());
        dto.setPaymentId(lineItem.getPayment().getId());
        dto.setAssignmentId(lineItem.getAssignment().getId());
        dto.setEmployeeId(lineItem.getEmployee().getId());
        dto.setEmployeeName(lineItem.getEmployee().getName());
        dto.setWorkActivityId(lineItem.getWorkActivity().getId());
        dto.setWorkActivityName(lineItem.getWorkActivity().getName());
        dto.setAssignmentDate(lineItem.getAssignmentDate());
        dto.setQuantity(lineItem.getQuantity());
        dto.setRate(lineItem.getRate());
        dto.setAmount(lineItem.getAmount());
        dto.setEmployeePf(lineItem.getEmployeePf());
        dto.setVoluntaryPf(lineItem.getVoluntaryPf());
        dto.setEmployerPf(lineItem.getEmployerPf());
        dto.setPfAmount(lineItem.getPfAmount());
        dto.setOtherDeductions(lineItem.getOtherDeductions());
        dto.setNetAmount(lineItem.getNetAmount());
        dto.setRemarks(lineItem.getRemarks());
        
        // Include snapshot data
        dto.setSnapshotEmployeeName(lineItem.getSnapshotEmployeeName());
        dto.setSnapshotEmployeePhone(lineItem.getSnapshotEmployeePhone());
        dto.setSnapshotPfAccountId(lineItem.getSnapshotPfAccountId());
        dto.setSnapshotBasicSalary(lineItem.getSnapshotBasicSalary());
        dto.setSnapshotDaPercentage(lineItem.getSnapshotDaPercentage());
        dto.setSnapshotEmployeePfPercentage(lineItem.getSnapshotEmployeePfPercentage());
        dto.setSnapshotVoluntaryPfAmount(lineItem.getSnapshotVoluntaryPfAmount());
        dto.setSnapshotActivityName(lineItem.getSnapshotActivityName());
        dto.setSnapshotActivityDescription(lineItem.getSnapshotActivityDescription());
        dto.setSnapshotCriteriaType(lineItem.getSnapshotCriteriaType());
        dto.setSnapshotUnitRate(lineItem.getSnapshotUnitRate());
        dto.setSnapshotUnitOfMeasure(lineItem.getSnapshotUnitOfMeasure());
        dto.setSnapshotSalaryPercentage(lineItem.getSnapshotSalaryPercentage());
        dto.setSnapshotActualDurationHours(lineItem.getSnapshotActualDurationHours());
        dto.setSnapshotCompletionPercentage(lineItem.getSnapshotCompletionPercentage());
        dto.setSnapshotActualValue(lineItem.getSnapshotActualValue());
        dto.setSnapshotCompletedDate(lineItem.getSnapshotCompletedDate());
        dto.setSnapshotEvaluationNotes(lineItem.getSnapshotEvaluationNotes());
        
        // Include actual assignment data (for DRAFT status)
        if (lineItem.getAssignment() != null) {
            dto.setCompletionPercentage(lineItem.getAssignment().getCompletionPercentage());
        }
        
        return dto;
    }

    private PaymentDocumentDTO convertDocumentToDTO(PaymentDocument document) {
        PaymentDocumentDTO dto = new PaymentDocumentDTO();
        dto.setId(document.getId());
        dto.setPaymentId(document.getPayment().getId());
        dto.setFileName(document.getFileName());
        dto.setFileType(document.getFileType());
        dto.setFileSize(document.getFileSize());
        dto.setDocumentType(document.getDocumentType());
        dto.setDescription(document.getDescription());
        dto.setUploadedBy(document.getUploadedBy());
        dto.setUploadedAt(document.getUploadedAt());
        return dto;
    }

    private PaymentHistoryDTO convertHistoryToDTO(PaymentHistory history) {
        PaymentHistoryDTO dto = new PaymentHistoryDTO();
        dto.setId(history.getId());
        dto.setPaymentId(history.getPayment().getId());
        dto.setChangeType(history.getChangeType());
        dto.setChangeDescription(history.getChangeDescription());
        dto.setPreviousAmount(history.getPreviousAmount());
        dto.setNewAmount(history.getNewAmount());
        dto.setPreviousStatus(history.getPreviousStatus());
        dto.setNewStatus(history.getNewStatus());
        dto.setChangedBy(history.getChangedBy());
        dto.setChangedAt(history.getChangedAt());
        dto.setRemarks(history.getRemarks());
        return dto;
    }

    /**
     * Generate a default payment title based on month and year
     * Format: "Payments for Week ending DD-DD MMM YYYY"
     */
    private String generateDefaultPaymentTitle(Integer month, Integer year) {
        LocalDate firstDayOfMonth = LocalDate.of(year, month, 1);
        LocalDate lastDayOfMonth = firstDayOfMonth.withDayOfMonth(firstDayOfMonth.lengthOfMonth());
        
        // Find the last Sunday of the month
        LocalDate lastSunday = lastDayOfMonth;
        while (lastSunday.getDayOfWeek() != java.time.DayOfWeek.SUNDAY) {
            lastSunday = lastSunday.minusDays(1);
        }
        
        // Calculate the week range (Monday to Sunday)
        LocalDate weekStart = lastSunday.minusDays(6);
        
        DateTimeFormatter dayFormatter = DateTimeFormatter.ofPattern("dd");
        DateTimeFormatter monthYearFormatter = DateTimeFormatter.ofPattern("MMM yyyy");
        
        return String.format("Payments for Week ending %s-%s %s",
                weekStart.format(dayFormatter),
                lastSunday.format(dayFormatter),
                lastSunday.format(monthYearFormatter));
    }
}

