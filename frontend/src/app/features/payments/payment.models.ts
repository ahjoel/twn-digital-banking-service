export type PaymentStatus = 'SUCCESS' | 'PENDING' | 'FAILED';

export interface PaymentStatusResponse {
  reference: string;
  transactionId: string;
  status: PaymentStatus;
  statusDescription: string;
  amount: number;
  currency: string;
  debtorAccount: string;
  creditorAccount: string;
  creditorName: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}
