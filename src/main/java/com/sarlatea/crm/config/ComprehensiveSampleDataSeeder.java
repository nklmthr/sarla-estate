package com.sarlatea.crm.config;

import com.sarlatea.crm.model.*;
import com.sarlatea.crm.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * Comprehensive Sample Data Seeder
 * 
 * Creates realistic sample data covering all payment workflow scenarios:
 * - Past 2 weeks: Completed payments (PAID status)
 * - Last week: Mixed statuses (PAID, UNPAID, DRAFT, PENDING_APPROVAL)
 * - Current week: No payments (evaluated but not in any payment)
 * - Future week: Unevaluated assignments
 * 
 * All master data is created to ensure complete end-to-end testing.
 */
@Component
@Order(2) // Run after DataSeeder (Order 1)
@RequiredArgsConstructor
@Slf4j
public class ComprehensiveSampleDataSeeder implements CommandLineRunner {

    private final EmployeeRepository employeeRepository;
    private final EmployeeSalaryRepository employeeSalaryRepository;
    private final WorkActivityRepository workActivityRepository;
    private final WorkActivityCompletionCriteriaRepository completionCriteriaRepository;
    private final WorkAssignmentRepository workAssignmentRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentLineItemRepository paymentLineItemRepository;
    private final EmployeeTypeRepository employeeTypeRepository;
    private final EmployeeStatusRepository employeeStatusRepository;
    private final UserRepository userRepository;

    private final Random random = new Random(42); // Fixed seed for reproducibility
    private LocalDate TODAY;
    
