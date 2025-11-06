import apiClient from './apiClient';
import { UpcomingAssignmentsReport, PaymentReport } from '../types';

export const reportApi = {
  getUpcomingAssignments: (startDate: string, endDate: string) => 
    apiClient.get<UpcomingAssignmentsReport>(
      `/reports/upcoming-assignments?startDate=${startDate}&endDate=${endDate}`
    ),
  
  getNextWeekAssignments: () => 
    apiClient.get<UpcomingAssignmentsReport>('/reports/upcoming-assignments/next-week'),
  
  getNextMonthAssignments: () => 
    apiClient.get<UpcomingAssignmentsReport>('/reports/upcoming-assignments/next-month'),
  
  getPaymentReport: (startDate: string, endDate: string) => 
    apiClient.get<PaymentReport>(`/reports/payments?startDate=${startDate}&endDate=${endDate}`),
  
  getCurrentMonthPayment: () => 
    apiClient.get<PaymentReport>('/reports/payments/current-month'),
  
  getLastMonthPayment: () => 
    apiClient.get<PaymentReport>('/reports/payments/last-month'),
  
  getLastWeekPayment: () => 
    apiClient.get<PaymentReport>('/reports/payments/last-week'),
};

