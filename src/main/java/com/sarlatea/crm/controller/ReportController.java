package com.sarlatea.crm.controller;

import com.sarlatea.crm.dto.AssignmentAuditReportDTO;
import com.sarlatea.crm.dto.PaymentReportDTO;
import com.sarlatea.crm.dto.PfReportDTO;
import com.sarlatea.crm.dto.PfReportRequestDTO;
import com.sarlatea.crm.dto.UpcomingAssignmentsReportDTO;
import com.sarlatea.crm.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 * REST controller for Reports
 */
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Slf4j
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/upcoming-assignments")
    @PreAuthorize("hasPermission('REPORT', 'GENERATE_ASSIGNMENT')")
    public ResponseEntity<UpcomingAssignmentsReportDTO> getUpcomingAssignmentsReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        log.info("GET request for upcoming assignments report from {} to {}", startDate, endDate);
        UpcomingAssignmentsReportDTO report = reportService.generateUpcomingAssignmentsReport(startDate, endDate);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/upcoming-assignments/next-week")
    @PreAuthorize("hasPermission('REPORT', 'GENERATE_ASSIGNMENT')")
    public ResponseEntity<UpcomingAssignmentsReportDTO> getNextWeekAssignments() {
        LocalDate today = LocalDate.now();
        LocalDate nextWeek = today.plusWeeks(1);
        
        log.info("GET request for next week assignments report");
        UpcomingAssignmentsReportDTO report = reportService.generateUpcomingAssignmentsReport(today, nextWeek);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/upcoming-assignments/next-month")
    @PreAuthorize("hasPermission('REPORT', 'GENERATE_ASSIGNMENT')")
    public ResponseEntity<UpcomingAssignmentsReportDTO> getNextMonthAssignments() {
        LocalDate today = LocalDate.now();
        LocalDate nextMonth = today.plusMonths(1);
        
        log.info("GET request for next month assignments report");
        UpcomingAssignmentsReportDTO report = reportService.generateUpcomingAssignmentsReport(today, nextMonth);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/payments")
    @PreAuthorize("hasPermission('REPORT', 'GENERATE_PAYMENT')")
    public ResponseEntity<PaymentReportDTO> getPaymentReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        log.info("GET request for payment report from {} to {}", startDate, endDate);
        PaymentReportDTO report = reportService.generatePaymentReport(startDate, endDate);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/payments/current-month")
    @PreAuthorize("hasPermission('REPORT', 'GENERATE_PAYMENT')")
    public ResponseEntity<PaymentReportDTO> getCurrentMonthPaymentReport() {
        LocalDate today = LocalDate.now();
        LocalDate startOfMonth = today.withDayOfMonth(1);
        LocalDate endOfMonth = today.withDayOfMonth(today.lengthOfMonth());
        
        log.info("GET request for current month payment report");
        PaymentReportDTO report = reportService.generatePaymentReport(startOfMonth, endOfMonth);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/payments/last-month")
    @PreAuthorize("hasPermission('REPORT', 'GENERATE_PAYMENT')")
    public ResponseEntity<PaymentReportDTO> getLastMonthPaymentReport() {
        LocalDate today = LocalDate.now();
        LocalDate startOfLastMonth = today.minusMonths(1).withDayOfMonth(1);
        LocalDate endOfLastMonth = today.minusMonths(1).withDayOfMonth(
                today.minusMonths(1).lengthOfMonth());
        
        log.info("GET request for last month payment report");
        PaymentReportDTO report = reportService.generatePaymentReport(startOfLastMonth, endOfLastMonth);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/payments/last-week")
    @PreAuthorize("hasPermission('REPORT', 'GENERATE_PAYMENT')")
    public ResponseEntity<PaymentReportDTO> getLastWeekPaymentReport() {
        LocalDate today = LocalDate.now();
        LocalDate lastWeekStart = today.minusWeeks(1);
        
        log.info("GET request for last week payment report");
        PaymentReportDTO report = reportService.generatePaymentReport(lastWeekStart, today);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/assignment-audit")
    @PreAuthorize("hasPermission('REPORT', 'GENERATE_ASSIGNMENT')")
    public ResponseEntity<AssignmentAuditReportDTO> getAssignmentAuditReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        log.info("GET request for assignment audit report from {} to {}", startDate, endDate);
        AssignmentAuditReportDTO report = reportService.generateAssignmentAuditReport(startDate, endDate);
        return ResponseEntity.ok(report);
    }

    @PostMapping("/pf-report")
    @PreAuthorize("hasPermission('REPORT', 'GENERATE_PAYMENT')")
    public ResponseEntity<PfReportDTO> getPfReport(@RequestBody PfReportRequestDTO request) {
        log.info("POST request for PF report for month {} year {}", request.getMonth(), request.getYear());
        PfReportDTO report = reportService.generatePfReport(request);
        return ResponseEntity.ok(report);
    }
    
    @GetMapping("/debug/payments")
    @PreAuthorize("hasPermission('REPORT', 'GENERATE_PAYMENT')")
    public ResponseEntity<String> debugPayments() {
        log.info("GET request for payment debug info");
        StringBuilder debug = new StringBuilder();
        
        java.util.List<com.sarlatea.crm.model.Payment> allPayments = reportService.getAllPayments();
        debug.append("Total payments in database: ").append(allPayments.size()).append("\n\n");
        
        for (com.sarlatea.crm.model.Payment p : allPayments) {
            debug.append("Payment ID: ").append(p.getId().substring(0, Math.min(8, p.getId().length()))).append("\n");
            debug.append("  Status: ").append(p.getStatus()).append("\n");
            debug.append("  Month: ").append(p.getPaymentMonth()).append("\n");
            debug.append("  Year: ").append(p.getPaymentYear()).append("\n");
            debug.append("  Line Items: ").append(p.getLineItems() != null ? p.getLineItems().size() : 0).append("\n\n");
        }
        
        return ResponseEntity.ok(debug.toString());
    }
}

