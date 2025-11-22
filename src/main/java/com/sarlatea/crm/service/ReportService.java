package com.sarlatea.crm.service;

import com.sarlatea.crm.config.SalaryConfiguration;
import com.sarlatea.crm.dto.AssignmentAuditReportDTO;
import com.sarlatea.crm.dto.PaymentReportDTO;
import com.sarlatea.crm.dto.PfReportDTO;
import com.sarlatea.crm.dto.PfReportRequestDTO;
import com.sarlatea.crm.dto.UpcomingAssignmentsReportDTO;
import com.sarlatea.crm.model.Employee;
import com.sarlatea.crm.model.EmployeeSalary;
import com.sarlatea.crm.model.Payment;
import com.sarlatea.crm.model.PaymentLineItem;
import com.sarlatea.crm.model.WorkAssignment;
import com.sarlatea.crm.repository.EmployeeRepository;
import com.sarlatea.crm.repository.EmployeeSalaryRepository;
import com.sarlatea.crm.repository.PaymentRepository;
import com.sarlatea.crm.repository.WorkAssignmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
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
    private final PaymentRepository paymentRepository;
    private final SalaryConfiguration salaryConfiguration;

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
        long assignedCount = assignments.stream()
                .filter(a -> a.getAssignmentStatus() == WorkAssignment.AssignmentStatus.ASSIGNED)
                .count();

        report.setUnassignedCount(0); // No longer used
        report.setAssignedCount(assignments.size());

        List<UpcomingAssignmentsReportDTO.AssignmentSummary> summaries = assignments.stream()
                .map(this::convertToAssignmentSummary)
                .collect(Collectors.toList());

        report.setAssignments(summaries);

        log.info("Report generated with {} assignments ({} assigned, {} completed)", 
                assignments.size(), assignedCount, completedCount);

        return report;
    }

    @Transactional(readOnly = true)
    public PaymentReportDTO generatePaymentReport(LocalDate startDate, LocalDate endDate) {
        
        log.info("Generating payment report from {} to {}", startDate, endDate);

        // Get all non-deleted completed assignments in the period
        // Only completed (evaluated) assignments are considered for payment
        // Assignments are already sorted by employee name from the database
        List<WorkAssignment> assignments = workAssignmentRepository
                .findByAssignmentDateBetweenAndDeletedFalse(startDate, endDate).stream()
                .filter(a -> a.getAssignmentStatus() == WorkAssignment.AssignmentStatus.COMPLETED)
                .collect(Collectors.toList());

        // Group assignments by employee - using LinkedHashMap to preserve alphabetical order from database
        Map<String, List<WorkAssignment>> assignmentsByEmployee = assignments.stream()
                .filter(a -> a.getAssignedEmployee() != null)
                .collect(Collectors.groupingBy(
                    a -> a.getAssignedEmployee().getId(),
                    java.util.LinkedHashMap::new,
                    Collectors.toList()
                ));

        PaymentReportDTO report = new PaymentReportDTO();
        report.setReportGeneratedDate(LocalDate.now());
        report.setPeriodStartDate(startDate);
        report.setPeriodEndDate(endDate);
        report.setTotalEmployees(assignmentsByEmployee.size());
        report.setCurrency("INR");

        List<PaymentReportDTO.EmployeePaymentSummary> employeePayments = new ArrayList<>();
        BigDecimal totalPayment = BigDecimal.ZERO;
        BigDecimal totalEmployeePf = BigDecimal.ZERO;
        BigDecimal totalVoluntaryPf = BigDecimal.ZERO;
        BigDecimal totalEmployerPf = BigDecimal.ZERO;

        for (Map.Entry<String, List<WorkAssignment>> entry : assignmentsByEmployee.entrySet()) {
            String employeeId = entry.getKey();
            List<WorkAssignment> employeeAssignments = entry.getValue();

            PaymentReportDTO.EmployeePaymentSummary summary = 
                    calculateEmployeePayment(employeeId, employeeAssignments, startDate, endDate);
            
            employeePayments.add(summary);
            totalPayment = totalPayment.add(summary.getNetPayment());
            totalEmployeePf = totalEmployeePf.add(summary.getEmployeePfContribution());
            totalVoluntaryPf = totalVoluntaryPf.add(summary.getVoluntaryPfContribution());
            totalEmployerPf = totalEmployerPf.add(summary.getEmployerPfContribution());
        }

        // No need to sort - already sorted from database query and preserved by LinkedHashMap
        report.setEmployeePayments(employeePayments);
        report.setTotalPaymentAmount(totalPayment);
        report.setTotalEmployeePfContribution(totalEmployeePf);
        report.setTotalVoluntaryPfContribution(totalVoluntaryPf);
        report.setTotalEmployerPfContribution(totalEmployerPf);

        log.info("Payment report generated for {} employees with total payment: {} {}", 
                assignmentsByEmployee.size(), totalPayment, report.getCurrency());

        return report;
    }

    private PaymentReportDTO.EmployeePaymentSummary calculateEmployeePayment(
            String employeeId, List<WorkAssignment> assignments, 
            LocalDate periodStart, LocalDate periodEnd) {

        if (employeeId == null) {
            log.warn("Employee ID is null");
            return createEmptyPaymentSummary("unknown");
        }

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

        // Calculate PF (Provident Fund) fields proportional to calculated payment
        BigDecimal employeePfPercentage = salaryConfiguration.getEmployeePfPercentage(); // 12%
        BigDecimal employerPfPercentage = salaryConfiguration.getEmployerPfPercentage(); // 12%
        BigDecimal voluntaryPfPercentage = salary.getVoluntaryPfPercentage() != null ? 
            salary.getVoluntaryPfPercentage() : BigDecimal.ZERO;
        
        // Calculate three separate PF contributions based on calculated payment
        // 1. Employee PF: 12% mandatory (deducted from payment)
        BigDecimal employeePfContribution = calculatedPayment
                .multiply(employeePfPercentage)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        
        // 2. Voluntary PF: X% additional (also deducted from payment)
        BigDecimal voluntaryPfContribution = calculatedPayment
                .multiply(voluntaryPfPercentage)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        
        // 3. Employer PF: 12% (paid by employer, NOT deducted from employee payment)
        BigDecimal employerPfContribution = calculatedPayment
                .multiply(employerPfPercentage)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        
        summary.setVoluntaryPfPercentage(voluntaryPfPercentage);
        summary.setEmployeePfContribution(employeePfContribution);
        summary.setVoluntaryPfContribution(voluntaryPfContribution);
        summary.setEmployerPfContribution(employerPfContribution);
        summary.setBaseSalary(salary.getAmount());
        
        // Net payment = calculated payment - employee PF (12%) - voluntary PF (X%)
        BigDecimal netPayment = calculatedPayment
                .subtract(employeePfContribution)
                .subtract(voluntaryPfContribution);
        summary.setNetPayment(netPayment);
        
        // Total cost to employer = calculated payment + employer PF
        BigDecimal totalCostToEmployer = calculatedPayment.add(employerPfContribution);
        summary.setTotalCostToEmployer(totalCostToEmployer);

        // Add assignment details
        List<PaymentReportDTO.AssignmentDetail> details = assignments.stream()
                .map(a -> createAssignmentDetail(a, salary))
                .collect(Collectors.toList());
        summary.setAssignments(details);

        summary.setPaymentNotes(String.format(
                "Based on base salary of %s %s. Average completion: %d%%. PF: Employee %.2f%%, Employer %.2f%%",
                salary.getAmount(), salary.getCurrency(), avgCompletion,
                employeePfPercentage.add(salary.getVoluntaryPfPercentage()), employerPfPercentage
        ));

        return summary;
    }

    private BigDecimal calculatePaymentAmount(EmployeeSalary salary, List<WorkAssignment> assignments,
                                               LocalDate periodStart, LocalDate periodEnd) {
        
        // Use the salary object's daily rate calculation which handles DAILY/WEEKLY/MONTHLY types
        BigDecimal dailyRate = salary.calculateDailyRate();
        
        // Calculate payment based on actual assignments and their completion percentage
        BigDecimal totalPayment = BigDecimal.ZERO;
        
        for (WorkAssignment assignment : assignments) {
            double completionRate = (assignment.getCompletionPercentage() != null 
                    ? assignment.getCompletionPercentage() : 0) / 100.0;
            
            // Each assignment = 1 day of work × completion rate
            BigDecimal assignmentPayment = dailyRate.multiply(BigDecimal.valueOf(completionRate));
            totalPayment = totalPayment.add(assignmentPayment);
        }

        return totalPayment.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateProportionalPayment(BigDecimal baseSalary, List<WorkAssignment> assignments,
                                                     LocalDate periodStart, LocalDate periodEnd) {
        // This method will be deprecated - we now get salary object and use calculateDailyRate()
        // Calculate daily rate (assuming 30 days per month as standard for MONTHLY salary)
        BigDecimal dailyRate = baseSalary.divide(BigDecimal.valueOf(30), 4, RoundingMode.HALF_UP);
        
        // Calculate payment based on actual assignments and their completion percentage
        BigDecimal totalPayment = BigDecimal.ZERO;
        
        for (WorkAssignment assignment : assignments) {
            double completionRate = (assignment.getCompletionPercentage() != null 
                    ? assignment.getCompletionPercentage() : 0) / 100.0;
            
            // Each assignment = 1 day of work × completion rate
            BigDecimal assignmentPayment = dailyRate.multiply(BigDecimal.valueOf(completionRate));
            totalPayment = totalPayment.add(assignmentPayment);
        }

        return totalPayment.setScale(2, RoundingMode.HALF_UP);
    }

    private PaymentReportDTO.AssignmentDetail createAssignmentDetail(WorkAssignment assignment, EmployeeSalary salary) {
        PaymentReportDTO.AssignmentDetail detail = new PaymentReportDTO.AssignmentDetail();
        detail.setAssignmentId(assignment.getId());
        detail.setActivityName(assignment.getActivityName());
        detail.setAssignmentDate(assignment.getAssignmentDate());
        detail.setEstimatedHours(8.0);  // Default to 8 hours per assignment
        detail.setActualHours(assignment.getActualDurationHours());
        detail.setCompletionPercentage(assignment.getCompletionPercentage() != null ? assignment.getCompletionPercentage() : 0);
        
        // Calculate contribution using the salary type-aware daily rate
        double completionRate = (assignment.getCompletionPercentage() != null ? assignment.getCompletionPercentage() : 0) / 100.0;
        BigDecimal dailyRate = salary.calculateDailyRate(); // Use salary type-aware calculation
        BigDecimal contribution = dailyRate.multiply(BigDecimal.valueOf(completionRate))
                .setScale(2, RoundingMode.HALF_UP);
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

    @Transactional(readOnly = true)
    public AssignmentAuditReportDTO generateAssignmentAuditReport(LocalDate startDate, LocalDate endDate) {
        
        log.info("Generating assignment evaluation report from {} to {} (only evaluated assignments)", startDate, endDate);

        // Fetch only evaluated assignments (filtered at database level) including deleted ones
        List<WorkAssignment> evaluatedAssignments = workAssignmentRepository
                .findEvaluatedAssignmentsByDateRange(startDate, endDate);

        AssignmentAuditReportDTO report = new AssignmentAuditReportDTO();
        report.setReportGeneratedDate(LocalDate.now());
        report.setStartDate(startDate);
        report.setEndDate(endDate);
        report.setTotalEvaluatedAssignments(evaluatedAssignments.size());

        // Count re-evaluated assignments (evaluation count > 1)
        long reEvaluatedCount = evaluatedAssignments.stream()
                .filter(a -> a.getEvaluationCount() != null && a.getEvaluationCount() > 1)
                .count();
        
        long deletedCount = evaluatedAssignments.stream()
                .filter(a -> Boolean.TRUE.equals(a.getDeleted()))
                .count();

        report.setReEvaluatedAssignments((int) reEvaluatedCount);
        report.setDeletedAssignments((int) deletedCount);

        List<AssignmentAuditReportDTO.AssignmentAuditDetail> auditDetails = evaluatedAssignments.stream()
                .map(this::convertToAuditDetail)
                .collect(Collectors.toList());

        report.setAssignments(auditDetails);

        log.info("Evaluation report generated with {} evaluated assignments ({} re-evaluated, {} deleted)", 
                evaluatedAssignments.size(), reEvaluatedCount, deletedCount);

        return report;
    }

    private AssignmentAuditReportDTO.AssignmentAuditDetail convertToAuditDetail(WorkAssignment assignment) {
        AssignmentAuditReportDTO.AssignmentAuditDetail detail = new AssignmentAuditReportDTO.AssignmentAuditDetail();
        detail.setAssignmentId(assignment.getId());
        detail.setActivityName(assignment.getActivityName());
        detail.setEmployeeName(assignment.getAssignedEmployee() != null ? 
                assignment.getAssignedEmployee().getName() : "Unassigned");
        detail.setAssignmentDate(assignment.getAssignmentDate());
        detail.setAssignedAt(assignment.getAssignedAt());
        detail.setFirstEvaluatedAt(assignment.getFirstEvaluatedAt());
        detail.setLastEvaluatedAt(assignment.getLastEvaluatedAt());
        detail.setEvaluationCount(assignment.getEvaluationCount() != null ? assignment.getEvaluationCount() : 0);
        
        // Calculate Min Eval Time: time from assignment to first evaluation
        if (assignment.getAssignedAt() != null && assignment.getFirstEvaluatedAt() != null) {
            long minMinutes = java.time.Duration.between(
                assignment.getAssignedAt(), 
                assignment.getFirstEvaluatedAt()
            ).toMinutes();
            detail.setMinEvalTimeMinutes(minMinutes);
        }
        
        // Calculate Max Eval Time: time from assignment to last evaluation
        // If only 1 evaluation, max = min. If multiple evaluations, max will be longer
        if (assignment.getAssignedAt() != null && assignment.getLastEvaluatedAt() != null) {
            long maxMinutes = java.time.Duration.between(
                assignment.getAssignedAt(), 
                assignment.getLastEvaluatedAt()
            ).toMinutes();
            detail.setMaxEvalTimeMinutes(maxMinutes);
        }
        
        detail.setStatus(assignment.getAssignmentStatus());
        detail.setCompletionPercentage(assignment.getCompletionPercentage());
        detail.setActualValue(assignment.getActualValue());
        detail.setDeleted(assignment.getDeleted());
        return detail;
    }

    /**
     * Generate monthly PF report for PAID payments
     * Groups by employee and shows PF account details with payment summaries
     */
    @Transactional(readOnly = true)
    public PfReportDTO generatePfReport(PfReportRequestDTO request) {
        log.info("Generating PF report for month {} year {}", request.getMonth(), request.getYear());

        // Validate month
        if (request.getMonth() < 1 || request.getMonth() > 12) {
            throw new IllegalArgumentException("Invalid month. Must be between 1 and 12");
        }

        // Find all PAID payments for the given month/year
        List<Payment> allPayments = paymentRepository.findAll();
        log.info("Total payments in database: {}", allPayments.size());
        
        List<Payment> paidPayments = allPayments.stream()
                .filter(p -> {
                    log.debug("Payment {}: status={}, month={}, year={}", 
                            p.getId().substring(0, 8), p.getStatus(), p.getPaymentMonth(), p.getPaymentYear());
                    return p.getStatus() == Payment.PaymentStatus.PAID;
                })
                .filter(p -> {
                    boolean monthMatch = p.getPaymentMonth() != null && p.getPaymentMonth().equals(request.getMonth());
                    if (!monthMatch) {
                        log.debug("Payment {} month mismatch: {} != {}", 
                                p.getId().substring(0, 8), p.getPaymentMonth(), request.getMonth());
                    }
                    return monthMatch;
                })
                .filter(p -> {
                    boolean yearMatch = p.getPaymentYear() != null && p.getPaymentYear().equals(request.getYear());
                    if (!yearMatch) {
                        log.debug("Payment {} year mismatch: {} != {}", 
                                p.getId().substring(0, 8), p.getPaymentYear(), request.getYear());
                    }
                    return yearMatch;
                })
                .collect(Collectors.toList());

        log.info("Found {} paid payments for {}/{}", paidPayments.size(), request.getMonth(), request.getYear());

        // Group payments by employee
        Map<String, List<Payment>> paymentsByEmployee = new LinkedHashMap<>();
        
        for (Payment payment : paidPayments) {
            for (PaymentLineItem lineItem : payment.getLineItems()) {
                String employeeId = lineItem.getEmployee().getId();
                paymentsByEmployee.computeIfAbsent(employeeId, k -> new ArrayList<>());
                if (!paymentsByEmployee.get(employeeId).contains(payment)) {
                    paymentsByEmployee.get(employeeId).add(payment);
                }
            }
        }

        // Build report
        PfReportDTO report = new PfReportDTO();
        report.setMonth(request.getMonth());
        report.setYear(request.getYear());
        report.setMonthName(java.time.Month.of(request.getMonth())
                .getDisplayName(TextStyle.FULL, Locale.ENGLISH));

        List<PfReportDTO.EmployeePfSummary> employeeSummaries = new ArrayList<>();

        // Initialize report totals
        PfReportDTO.PfReportTotals reportTotals = new PfReportDTO.PfReportTotals();
        reportTotals.setTotalEmployees(paymentsByEmployee.size());
        reportTotals.setTotalPayments(0); // Will be summed from employee totals
        reportTotals.setTotalGrossAmount(BigDecimal.ZERO);
        reportTotals.setTotalEmployeePf(BigDecimal.ZERO);
        reportTotals.setTotalVoluntaryPf(BigDecimal.ZERO);
        reportTotals.setTotalEmployerPf(BigDecimal.ZERO);
        reportTotals.setTotalPfDeduction(BigDecimal.ZERO);
        reportTotals.setTotalNetAmount(BigDecimal.ZERO);
        reportTotals.setTotalAssignments(0);

        // Process each employee
        for (Map.Entry<String, List<Payment>> entry : paymentsByEmployee.entrySet()) {
            String employeeId = entry.getKey();
            List<Payment> employeePayments = entry.getValue();

            Employee employee = employeeRepository.findById(employeeId).orElse(null);
            if (employee == null) continue;

            // Get employee's PF account details (from latest salary record)
            EmployeeSalary latestSalary = salaryRepository.findCurrentSalaryByEmployeeId(employeeId).orElse(null);

            PfReportDTO.EmployeePfSummary employeeSummary = new PfReportDTO.EmployeePfSummary();
            employeeSummary.setEmployeeId(employeeId);
            employeeSummary.setEmployeeName(employee.getName());
            employeeSummary.setEmployeeCode(employeeId.substring(0, Math.min(8, employeeId.length()))); // Use shortened ID as code
            employeeSummary.setPhoneNumber(employee.getPhone());
            employeeSummary.setPfAccountId(employee.getPfAccountId() != null ? employee.getPfAccountId() : "N/A");

            List<PfReportDTO.PaymentDetail> paymentDetails = new ArrayList<>();

            // Initialize employee totals
            PfReportDTO.EmployeePfTotals employeeTotals = new PfReportDTO.EmployeePfTotals();
            employeeTotals.setTotalPayments(0);
            employeeTotals.setTotalAssignments(0);
            employeeTotals.setTotalGrossAmount(BigDecimal.ZERO);
            employeeTotals.setTotalEmployeePf(BigDecimal.ZERO);
            employeeTotals.setTotalVoluntaryPf(BigDecimal.ZERO);
            employeeTotals.setTotalEmployerPf(BigDecimal.ZERO);
            employeeTotals.setTotalPfDeduction(BigDecimal.ZERO);
            employeeTotals.setTotalNetAmount(BigDecimal.ZERO);

            // Process each payment for this employee
            for (Payment payment : employeePayments) {
                // Filter line items for this employee only
                List<PaymentLineItem> employeeLineItems = payment.getLineItems().stream()
                        .filter(li -> li.getEmployee().getId().equals(employeeId))
                        .collect(Collectors.toList());

                if (employeeLineItems.isEmpty()) continue;

                // Calculate totals for this payment (for this employee)
                BigDecimal grossAmount = BigDecimal.ZERO;
                BigDecimal employeePf = BigDecimal.ZERO;
                BigDecimal voluntaryPf = BigDecimal.ZERO;
                BigDecimal employerPf = BigDecimal.ZERO;
                BigDecimal netAmount = BigDecimal.ZERO;

                for (PaymentLineItem item : employeeLineItems) {
                    grossAmount = grossAmount.add(item.getAmount() != null ? item.getAmount() : BigDecimal.ZERO);
                    employeePf = employeePf.add(item.getEmployeePf() != null ? item.getEmployeePf() : BigDecimal.ZERO);
                    voluntaryPf = voluntaryPf.add(item.getVoluntaryPf() != null ? item.getVoluntaryPf() : BigDecimal.ZERO);
                    employerPf = employerPf.add(item.getEmployerPf() != null ? item.getEmployerPf() : BigDecimal.ZERO);
                    netAmount = netAmount.add(item.getNetAmount() != null ? item.getNetAmount() : BigDecimal.ZERO);
                }

                BigDecimal totalPf = employeePf.add(voluntaryPf);

                PfReportDTO.PaymentDetail detail = new PfReportDTO.PaymentDetail();
                detail.setPaymentId(payment.getId());
                detail.setPaymentDate(payment.getPaidAt() != null ? payment.getPaidAt().toString() : "-");
                detail.setReferenceNumber(payment.getReferenceNumber() != null ? payment.getReferenceNumber() : "-");
                detail.setGrossAmount(grossAmount);
                detail.setEmployeePf(employeePf);
                detail.setVoluntaryPf(voluntaryPf);
                detail.setEmployerPf(employerPf);
                detail.setTotalPf(totalPf);
                detail.setNetAmount(netAmount);
                detail.setAssignmentCount(employeeLineItems.size());

                paymentDetails.add(detail);

                // Update employee totals
                employeeTotals.setTotalPayments(employeeTotals.getTotalPayments() + 1);
                employeeTotals.setTotalAssignments(employeeTotals.getTotalAssignments() + employeeLineItems.size());
                employeeTotals.setTotalGrossAmount(employeeTotals.getTotalGrossAmount().add(grossAmount));
                employeeTotals.setTotalEmployeePf(employeeTotals.getTotalEmployeePf().add(employeePf));
                employeeTotals.setTotalVoluntaryPf(employeeTotals.getTotalVoluntaryPf().add(voluntaryPf));
                employeeTotals.setTotalEmployerPf(employeeTotals.getTotalEmployerPf().add(employerPf));
                employeeTotals.setTotalPfDeduction(employeeTotals.getTotalPfDeduction().add(totalPf));
                employeeTotals.setTotalNetAmount(employeeTotals.getTotalNetAmount().add(netAmount));
            }

            employeeSummary.setPayments(paymentDetails);
            employeeSummary.setTotals(employeeTotals);
            employeeSummaries.add(employeeSummary);

            // Update report totals
            reportTotals.setTotalPayments(reportTotals.getTotalPayments() + employeeTotals.getTotalPayments());
            reportTotals.setTotalAssignments(reportTotals.getTotalAssignments() + employeeTotals.getTotalAssignments());
            reportTotals.setTotalGrossAmount(reportTotals.getTotalGrossAmount().add(employeeTotals.getTotalGrossAmount()));
            reportTotals.setTotalEmployeePf(reportTotals.getTotalEmployeePf().add(employeeTotals.getTotalEmployeePf()));
            reportTotals.setTotalVoluntaryPf(reportTotals.getTotalVoluntaryPf().add(employeeTotals.getTotalVoluntaryPf()));
            reportTotals.setTotalEmployerPf(reportTotals.getTotalEmployerPf().add(employeeTotals.getTotalEmployerPf()));
            reportTotals.setTotalPfDeduction(reportTotals.getTotalPfDeduction().add(employeeTotals.getTotalPfDeduction()));
            reportTotals.setTotalNetAmount(reportTotals.getTotalNetAmount().add(employeeTotals.getTotalNetAmount()));
        }

        report.setEmployees(employeeSummaries);
        report.setTotals(reportTotals);

        log.info("PF report generated for {} employees with {} total payments", 
                employeeSummaries.size(), reportTotals.getTotalPayments());

        return report;
    }
    
    /**
     * Debug method to get all payments for diagnostic purposes
     */
    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }
    
    /**
     * Debug method to check payment data in database
     */
    public Map<String, Object> debugPaymentData() {
        List<Payment> allPayments = paymentRepository.findAll();
        Map<String, Object> result = new LinkedHashMap<>();
        
        result.put("totalPayments", allPayments.size());
        
        List<Map<String, Object>> paymentSummaries = allPayments.stream().map(p -> {
            Map<String, Object> summary = new LinkedHashMap<>();
            summary.put("id", p.getId());
            summary.put("status", p.getStatus());
            summary.put("month", p.getPaymentMonth());
            summary.put("year", p.getPaymentYear());
            summary.put("totalAmount", p.getTotalAmount());
            summary.put("lineItemCount", p.getLineItems() != null ? p.getLineItems().size() : 0);
            
            if (p.getLineItems() != null && !p.getLineItems().isEmpty()) {
                List<Map<String, Object>> lineItemDetails = p.getLineItems().stream().map(li -> {
                    Map<String, Object> liDetail = new LinkedHashMap<>();
                    liDetail.put("id", li.getId());
                    liDetail.put("employeeId", li.getEmployee() != null ? li.getEmployee().getId() : null);
                    liDetail.put("employeeName", li.getEmployee() != null ? li.getEmployee().getName() : null);
                    liDetail.put("amount", li.getAmount());
                    liDetail.put("netAmount", li.getNetAmount());
                    return liDetail;
                }).collect(Collectors.toList());
                summary.put("lineItems", lineItemDetails);
            }
            
            return summary;
        }).collect(Collectors.toList());
        
        result.put("payments", paymentSummaries);
        
        return result;
    }
}

