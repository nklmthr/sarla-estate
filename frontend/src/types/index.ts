// Type definitions for Tea Estate CRM

export interface Employee {
  id?: string;
  name: string;
  phone?: string;
  pfAccountId?: string;
  idCardType?: 'AADHAAR' | 'PAN' | 'PASSPORT' | 'DRIVING_LICENSE';
  idCardValue?: string;
  // idCardPhoto is byte[] on backend, handled separately via file upload
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
  unit: 'KG' | 'AREA' | 'PLANTS' | 'LITERS';
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
  completionNotes?: string;
  completedDate?: string;
  // Audit fields for tracking assignment and evaluation times
  assignedAt?: string;
  lastEvaluatedAt?: string;
  evaluationCount?: number;
}

export interface EmployeeSalary {
  id?: string;
  employeeId?: string;
  employeeName?: string;
  amount: number; // Base salary
  currency?: string;
  startDate: string;
  endDate?: string;
  salaryType?: 'BASE_SALARY' | 'HOURLY_WAGE' | 'DAILY_WAGE' | 'CONTRACT' | 'PIECE_RATE';
  paymentFrequency?: 'MONTHLY' | 'BIWEEKLY' | 'WEEKLY' | 'DAILY' | 'HOURLY';
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

