/**
 * Payment Service - Interface-only design for WeChat Mini Program payment.
 * Provides the contract for order creation, status query, and callback handling.
 * Does NOT integrate real payment SDK - all methods are stubs ready for
 * future WeChat Pay JSAPI / Native integration.
 */
import type { BeautyUser, TokenTransaction } from "@/types";
// @ts-ignore wx global type for mini program
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const wx: any;
import { api } from "@/services/api-client";
import userService from "@/services/user-service";

export type PaymentProductType = "report_unlock" | "beauty_pro" | "token_topup";
export type PaymentStatus = "pending" | "paid" | "cancelled" | "refunded";

export interface PaymentOrder {
  orderId: string;
  userId: string;
  productType: PaymentProductType;
  reportId?: string;
  amount: number;
  status: PaymentStatus;
  transactionId?: string;
  paidAt?: string;
  createdAt: string;
  cancelledAt?: string;
}

export interface CreateOrderParams {
  userId: string;
  productType: PaymentProductType;
  amount: number;
  reportId?: string;
  requestId?: string;
}

export interface CreateOrderResult {
  success: boolean;
  orderId?: string;
  prepayId?: string;
  message?: string;
}

export interface QueryOrderResult {
  success: boolean;
  order?: PaymentOrder;
  paid?: boolean;
  message?: string;
}

export interface PaymentCallbackParams {
  orderId: string;
  transactionId?: string;
  amount?: number;
  productType?: PaymentProductType;
  sign?: string;
}

export interface PaymentCallbackResult {
  success: boolean;
  orderId?: string;
  message?: string;
}

export interface PaymentService {
  createOrder(params: CreateOrderParams): Promise<CreateOrderResult>;
  queryOrderStatus(orderId: string): Promise<QueryOrderResult>;
  handleCallback(params: PaymentCallbackParams): Promise<PaymentCallbackResult>;
  cancelOrder(orderId: string): Promise<{ success: boolean; message?: string }>;
}

const ORDER_STORAGE_KEY = "beauty_payment_orders";

function getStoredOrders(): PaymentOrder[] {
  try {
    if (typeof wx !== "undefined" && wx.getStorageSync) {
      const raw = wx.getStorageSync(ORDER_STORAGE_KEY);
      if (raw) return JSON.parse(raw) as PaymentOrder[];
    }
  } catch {}
  try {
    const stored = typeof localStorage !== "undefined" ? localStorage.getItem(ORDER_STORAGE_KEY) : null;
    return stored ? (JSON.parse(stored) as PaymentOrder[]) : [];
  } catch {
    return [];
  }
}

function setStoredOrders(orders: PaymentOrder[]): void {
  const json = JSON.stringify(orders);
  try {
    if (typeof wx !== "undefined" && wx.setStorageSync) {
      wx.setStorageSync(ORDER_STORAGE_KEY, json);
    } else if (typeof localStorage !== "undefined") {
      localStorage.setItem(ORDER_STORAGE_KEY, json);
    }
  } catch {}
}

function generateOrderId(): string {
  return "pay_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
}

class PaymentServiceImpl implements PaymentService {
  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    const { userId, productType, amount, reportId, requestId } = params;
    if (!userId || !productType || !amount || amount <= 0) {
      return { success: false, message: "缺少必要参数" };
    }
    if (requestId) {
      const existing = getStoredOrders().find((o) => o.userId === userId && o.status === "pending");
      if (existing) return { success: true, orderId: existing.orderId };
    }
    const order: PaymentOrder = {
      orderId: generateOrderId(), userId, productType, reportId, amount,
      status: "pending", createdAt: new Date().toISOString(),
    };
    const orders = getStoredOrders();
    orders.push(order);
    setStoredOrders(orders);
    return { success: true, orderId: order.orderId };
  }

  async queryOrderStatus(orderId: string): Promise<QueryOrderResult> {
    const order = getStoredOrders().find((o) => o.orderId === orderId);
    if (!order) return { success: false, message: "订单不存在" };
    return { success: true, order, paid: order.status === "paid" };
  }

  async handleCallback(params: PaymentCallbackParams): Promise<PaymentCallbackResult> {
    const { orderId, transactionId, amount, productType } = params;
    if (!orderId) return { success: false, message: "缺少订单ID" };
    const orders = getStoredOrders();
    const index = orders.findIndex((o) => o.orderId === orderId);
    if (index === -1) return { success: false, message: "订单不存在" };
    const order = orders[index];
    if (order.status === "paid") return { success: true, orderId, message: "订单已支付" };
    if (order.status !== "pending") return { success: false, message: "订单状态不符合要求" };
    orders[index] = { ...order, status: "paid" as PaymentStatus, transactionId: transactionId || order.transactionId, paidAt: new Date().toISOString() };
    setStoredOrders(orders);
    return { success: true, orderId, message: "支付成功" };
  }

  async cancelOrder(orderId: string): Promise<{ success: boolean; message?: string }> {
    const orders = getStoredOrders();
    const index = orders.findIndex((o) => o.orderId === orderId && o.status === "pending");
    if (index === -1) return { success: false, message: "订单不存在或已支付" };
    orders[index] = { ...orders[index], status: "cancelled" as PaymentStatus, cancelledAt: new Date().toISOString() };
    setStoredOrders(orders);
    return { success: true };
  }
}

export const paymentService = new PaymentServiceImpl();
export default paymentService;