    @Override
    @Transactional
    public void run(String... args) {
        // Check if sample data already exists
        if (employeeRepository.count() > 0) {
            log.info("Sample data already exists, skipping comprehensive seed");
            return;
        }

        // Wait a moment to ensure DataSeeder has completed
        try {
            Thread.sleep(500);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // Verify master data exists before proceeding
        if (employeeTypeRepository.count() == 0 || employeeStatusRepository.count() == 0 || userRepository.count() == 0) {
            log.warn("Master data not found. DataSeeder must run first. Skipping comprehensive sample data generation.");
            return;
        }

        log.info("=".repeat(60));
        log.info("Starting Comprehensive Sample Data Generation");
        log.info("=".repeat(60));

        // For testing, set "today" to a fixed date for consistent results
        // Comment out next line and uncomment the one after for production
        TODAY = LocalDate.now(); // Use actual today
        // TODAY = LocalDate.of(2025, 1, 22); // Fixed date for testing

        try {
            // First, backfill any missing firstEvaluatedAt timestamps
            backfillFirstEvaluatedAt();
            
            createEmployees();
            createSalaries();
            createWorkActivitiesAndCriteria();
            createAssignmentsWithPayments();
            
            log.info("=".repeat(60));
            log.info("✓ Comprehensive Sample Data Generation Complete!");
            log.info("=".repeat(60));
            printSummary();
        } catch (Exception e) {
            log.error("Error during sample data generation", e);
        }
    }

    /**
     * Backfill firstEvaluatedAt and assignedAt for assignments that are missing these timestamps
     * This fixes historical data that was created before these tracking fields were properly set
     */
    private void backfillFirstEvaluatedAt() {
        log.info("\n[0/4] Backfilling missing timestamps (firstEvaluatedAt and assignedAt)...");
        
        List<WorkAssignment> assignmentsToFix = workAssignmentRepository.findAll();
        int fixedFirstEval = 0;
        int fixedAssignedAt = 0;
        
        for (WorkAssignment assignment : assignmentsToFix) {
            boolean needsSave = false;
            
            // Fix missing firstEvaluatedAt
            if (assignment.getLastEvaluatedAt() != null && assignment.getFirstEvaluatedAt() == null) {
                assignment.setFirstEvaluatedAt(assignment.getLastEvaluatedAt());
                // Ensure evaluation count is at least 1
                if (assignment.getEvaluationCount() == null || assignment.getEvaluationCount() == 0) {
                    assignment.setEvaluationCount(1);
                }
                fixedFirstEval++;
                needsSave = true;
            }
            
            // Fix missing assignedAt - use assignment date at 8 AM as best guess
            if (assignment.getAssignedEmployee() != null && assignment.getAssignedAt() == null) {
                LocalDateTime assignedAt = assignment.getAssignmentDate().atTime(8, 0);
                assignment.setAssignedAt(assignedAt);
                fixedAssignedAt++;
                needsSave = true;
            }
            
            if (needsSave) {
                workAssignmentRepository.save(assignment);
            }
        }
        
        if (fixedFirstEval == 0 && fixedAssignedAt == 0) {
            log.info("    ✓ No assignments need backfilling - all timestamps are up to date");
        } else {
            log.info("    ✓ Backfilled {} assignments with missing firstEvaluatedAt", fixedFirstEval);
            log.info("    ✓ Backfilled {} assignments with missing assignedAt", fixedAssignedAt);
        }
    }

    private void createEmployees() {
        log.info("\n[1/4] Creating 20 Employees...");
        
        String[][] employeeData = {
            {"Ajay", "Patel", "9876543210", "DAILY"},
            {"Bindu", "Sharma", "9876543211", "DAILY"},
            {"Chetan", "Kumar", "9876543212", "DAILY"},
            {"Deepa", "Singh", "9876543213", "WEEKLY"},
            {"Eshwar", "Reddy", "9876543214", "WEEKLY"},
            {"Falguni", "Desai", "9876543215", "WEEKLY"},
            {"Ganesh", "Verma", "9876543216", "WEEKLY"},
            {"Hema", "Rao", "9876543217", "MONTHLY"},
            {"Ishwar", "Nair", "9876543218", "MONTHLY"},
            {"Jaya", "Gupta", "9876543219", "MONTHLY"},
            {"Kiran", "Mehta", "9876543220", "MONTHLY"},
            {"Laxmi", "Joshi", "9876543221", "MONTHLY"},
            {"Mohan", "Pillai", "9876543222", "DAILY"},
            {"Neha", "Iyer", "9876543223", "DAILY"},
            {"Om", "Pandey", "9876543224", "WEEKLY"},
            {"Priya", "Kulkarni", "9876543225", "WEEKLY"},
            {"Rahul", "Menon", "9876543226", "MONTHLY"},
            {"Sita", "Das", "9876543227", "MONTHLY"},
            {"Tarun", "Bose", "9876543228", "DAILY"},
            {"Uma", "Chatterjee", "9876543229", "WEEKLY"}
        };

        EmployeeType permanentType = employeeTypeRepository.findByCode("PERMANENT")
                .orElseThrow(() -> new RuntimeException("PERMANENT employee type not found"));
        EmployeeStatus activeStatus = employeeStatusRepository.findByCode("ACTIVE")
                .orElseThrow(() -> new RuntimeException("ACTIVE status not found"));

        for (int i = 0; i < employeeData.length; i++) {
            Employee emp = new Employee();
            emp.setName(employeeData[i][0] + " " + employeeData[i][1]);
            emp.setPhone("+91-" + employeeData[i][2]);
            emp.setPfAccountId("PF" + String.format("%09d", 100000 + i));
            emp.setIdCardType(Employee.IdCardType.AADHAAR);
            emp.setIdCardValue(String.format("%04d-%04d-%04d", 1000 + i, 5000 + i, 9000 + i));
            emp.setEmployeeType(permanentType);
            emp.setEmployeeStatus(activeStatus);
            employeeRepository.save(emp);
        }
        
        log.info("✓ Created {} employees", employeeData.length);
    }

    private void createSalaries() {
        log.info("\n[2/4] Creating Employee Salaries with varied types...");
        
        List<Employee> employees = employeeRepository.findAll();
        
        // Salary configurations: amount, type, voluntary PF%
        Object[][] salaryConfigs = {
            {500.00, "DAILY", 0},      // Ajay - Daily worker
            {450.00, "DAILY", 0},      // Bindu
            {550.00, "DAILY", 1},      // Chetan
            {3500.00, "WEEKLY", 0},    // Deepa
            {3200.00, "WEEKLY", 2},    // Eshwar
            {3800.00, "WEEKLY", 1},    // Falguni
            {3600.00, "WEEKLY", 0},    // Ganesh
            {24300.00, "MONTHLY", 3},  // Hema
            {22000.00, "MONTHLY", 2},  // Ishwar
            {26500.00, "MONTHLY", 4},  // Jaya
            {25000.00, "MONTHLY", 3},  // Kiran
            {28000.00, "MONTHLY", 5},  // Laxmi
            {480.00, "DAILY", 0},      // Mohan
            {520.00, "DAILY", 1},      // Neha
            {3400.00, "WEEKLY", 2},    // Om
            {3700.00, "WEEKLY", 1},    // Priya
            {23500.00, "MONTHLY", 2},  // Rahul
            {27000.00, "MONTHLY", 4},  // Sita
            {490.00, "DAILY", 0},      // Tarun
            {3300.00, "WEEKLY", 3}     // Uma
        };

        for (int i = 0; i < employees.size() && i < salaryConfigs.length; i++) {
            Employee emp = employees.get(i);
            Object[] config = salaryConfigs[i];
            
            EmployeeSalary salary = new EmployeeSalary();
            salary.setEmployee(emp);
            salary.setAmount(BigDecimal.valueOf((Double) config[0]));
            salary.setSalaryType(EmployeeSalary.SalaryType.valueOf((String) config[1]));
            salary.setCurrency("INR");
            salary.setStartDate(LocalDate.of(2024, 1, 1));
            salary.setEndDate(null);
            salary.setVoluntaryPfPercentage(BigDecimal.valueOf((Integer) config[2]));
            salary.setIsActive(true);
            employeeSalaryRepository.save(salary);
        }
        
        log.info("✓ Created {} salaries with DAILY/WEEKLY/MONTHLY types", employees.size());
    }

    private void createWorkActivitiesAndCriteria() {
        log.info("\n[3/4] Creating Work Activities and Completion Criteria...");
        
        // Activity 1: Tea Plucking
        WorkActivity teaPlucking = new WorkActivity();
        teaPlucking.setName("Tea Plucking");
        teaPlucking.setDescription("Harvesting tea leaves from the plantation");
        // Status is calculated based on completion criteria
        teaPlucking = workActivityRepository.save(teaPlucking);
        
        WorkActivityCompletionCriteria criteria1 = new WorkActivityCompletionCriteria();
        criteria1.setWorkActivity(teaPlucking);
        criteria1.setUnit("KG");
        criteria1.setValue(BigDecimal.valueOf(30));
        criteria1.setStartDate(LocalDate.of(2024, 11, 1));
        criteria1.setEndDate(LocalDate.of(2025, 12, 31)); // Active for whole year
        completionCriteriaRepository.save(criteria1);
        
        // Activity 2: Pruning
        WorkActivity pruning = new WorkActivity();
        pruning.setName("Pruning");
        pruning.setDescription("Trimming tea plants for better yield");
        pruning = workActivityRepository.save(pruning);
        
        WorkActivityCompletionCriteria criteria2 = new WorkActivityCompletionCriteria();
        criteria2.setWorkActivity(pruning);
        criteria2.setUnit("PLANTS");
        criteria2.setValue(BigDecimal.valueOf(50));
        criteria2.setStartDate(LocalDate.of(2024, 11, 1));
        criteria2.setEndDate(LocalDate.of(2025, 12, 31));
        completionCriteriaRepository.save(criteria2);
        
        // Activity 3: Weeding
        WorkActivity weeding = new WorkActivity();
        weeding.setName("Weeding");
        weeding.setDescription("Removing weeds from plantation area");
        weeding = workActivityRepository.save(weeding);
        
        WorkActivityCompletionCriteria criteria3 = new WorkActivityCompletionCriteria();
        criteria3.setWorkActivity(weeding);
        criteria3.setUnit("AREA");
        criteria3.setValue(BigDecimal.valueOf(500));
        criteria3.setStartDate(LocalDate.of(2024, 11, 1));
        criteria3.setEndDate(LocalDate.of(2025, 12, 31));
        completionCriteriaRepository.save(criteria3);
        
        log.info("✓ Created 3 work activities with completion criteria");
    }

    private void createAssignmentsWithPayments() {
        log.info("\n[4/4] Creating Assignments and Payments (covering all scenarios)...");
        
        List<Employee> employees = employeeRepository.findAll();
        List<WorkActivity> activities = workActivityRepository.findAll();
        User systemUser = userRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new RuntimeException("No user found for system operations"));
        
        // Calculate date ranges
        LocalDate twoWeeksAgo = TODAY.minusWeeks(2);
        LocalDate lastWeekStart = TODAY.minusWeeks(1);
        LocalDate currentWeekStart = TODAY.minusDays(TODAY.getDayOfWeek().getValue() - 1);
        LocalDate nextWeekStart = TODAY.plusWeeks(1);
        
        log.info("  Date Ranges:");
        log.info("    - Two weeks ago: {} onwards", twoWeeksAgo);
        log.info("    - Last week: {} to {}", lastWeekStart, lastWeekStart.plusDays(6));
        log.info("    - Current week: {} to {}", currentWeekStart, currentWeekStart.plusDays(6));
        log.info("    - Next week: {} onwards", nextWeekStart);
        
        // Scenario 1: Two weeks ago - PAID status
        log.info("\n  Scenario 1: Creating PAID payment for assignments 2 weeks ago...");
        Payment payment1 = createPayment(twoWeeksAgo.getMonthValue(), twoWeeksAgo.getYear(), 
                "Payment for Week -2", systemUser);
        payment1.setStatus(Payment.PaymentStatus.DRAFT);
        payment1 = paymentRepository.save(payment1);
        
        List<WorkAssignment> twoWeeksAssignments = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            LocalDate assignDate = twoWeeksAgo.plusDays(i % 5);
            WorkAssignment assignment = createAssignment(
                    employees.get(i % employees.size()),
                    activities.get(i % activities.size()),
                    assignDate,
                    85 + random.nextInt(16) // 85-100%
            );
            twoWeeksAssignments.add(assignment);
            
            // Lock assignment and add to payment
            assignment.lockForPaymentRequest(payment1.getId());
            assignment = workAssignmentRepository.save(assignment);
            
            // Create payment line item
            createPaymentLineItem(payment1, assignment, systemUser.getUsername());
        }
        
