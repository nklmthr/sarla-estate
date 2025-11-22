import apiClient from './apiClient';

export interface PfReportRequest {
  month: number; // 1-12
  year: number;
}

export interface PaymentDetail {
  paymentId: string;
  paymentDate: string;
  referenceNumber: string;
  grossAmount: number;
  employeePf: number;
  voluntaryPf: number;
  employerPf: number;
  totalPf: number;
  netAmount: number;
  assignmentCount: number;
}

export interface EmployeePfTotals {
  totalPayments: number;
  totalAssignments: number;
  totalGrossAmount: number;
  totalEmployeePf: number;
  totalVoluntaryPf: number;
  totalEmployerPf: number;
  totalPfDeduction: number;
  totalNetAmount: number;
}

export interface EmployeePfSummary {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  pfAccountId: string;
  phoneNumber: string;
  payments: PaymentDetail[];
  totals: EmployeePfTotals;
}

export interface PfReportTotals {
  totalEmployees: number;
  totalPayments: number;
  totalAssignments: number;
  totalGrossAmount: number;
  totalEmployeePf: number;
  totalVoluntaryPf: number;
  totalEmployerPf: number;
  totalPfDeduction: number;
  totalNetAmount: number;
}

export interface PfReport {
  month: number;
  year: number;
  monthName: string;
  employees: EmployeePfSummary[];
  totals: PfReportTotals;
}

const pfReportApi = {
  generatePfReport: async (request: PfReportRequest): Promise<PfReport> => {
    return apiClient.post<PfReport>('/reports/pf-report', request);
  },
};

export default pfReportApi;

