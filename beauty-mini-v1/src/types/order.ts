/**
 * Beauty Order Model for Commerce System
 */

export interface BeautyOrder {
  id: string;
  userId: string;
  reportId: string;
  productType: "report_unlock" | "beauty_pro";
  amount: number;
  status: "pending" | "paid" | "cancelled";
  createdAt: string;
  paidAt?: string;
  transactionId?: string;
}