        // Submit, approve, and record payment (manually set statuses)
        payment1.setStatus(Payment.PaymentStatus.PENDING_APPROVAL);
        payment1.setSubmittedBy(systemUser.getUsername());
        payment1.setSubmittedAt(LocalDateTime.now().minusDays(14));
        
        payment1.setStatus(Payment.PaymentStatus.APPROVED);
        payment1.setApprovedBy(systemUser.getUsername());
        payment1.setApprovedAt(LocalDateTime.now().minusDays(14));
        
        payment1.setStatus(Payment.PaymentStatus.PAID);
        payment1.setPaymentDate(LocalDate.now().minusDays(14));
        payment1.setReferenceNumber("TXN-2WEEKS-AGO-" + System.currentTimeMillis());
        payment1.setPaidBy(systemUser.getUsername());
        payment1.setPaidAt(LocalDateTime.now().minusDays(14));
        payment1.recalculateTotalAmount();
        payment1 = paymentRepository.save(payment1);
        
        // Mark all assignments as PAID
        for (WorkAssignment assignment : twoWeeksAssignments) {
            assignment.setPaymentStatus(WorkAssignment.PaymentStatus.PAID);
            assignment.setPaidInPaymentId(payment1.getId());
            workAssignmentRepository.save(assignment);
        }
        log.info("    ✓ Created PAID payment with {} assignments", twoWeeksAssignments.size());
        
