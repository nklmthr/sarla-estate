// Type definitions for Tea Estate CRM

export interface UnitOfMeasure {
  id?: string;
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
  displayOrder?: number;
}

export interface EmployeeType {
  id?: string;
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
  displayOrder?: number;
}

export interface EmployeeStatus {
  id?: string;
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
  displayOrder?: number;
}

export interface Employee {
  id?: string;
  name: string;
  phone?: string;
  pfAccountId?: string;
  idCardType?: 'AADHAAR' | 'PAN' | 'PASSPORT' | 'DRIVING_LICENSE';
  idCardValue?: string;
  // idCardPhoto is byte[] on backend, handled separately via file upload
  employeeTypeId?: string;
  employeeTypeName?: string;
  employeeStatusId?: string;
  employeeStatusName?: string;
}

export interface WorkActivity {
  id?: string;
  name: string;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  notes?: string;
  completionCriteria?: WorkActivityCompletionCriteria[];
}

export interface WorkActivityCompletionCriteria {
  id?: string;
  workActivityId?: string;
  unit: string; // Unit code from Unit of Measure master data
  value: number;
  startDate: string;
  endDate?: string;
  isActive?: boolean; // Calculated field, not settable by user
  notes?: string;
}

export interface WorkAssignment {
  id?: string;
  workActivityId?: string;
  assignedEmployeeId?: string;
  assignedEmployeeName?: string;
  assignmentDate: string;
  activityName: string;
  activityDescription?: string;
  assignmentStatus?: 'ASSIGNED' | 'COMPLETED';
  actualDurationHours?: number;
  completionPercentage?: number;
  actualValue?: number;
  completionNotes?: string;
  completedDate?: string;
  // Audit fields for tracking assignment and evaluation times
  assignedAt?: string;
  lastEvaluatedAt?: string;
  evaluationCount?: number;
  // Payment tracking
  paymentStatus?: 'UNPAID' | 'DRAFT' | 'PENDING_PAYMENT' | 'APPROVED' | 'PAID' | 'CANCELLED';
  includedInPaymentId?: string;
  paidInPaymentId?: string;
  paymentLockedAt?: string;
  isEditable?: boolean; // Computed field from backend - can edit activity or delete
  isReEvaluatable?: boolean; // Computed field from backend - can update completion percentage
}

export interface EmployeeSalary {
  id?: string;
  employeeId?: string;
  employeeName?: string;
  amount: number; // Base salary
  salaryType?: 'DAILY' | 'WEEKLY' | 'MONTHLY'; // NEW: Determines how to calculate daily rate
  currency?: string;
  startDate: string;
  endDate?: string;
  reasonForChange?: string;
  isActive?: boolean;
  approvedBy?: string;
  notes?: string;
  
  // PF (Provident Fund) fields
  voluntaryPfPercentage?: number; // Voluntary PF beyond mandatory 12%
  
  // Calculated fields (read-only from backend)
  baseSalary?: number; // Same as amount, for clarity
  employeePfContribution?: number; // Mandatory + Voluntary
  employerPfContribution?: number; // Fixed 12%
  totalSalaryCost?: number; // Base + Employer PF
  takeHomeSalary?: number; // Base - Employee PF
}

export interface UpcomingAssignmentsReport {
  reportGeneratedDate: string;
  startDate: string;
  endDate: string;
  totalAssignments: number;
  unassignedCount: number;
  assignedCount: number;
  assignments: AssignmentSummary[];
}

export interface AssignmentSummary {
  assignmentId: string;
  activityName: string;
  assignmentDate: string;
  status?: string;
  assignedEmployeeId?: string;
  assignedEmployeeName?: string;
}

export interface PaymentReport {
  reportGeneratedDate: string;
  periodStartDate: string;
  periodEndDate: string;
  totalEmployees: number;
  totalPaymentAmount: number;
  totalEmployeePfContribution: number;
  totalVoluntaryPfContribution: number;
  totalEmployerPfContribution: number;
  currency: string;
  employeePayments: EmployeePaymentSummary[];
}

export interface EmployeePaymentSummary {
  employeeId: string;
  employeeName: string;
  baseSalary: number;
  currency: string;
  salaryType?: string;
  paymentFrequency?: string;
  totalAssignments: number;
  completedAssignments: number;
  totalEstimatedHours: number;
  totalActualHours: number;
  averageCompletionPercentage: number;
  calculatedPayment: number;
  paymentNotes?: string;
  assignments: AssignmentDetail[];
  
  // PF (Provident Fund) fields
  voluntaryPfPercentage?: number;
  employeePfContribution?: number;
  voluntaryPfContribution?: number;
  employerPfContribution?: number;
  takeHomeSalary?: number;
  totalCostToEmployer?: number;
  netPayment?: number;
}

export interface AssignmentDetail {
  assignmentId: string;
  activityName: string;
  assignmentDate: string;
  estimatedHours?: number;
  actualHours?: number;
  completionPercentage: number;
  contributionToPayment: number;
}

export interface AssignmentAuditReport {
  reportGeneratedDate: string;
  startDate: string;
  endDate: string;
  totalEvaluatedAssignments: number; // Only evaluated assignments
  reEvaluatedAssignments: number; // Assignments with evaluation count > 1
  deletedAssignments: number;
  assignments: AssignmentAuditDetail[];
}

export interface AssignmentAuditDetail {
  assignmentId: string;
  activityName: string;
  employeeName: string;
  assignmentDate: string;
  assignedAt: string;
  firstEvaluatedAt: string;
  lastEvaluatedAt: string;
  evaluationCount: number;
  minEvalTimeMinutes: number; // Min time = from assignment to first evaluation
  maxEvalTimeMinutes: number; // Max time = from assignment to last evaluation (same as min if only 1 eval)
  status: 'ASSIGNED' | 'COMPLETED';
  completionPercentage?: number;
  actualValue?: number;
  deleted: boolean;
}

