package com.sarlatea.crm.service;

import com.sarlatea.crm.dto.PaymentReportDTO;
import com.sarlatea.crm.dto.UpcomingAssignmentsReportDTO;
import com.sarlatea.crm.model.Employee;
import com.sarlatea.crm.model.EmployeeSalary;
import com.sarlatea.crm.model.WorkAssignment;
import com.sarlatea.crm.repository.EmployeeRepository;
import com.sarlatea.crm.repository.EmployeeSalaryRepository;
import com.sarlatea.crm.repository.WorkAssignmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for generating reports
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReportService {

    private final WorkAssignmentRepository workAssignmentRepository;
    private final EmployeeSalaryRepository salaryRepository;
    private final EmployeeRepository employeeRepository;

    @Transactional(readOnly = true)
    public UpcomingAssignmentsReportDTO generateUpcomingAssignmentsReport(
            LocalDate startDate, LocalDate endDate) {
        
        log.info("Generating upcoming assignments report from {} to {}", startDate, endDate);

        List<WorkAssignment> assignments = workAssignmentRepository
                .findByAssignmentDateBetweenAndDeletedFalse(startDate, endDate);

        UpcomingAssignmentsReportDTO report = new UpcomingAssignmentsReportDTO();
        report.setReportGeneratedDate(LocalDate.now());
        report.setStartDate(startDate);
        report.setEndDate(endDate);
        report.setTotalAssignments(assignments.size());

        // Count assignments by status
        long completedCount = assignments.stream()
                .filter(a -> a.getAssignmentStatus() == WorkAssignment.AssignmentStatus.COMPLETED)
                .count();
        long inProgressCount = assignments.stream()
                .filter(a -> a.getAssignmentStatus() == WorkAssignment.AssignmentStatus.IN_PROGRESS)
                .count();

        report.setUnassignedCount(0); // No longer used
        report.setAssignedCount(assignments.size());

        List<UpcomingAssignmentsReportDTO.AssignmentSummary> summaries = assignments.stream()
                .map(this::convertToAssignmentSummary)
                .collect(Collectors.toList());

        report.setAssignments(summaries);

        log.info("Report generated with {} assignments ({} completed, {} in-progress)", 
                assignments.size(), completedCount, inProgressCount);

        return report;
    }

    @Transactional(readOnly = true)
    public PaymentReportDTO generatePaymentReport(LocalDate startDate, LocalDate endDate) {
        
        log.info("Generating payment report from {} to {}", startDate, endDate);

        // Get all non-deleted completed or in-progress assignments in the period
        List<WorkAssignment> assignments = workAssignmentRepository
                .findByAssignmentDateBetweenAndDeletedFalse(startDate, endDate).stream()
                .filter(a -> a.getAssignmentStatus() == WorkAssignment.AssignmentStatus.COMPLETED ||
                            a.getAssignmentStatus() == WorkAssignment.AssignmentStatus.IN_PROGRESS)
                .collect(Collectors.toList());

        // Group assignments by employee
        Map<String, List<WorkAssignment>> assignmentsByEmployee = assignments.stream()
                .filter(a -> a.getAssignedEmployee() != null)
                .collect(Collectors.groupingBy(a -> a.getAssignedEmployee().getId()));

        PaymentReportDTO report = new PaymentReportDTO();
        report.setReportGeneratedDate(LocalDate.now());
        report.setPeriodStartDate(startDate);
        report.setPeriodEndDate(endDate);
        report.setTotalEmployees(assignmentsByEmployee.size());
        report.setCurrency("INR");

        List<PaymentReportDTO.EmployeePaymentSummary> employeePayments = new ArrayList<>();
        BigDecimal totalPayment = BigDecimal.ZERO;

        for (Map.Entry<String, List<WorkAssignment>> entry : assignmentsByEmployee.entrySet()) {
            String employeeId = entry.getKey();
            List<WorkAssignment> employeeAssignments = entry.getValue();

            PaymentReportDTO.EmployeePaymentSummary summary = 
                    calculateEmployeePayment(employeeId, employeeAssignments, startDate, endDate);
            
            employeePayments.add(summary);
            totalPayment = totalPayment.add(summary.getCalculatedPayment());
        }

        report.setEmployeePayments(employeePayments);
        report.setTotalPaymentAmount(totalPayment);

        log.info("Payment report generated for {} employees with total payment: {} {}", 
                assignmentsByEmployee.size(), totalPayment, report.getCurrency());

        return report;
    }

    private PaymentReportDTO.EmployeePaymentSummary calculateEmployeePayment(
            String employeeId, List<WorkAssignment> assignments, 
            LocalDate periodStart, LocalDate periodEnd) {

        Employee employee = employeeRepository.findById(employeeId).orElse(null);
        if (employee == null) {
            log.warn("Employee not found: {}", employeeId);
            return createEmptyPaymentSummary(employeeId);
        }

        // Get employee's salary (use salary on period end date)
        EmployeeSalary salary = salaryRepository
                .findSalaryForEmployeeOnDate(employeeId, periodEnd)
                .orElse(null);

        if (salary == null) {
            log.warn("No salary found for employee {} on date {}", employeeId, periodEnd);
            return createEmptyPaymentSummary(employeeId, employee.getName());
        }

        PaymentReportDTO.EmployeePaymentSummary summary = new PaymentReportDTO.EmployeePaymentSummary();
        summary.setEmployeeId(employeeId);
        summary.setEmployeeName(employee.getName());
        summary.setBaseSalary(salary.getAmount());
        summary.setCurrency(salary.getCurrency());
        summary.setTotalAssignments(assignments.size());

        // Calculate statistics
        long completedCount = assignments.stream()
                .filter(a -> a.getAssignmentStatus() == WorkAssignment.AssignmentStatus.COMPLETED)
                .count();
        summary.setCompletedAssignments((int) completedCount);

        double totalEstimatedHours = assignments.size() * 8.0;  // Default to 8 hours per assignment
        summary.setTotalEstimatedHours(totalEstimatedHours);

        double totalActualHours = assignments.stream()
                .mapToDouble(a -> a.getActualDurationHours() != null ? a.getActualDurationHours() : 0.0)
                .sum();
        summary.setTotalActualHours(totalActualHours);

        int avgCompletion = (int) assignments.stream()
                .mapToInt(a -> a.getCompletionPercentage() != null ? a.getCompletionPercentage() : 0)
                .average()
                .orElse(0.0);
        summary.setAverageCompletionPercentage(avgCompletion);

        // Calculate payment based on salary type and completion
        BigDecimal calculatedPayment = calculatePaymentAmount(salary, assignments, periodStart, periodEnd);
        summary.setCalculatedPayment(calculatedPayment);

        // Add assignment details
        List<PaymentReportDTO.AssignmentDetail> details = assignments.stream()
                .map(a -> createAssignmentDetail(a, salary))
                .collect(Collectors.toList());
        summary.setAssignments(details);

        summary.setPaymentNotes(String.format(
                "Based on base salary of %s %s. Average completion: %d%%",
                salary.getAmount(), salary.getCurrency(), avgCompletion
        ));

        return summary;
    }

    private BigDecimal calculatePaymentAmount(EmployeeSalary salary, List<WorkAssignment> assignments,
                                               LocalDate periodStart, LocalDate periodEnd) {
        
        BigDecimal baseSalary = salary.getAmount();
        
        // Simplified: calculate based on completion percentage and proportional to days worked
        return calculateProportionalPayment(baseSalary, assignments, periodStart, periodEnd);
    }

    private BigDecimal calculateProportionalPayment(BigDecimal baseSalary, List<WorkAssignment> assignments,
                                                     LocalDate periodStart, LocalDate periodEnd) {
        // Calculate average completion rate
        double avgCompletionRate = assignments.stream()
                .mapToDouble(a -> (a.getCompletionPercentage() != null ? a.getCompletionPercentage() : 0) / 100.0)
                .average()
                .orElse(0.0);

        // Calculate days in period vs days in month
        long daysInPeriod = java.time.temporal.ChronoUnit.DAYS.between(periodStart, periodEnd) + 1;
        long daysInMonth = periodEnd.lengthOfMonth();
        
        BigDecimal periodFraction = BigDecimal.valueOf(daysInPeriod)
                .divide(BigDecimal.valueOf(daysInMonth), 4, RoundingMode.HALF_UP);

        return baseSalary
                .multiply(periodFraction)
                .multiply(BigDecimal.valueOf(avgCompletionRate))
                .setScale(2, RoundingMode.HALF_UP);
    }

    private PaymentReportDTO.AssignmentDetail createAssignmentDetail(WorkAssignment assignment, EmployeeSalary salary) {
        PaymentReportDTO.AssignmentDetail detail = new PaymentReportDTO.AssignmentDetail();
        detail.setAssignmentId(assignment.getId());
        detail.setActivityName(assignment.getActivityName());
        detail.setAssignmentDate(assignment.getAssignmentDate());
        detail.setEstimatedHours(8.0);  // Default to 8 hours per assignment
        detail.setActualHours(assignment.getActualDurationHours());
        detail.setCompletionPercentage(assignment.getCompletionPercentage() != null ? assignment.getCompletionPercentage() : 0);
        
        // Calculate contribution (simplified)
        double completionRate = (assignment.getCompletionPercentage() != null ? assignment.getCompletionPercentage() : 0) / 100.0;
        BigDecimal contribution = salary.getAmount()
                .multiply(BigDecimal.valueOf(completionRate))
                .divide(BigDecimal.valueOf(30), 2, RoundingMode.HALF_UP); // Rough daily estimate
        detail.setContributionToPayment(contribution);
        
        return detail;
    }

    private UpcomingAssignmentsReportDTO.AssignmentSummary convertToAssignmentSummary(WorkAssignment assignment) {
        UpcomingAssignmentsReportDTO.AssignmentSummary summary = new UpcomingAssignmentsReportDTO.AssignmentSummary();
        summary.setAssignmentId(assignment.getId());
        summary.setActivityName(assignment.getActivityName());
        summary.setAssignmentDate(assignment.getAssignmentDate());
        summary.setStatus(assignment.getAssignmentStatus());
        summary.setAssignedEmployeeId(assignment.getAssignedEmployee() != null ? assignment.getAssignedEmployee().getId() : null);
        summary.setAssignedEmployeeName(assignment.getAssignedEmployee() != null ? assignment.getAssignedEmployee().getName() : null);
        return summary;
    }

    private PaymentReportDTO.EmployeePaymentSummary createEmptyPaymentSummary(String employeeId) {
        return createEmptyPaymentSummary(employeeId, "Unknown");
    }

    private PaymentReportDTO.EmployeePaymentSummary createEmptyPaymentSummary(String employeeId, String employeeName) {
        PaymentReportDTO.EmployeePaymentSummary summary = new PaymentReportDTO.EmployeePaymentSummary();
        summary.setEmployeeId(employeeId);
        summary.setEmployeeName(employeeName);
        summary.setCalculatedPayment(BigDecimal.ZERO);
        summary.setTotalAssignments(0);
        summary.setCompletedAssignments(0);
        summary.setAssignments(new ArrayList<>());
        summary.setPaymentNotes("No salary information available");
        return summary;
    }
}