        // Scenario 2: Last week - Mixed statuses
        log.info("\n  Scenario 2: Creating mixed status payments for last week...");
        
        // 2a: PAID payment
        Payment payment2a = createPayment(lastWeekStart.getMonthValue(), lastWeekStart.getYear(),
                "Payment for Week -1 (Batch A)", systemUser);
        payment2a.setStatus(Payment.PaymentStatus.DRAFT);
        payment2a = paymentRepository.save(payment2a);
        
        for (int i = 0; i < 5; i++) {
            LocalDate assignDate = lastWeekStart.plusDays(i);
            WorkAssignment assignment = createAssignment(
                    employees.get((10 + i) % employees.size()),
                    activities.get(i % activities.size()),
                    assignDate,
                    80 + random.nextInt(21)
            );
            assignment.lockForPaymentRequest(payment2a.getId());
            assignment = workAssignmentRepository.save(assignment);
            createPaymentLineItem(payment2a, assignment, systemUser.getUsername());
        }
        
        payment2a.setStatus(Payment.PaymentStatus.PENDING_APPROVAL);
        payment2a.setSubmittedBy(systemUser.getUsername());
        payment2a.setSubmittedAt(LocalDateTime.now().minusDays(7));
        
        payment2a.setStatus(Payment.PaymentStatus.APPROVED);
        payment2a.setApprovedBy(systemUser.getUsername());
        payment2a.setApprovedAt(LocalDateTime.now().minusDays(7));
        
