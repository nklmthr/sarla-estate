import apiClient from './apiClient';

// ==================== Types ====================

export interface Payment {
  id: string;
  paymentDate?: string;
  status: PaymentStatus;
  totalAmount: number;
  paymentMonth?: number;
  paymentYear?: number;
  referenceNumber?: string;
  remarks?: string;
  approvedBy?: string;
  approvedAt?: string;
  paidBy?: string;
  paidAt?: string;
  submittedBy?: string;
  submittedAt?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdBy?: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
  lineItems?: PaymentLineItem[];
  documents?: PaymentDocument[];
  history?: PaymentHistory[];
}

export enum PaymentStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED'
}

export interface PaymentLineItem {
  id: string;
  assignmentId: string;
  employeeId: string;
  employeeName?: string;
  workActivityId: string;
  workActivityName?: string;
  assignmentDate?: string;  // Date of the work assignment
  quantity: number;
  rate: number;
  amount: number;
  employeePf?: number;       // Employee PF deduction (12%)
  voluntaryPf?: number;      // Voluntary PF deduction
  employerPf?: number;       // Employer PF contribution (12%, not deducted)
  pfAmount: number;          // Total deduction (Employee + Voluntary)
  otherDeductions: number;
  netAmount: number;
  remarks?: string;
  
  // Snapshot fields (captured when payment submitted)
  snapshotEmployeeName?: string;
  snapshotEmployeePhone?: string;
  snapshotPfAccountId?: string;
  snapshotBasicSalary?: number;
  snapshotDaPercentage?: number;
  snapshotEmployeePfPercentage?: number;
  snapshotVoluntaryPfAmount?: number;
  snapshotActivityName?: string;
  snapshotActivityDescription?: string;
  snapshotCriteriaType?: string;
  snapshotUnitRate?: number;
  snapshotUnitOfMeasure?: string;
  snapshotSalaryPercentage?: number;
  snapshotActualDurationHours?: number;
  snapshotCompletionPercentage?: number;
  snapshotActualValue?: number;
  snapshotCompletedDate?: string;
  snapshotEvaluationNotes?: string;
  
  // Actual assignment data (for DRAFT status before snapshot)
  completionPercentage?: number;
}

export interface PaymentDocument {
  id: string;
  fileName: string;
  fileType?: string;
  fileSize?: number;
  documentType: string;
  description?: string;
  uploadedBy?: string;
  uploadedAt: string;
}

export interface PaymentHistory {
  id: string;
  changeType: string;
  changeDescription?: string;
  previousAmount?: number;
  newAmount?: number;
  previousStatus?: PaymentStatus;
  newStatus?: PaymentStatus;
  changedBy?: string;
  changedAt: string;
  remarks?: string;
}

export interface CreatePaymentDraftRequest {
  paymentMonth: number;
  paymentYear: number;
  assignmentIds?: string[];
}

export interface SubmitPaymentRequest {
  remarks?: string;
}

export interface ApprovePaymentRequest {
  remarks?: string;
}

export interface RecordPaymentRequest {
  paymentDate: string;
  referenceNumber: string;
  remarks?: string;
}

export interface CancelPaymentRequest {
  cancellationReason: string;
}

export interface UploadDocumentRequest {
  file: File;
  documentType: string;
  description?: string;
}

// ==================== API Client ====================

export const paymentApi = {
  // List and search payments
  getAllPayments: async (): Promise<Payment[]> => {
    return apiClient.get<Payment[]>('/payments');
  },

  getPaymentsByStatus: async (status: PaymentStatus): Promise<Payment[]> => {
    return apiClient.get<Payment[]>(`/payments?status=${status}`);
  },

  getPaymentById: async (id: string): Promise<Payment> => {
    return apiClient.get<Payment>(`/payments/${id}`);
  },

  // Create and manage drafts
  createDraft: async (request: CreatePaymentDraftRequest): Promise<Payment> => {
    return apiClient.post<Payment>('/payments/draft', request);
  },

  updateDraft: async (id: string, updates: Partial<Payment>): Promise<Payment> => {
    return apiClient.put<Payment>(`/payments/${id}`, updates);
  },

  // Line item management
  addLineItem: async (paymentId: string, assignmentId: string): Promise<Payment> => {
    return apiClient.post<Payment>(`/payments/${paymentId}/line-items`, { assignmentId });
  },

  removeLineItem: async (paymentId: string, lineItemId: string): Promise<Payment> => {
    return apiClient.delete<Payment>(`/payments/${paymentId}/line-items/${lineItemId}`);
  },

  // Workflow actions
  submitForApproval: async (id: string, request: SubmitPaymentRequest): Promise<Payment> => {
    return apiClient.post<Payment>(`/payments/${id}/submit`, request);
  },

  approvePayment: async (id: string, request: ApprovePaymentRequest): Promise<Payment> => {
    return apiClient.post<Payment>(`/payments/${id}/approve`, request);
  },

  recordPayment: async (id: string, request: RecordPaymentRequest): Promise<Payment> => {
    return apiClient.post<Payment>(`/payments/${id}/record-payment`, request);
  },

  cancelPayment: async (id: string, request: CancelPaymentRequest): Promise<Payment> => {
    return apiClient.post<Payment>(`/payments/${id}/cancel`, request);
  },

  // Document management
  uploadDocument: async (paymentId: string, file: File, documentType: string, description?: string): Promise<Payment> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    if (description) {
      formData.append('description', description);
    }
    return apiClient.post<Payment>(`/payments/${paymentId}/documents`, formData);
  },

  downloadDocument: async (paymentId: string, documentId: string): Promise<Blob> => {
    return apiClient.get(`/payments/${paymentId}/documents/${documentId}`, {
      responseType: 'blob',
    } as any);
  },

  deleteDocument: async (paymentId: string, documentId: string): Promise<Payment> => {
    return apiClient.delete<Payment>(`/payments/${paymentId}/documents/${documentId}`);
  },

  // History
  getPaymentHistory: async (paymentId: string): Promise<PaymentHistory[]> => {
    return apiClient.get<PaymentHistory[]>(`/payments/${paymentId}/history`);
  },

  // Helper to get status color
  getStatusColor: (status: PaymentStatus): 'default' | 'warning' | 'info' | 'success' | 'error' => {
    switch (status) {
      case PaymentStatus.DRAFT:
        return 'default';
      case PaymentStatus.PENDING_APPROVAL:
        return 'warning';
      case PaymentStatus.APPROVED:
        return 'info';
      case PaymentStatus.PAID:
        return 'success';
      case PaymentStatus.CANCELLED:
        return 'error';
      default:
        return 'default';
    }
  },

  // Helper to format status label
  getStatusLabel: (status: PaymentStatus): string => {
    switch (status) {
      case PaymentStatus.DRAFT:
        return 'Draft';
      case PaymentStatus.PENDING_APPROVAL:
        return 'Pending Approval';
      case PaymentStatus.APPROVED:
        return 'Approved';
      case PaymentStatus.PAID:
        return 'Paid';
      case PaymentStatus.CANCELLED:
        return 'Cancelled';
      default:
        return status;
    }
  },
};

