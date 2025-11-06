// Type definitions for Tea Estate CRM

export interface Employee {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  department?: string;
  employeeType?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'TEMPORARY';
  status?: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED';
  notes?: string;
}

export interface WorkActivity {
  id?: string;
  name: string;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SEASONAL';
  estimatedDurationHoursPerDay?: number;
  typicalLocation?: string;
  season?: 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER' | 'ALL_SEASON';
  workShift?: 'MORNING' | 'EVENING' | 'FULL_DAY';
  frequency?: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'AS_NEEDED' | 'MULTIPLE_DAILY';
  frequencyDetails?: string;
  resourcesRequired?: string;
  safetyInstructions?: string;
  notes?: string;
}

export interface OperationSchedule {
  id?: string;
  periodName?: string;
  startDate: string;
  endDate: string;
  description?: string;
  periodType?: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM';
  status?: 'DRAFT' | 'GENERATED' | 'PUBLISHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  filterFrequency?: string | null;
  filterWorkShift?: string | null;
  filterSeason?: string | null;
  filterActivityStatus?: string | null;
  includeAllSchedulable?: boolean;
  totalAssignmentsCount?: number;
}

export interface WorkAssignment {
  id?: string;
  operationScheduleId?: string;
  workActivityId?: string;
  assignedEmployeeId?: string;
  assignedEmployeeName?: string;
  assignmentDate: string;
  workShift?: 'MORNING' | 'EVENING' | 'FULL_DAY';
  activityName: string;
  activityDescription?: string;
  estimatedDurationHours?: number;
  location?: string;
  resourcesRequired?: string;
  safetyInstructions?: string;
  assignmentStatus?: 'UNASSIGNED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  actualDurationHours?: number;
  completionPercentage?: number;
  completionNotes?: string;
  completedDate?: string;
}

export interface EmployeeSalary {
  id?: string;
  employeeId?: string;
  employeeName?: string;
  amount: number;
  currency?: string;
  startDate: string;
  endDate?: string;
  salaryType?: 'BASE_SALARY' | 'HOURLY_WAGE' | 'DAILY_WAGE' | 'CONTRACT' | 'PIECE_RATE';
  paymentFrequency?: 'MONTHLY' | 'BIWEEKLY' | 'WEEKLY' | 'DAILY' | 'HOURLY';
  reasonForChange?: string;
  isActive?: boolean;
  approvedBy?: string;
  notes?: string;
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
  workShift?: string;
  location?: string;
  status?: string;
  priority?: string;
  assignedEmployeeId?: string;
  assignedEmployeeName?: string;
  estimatedDurationHours?: number;
  resourcesRequired?: string;
}

export interface PaymentReport {
  reportGeneratedDate: string;
  periodStartDate: string;
  periodEndDate: string;
  totalEmployees: number;
  totalPaymentAmount: number;
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