        payment2a.setStatus(Payment.PaymentStatus.PAID);
        payment2a.setPaymentDate(LocalDate.now().minusDays(7));
        payment2a.setReferenceNumber("TXN-LASTWEEK-A-" + System.currentTimeMillis());
        payment2a.setPaidBy(systemUser.getUsername());
        payment2a.setPaidAt(LocalDateTime.now().minusDays(7));
        payment2a.recalculateTotalAmount();
        payment2a = paymentRepository.save(payment2a);
        
        // Mark all line item assignments as PAID
        for (PaymentLineItem lineItem : payment2a.getLineItems()) {
            WorkAssignment assignment = lineItem.getAssignment();
            assignment.setPaymentStatus(WorkAssignment.PaymentStatus.PAID);
            assignment.setPaidInPaymentId(payment2a.getId());
            workAssignmentRepository.save(assignment);
        }
        log.info("    ✓ Created PAID payment with 5 assignments");
        
        // 2b: DRAFT payment
        Payment payment2b = createPayment(lastWeekStart.getMonthValue(), lastWeekStart.getYear(),
                "Payment for Week -1 (Draft Batch)", systemUser);
        payment2b = paymentRepository.save(payment2b);
        
        for (int i = 0; i < 3; i++) {
            LocalDate assignDate = lastWeekStart.plusDays(i + 2);
            WorkAssignment assignment = createAssignment(
                    employees.get((15 + i) % employees.size()),
                    activities.get(i % activities.size()),
                    assignDate,
                    75 + random.nextInt(26)
            );
            assignment.includeInPaymentDraft(payment2b.getId());
            assignment = workAssignmentRepository.save(assignment);
            createPaymentLineItem(payment2b, assignment, systemUser.getUsername());
        }
        log.info("    ✓ Created DRAFT payment with 3 assignments");
        
        // 2c: PENDING_APPROVAL payment
        Payment payment2c = createPayment(lastWeekStart.getMonthValue(), lastWeekStart.getYear(),
                "Payment for Week -1 (Pending Approval)", systemUser);
        payment2c.setStatus(Payment.PaymentStatus.DRAFT);
        payment2c = paymentRepository.save(payment2c);
        
        for (int i = 0; i < 4; i++) {
            LocalDate assignDate = lastWeekStart.plusDays(i + 1);
            WorkAssignment assignment = createAssignment(
                    employees.get((18 + i) % employees.size()),
                    activities.get((i + 1) % activities.size()),
                    assignDate,
                    88 + random.nextInt(13)
            );
            assignment.lockForPaymentRequest(payment2c.getId());
            assignment = workAssignmentRepository.save(assignment);
            createPaymentLineItem(payment2c, assignment, systemUser.getUsername());
        }
        
        payment2c.setStatus(Payment.PaymentStatus.PENDING_APPROVAL);
        payment2c.setSubmittedBy(systemUser.getUsername());
        payment2c.setSubmittedAt(LocalDateTime.now().minusDays(5));
        payment2c.recalculateTotalAmount();
        payment2c = paymentRepository.save(payment2c);
        log.info("    ✓ Created PENDING_APPROVAL payment with 4 assignments");
        
        // 2d: UNPAID assignments (evaluated but not in any payment)
        log.info("    ✓ Creating UNPAID evaluated assignments...");
        for (int i = 0; i < 5; i++) {
            LocalDate assignDate = lastWeekStart.plusDays(i % 5);
            WorkAssignment assignment = createAssignment(
                    employees.get(i % employees.size()),
                    activities.get((i + 2) % activities.size()),
                    assignDate,
                    70 + random.nextInt(31)
            );
            // Don't add to any payment - leaves in UNPAID status
        }
        log.info("    ✓ Created 5 UNPAID evaluated assignments");
        
        // Scenario 3: Current week - Evaluated but no payment generated
        log.info("\n  Scenario 3: Creating evaluated assignments for current week (no payment)...");
        for (int i = 0; i < 8; i++) {
            LocalDate assignDate = currentWeekStart.plusDays(i % 5);
            if (assignDate.isAfter(TODAY)) continue; // Only past/today
            
            WorkAssignment assignment = createAssignment(
                    employees.get(i % employees.size()),
                    activities.get(i % activities.size()),
                    assignDate,
                    85 + random.nextInt(16)
            );
        }
        log.info("    ✓ Created evaluated assignments for current week (UNPAID)");
        
        // Scenario 4: Future week - Unevaluated assignments
        log.info("\n  Scenario 4: Creating unevaluated assignments for next week...");
        for (int i = 0; i < 10; i++) {
            LocalDate assignDate = nextWeekStart.plusDays(i % 5);
            Employee emp = employees.get(i % employees.size());
            WorkActivity activity = activities.get(i % activities.size());
            
            WorkAssignment assignment = new WorkAssignment();
            assignment.setWorkActivity(activity);
            assignment.setActivityName(activity.getName());
            assignment.setActivityDescription(activity.getDescription());
            assignment.setAssignedEmployee(emp);
            assignment.setAssignmentDate(assignDate);
            assignment.setAssignmentStatus(WorkAssignment.AssignmentStatus.ASSIGNED);
            // NO evaluation - leave as ASSIGNED
            workAssignmentRepository.save(assignment);
        }
        log.info("    ✓ Created 10 unevaluated assignments for next week");
    }

    private Payment createPayment(int month, int year, String desc, User user) {
        Payment payment = new Payment();
        payment.setPaymentMonth(month);
        payment.setPaymentYear(year);
        payment.setRemarks(desc); // Use remarks instead of description
        payment.setStatus(Payment.PaymentStatus.DRAFT);
        payment.setCreatedBy(user.getUsername());
        payment.setLineItems(new ArrayList<>());
        return payment;
    }

    private WorkAssignment createAssignment(Employee emp, WorkActivity activity, 
                                            LocalDate date, int completionPercentage) {
        WorkAssignment assignment = new WorkAssignment();
        assignment.setWorkActivity(activity);
        assignment.setActivityName(activity.getName());
        assignment.setActivityDescription(activity.getDescription());
        assignment.setAssignedEmployee(emp);
        assignment.setAssignmentDate(date);
        assignment.setAssignmentStatus(WorkAssignment.AssignmentStatus.COMPLETED);
        assignment.setCompletionPercentage(completionPercentage);
        assignment.setActualValue((double) (completionPercentage * 0.3)); // Proportional actual value
        assignment.setCompletedDate(date);
        
        // Set assignment time (when it was assigned to employee) - use early morning of assignment date
        LocalDateTime assignedAt = date.atTime(8, 0); // 8 AM assignment time
        assignment.setAssignedAt(assignedAt);
        
        // Set evaluation times - use noon of the assignment date
        LocalDateTime evaluatedAt = date.atTime(12, 0); // Noon evaluation time
        assignment.setFirstEvaluatedAt(evaluatedAt);
        assignment.setLastEvaluatedAt(evaluatedAt);
        assignment.setEvaluationCount(1);
        
        assignment = workAssignmentRepository.save(assignment);
        return assignment;
    }

    private void createPaymentLineItem(Payment payment, WorkAssignment assignment, String username) {
        Employee emp = assignment.getAssignedEmployee();
        WorkActivity activity = assignment.getWorkActivity();
        
        // Get active salary
        EmployeeSalary salary = employeeSalaryRepository.findCurrentSalaryByEmployeeId(emp.getId())
                .orElseThrow(() -> new RuntimeException("No salary found for employee: " + emp.getName()));
        
        // Calculate daily rate using salary type
        BigDecimal dailyRate = salary.calculateDailyRate();
        BigDecimal completionRate = BigDecimal.valueOf(assignment.getCompletionPercentage())
                .divide(BigDecimal.valueOf(100), 4, java.math.RoundingMode.HALF_UP);
        
        BigDecimal quantity = BigDecimal.ONE;
        BigDecimal rate = dailyRate.multiply(completionRate).setScale(2, java.math.RoundingMode.HALF_UP);
        BigDecimal amount = rate;
        
        // Calculate PF
        BigDecimal employeePfPercentage = new BigDecimal("12.00");
        BigDecimal voluntaryPfPercentage = salary.getVoluntaryPfPercentage() != null ? 
                salary.getVoluntaryPfPercentage() : BigDecimal.ZERO;
        BigDecimal employerPfPercentage = new BigDecimal("12.00");
        
        BigDecimal employeePfContribution = amount.multiply(employeePfPercentage)
                .divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);
        BigDecimal voluntaryPfContribution = amount.multiply(voluntaryPfPercentage)
                .divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);
        BigDecimal employerPfContribution = amount.multiply(employerPfPercentage)
                .divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);
        
        PaymentLineItem lineItem = new PaymentLineItem();
        lineItem.setPayment(payment);
        lineItem.setAssignment(assignment);
        lineItem.setEmployee(emp);
        lineItem.setWorkActivity(activity);
        lineItem.setAssignmentDate(assignment.getAssignmentDate());
        lineItem.setQuantity(quantity);
        lineItem.setRate(rate);
        lineItem.setAmount(amount);
        lineItem.setEmployeePf(employeePfContribution);
        lineItem.setVoluntaryPf(voluntaryPfContribution);
        lineItem.setEmployerPf(employerPfContribution);
        lineItem.setPfAmount(employeePfContribution.add(voluntaryPfContribution)); // Total deduction
        lineItem.setOtherDeductions(BigDecimal.ZERO);
        lineItem.calculateNetAmount();
        
        // Capture snapshot - let captureSnapshot() method get data from associations
        lineItem.captureSnapshot();
        
        payment.addLineItem(lineItem);
        paymentLineItemRepository.save(lineItem);
    }

    private void printSummary() {
        long employeeCount = employeeRepository.count();
        long salaryCount = employeeSalaryRepository.count();
        long activityCount = workActivityRepository.count();
        long assignmentCount = workAssignmentRepository.count();
        long paymentCount = paymentRepository.count();
        
        long evaluatedCount = workAssignmentRepository.findAll().stream()
                .filter(a -> a.getAssignmentStatus() == WorkAssignment.AssignmentStatus.COMPLETED)
                .count();
        long unevaluatedCount = assignmentCount - evaluatedCount;
        
        long paidAssignments = workAssignmentRepository.findAll().stream()
                .filter(a -> a.getPaymentStatus() == WorkAssignment.PaymentStatus.PAID)
                .count();
        long unpaidAssignments = workAssignmentRepository.findAll().stream()
                .filter(a -> a.getPaymentStatus() == null || a.getPaymentStatus() == WorkAssignment.PaymentStatus.UNPAID)
                .count();
        long draftPaymentAssignments = workAssignmentRepository.findAll().stream()
                .filter(a -> a.getPaymentStatus() == WorkAssignment.PaymentStatus.DRAFT)
                .count();
        
        log.info("\n" + "=".repeat(60));
        log.info("COMPREHENSIVE SAMPLE DATA SUMMARY");
        log.info("=".repeat(60));
        log.info("Master Data:");
        log.info("  • Employees: {}", employeeCount);
        log.info("  • Salaries: {} (DAILY/WEEKLY/MONTHLY types)", salaryCount);
        log.info("  • Work Activities: {}", activityCount);
        log.info("\nAssignments:");
        log.info("  • Total: {}", assignmentCount);
        log.info("  • Evaluated: {}", evaluatedCount);
        log.info("  • Unevaluated: {}", unevaluatedCount);
        log.info("\nPayment Statuses:");
        log.info("  • PAID: {}", paidAssignments);
        log.info("  • UNPAID: {}", unpaidAssignments);
        log.info("  • In DRAFT: {}", draftPaymentAssignments);
        log.info("\nPayments:");
        log.info("  • Total Payments: {}", paymentCount);
        
        paymentRepository.findAll().forEach(p -> {
            log.info("    - {} ({} - {} line items)", 
                    p.getRemarks(), p.getStatus(), p.getLineItems() != null ? p.getLineItems().size() : 0);
        });
        
        log.info("\n" + "=".repeat(60));
        log.info("Ready for end-to-end testing!");
        log.info("=".repeat(60));
    }
}

