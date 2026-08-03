/**
 * Order Service - Manages beauty orders and commerce operations
 * Uses universal storage layer (wx.storage / localStorage)
 */
import type { BeautyOrder } from "@/types";
import entitlementService from "./entitlement";
import { getStorage, setStorage, removeStorage } from "@/utils/storage";

function getStoredOrders(): any[] {
  return getStorage<any[]>("beauty_orders", []) ?? [];
}

function setStoredOrders(orders: any[]): void {
  setStorage("beauty_orders", orders);
}

function getStoredReportUnlock(reportId: string): boolean {
  const key = "beauty_report_" + reportId;
  return getStorage<boolean>(key, false) ?? false;
}

function setStoredReportUnlock(reportId: string, value: boolean): void {
  const key = "beauty_report_" + reportId;
  setStorage(key, value);
}

function generateOrderId(): string {
  return "order_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
}

class OrderService {
  async create({ userId, reportId, productType, amount, transactionId = null }): Promise<any> {
    const order = {
      id: generateOrderId(),
      userId, reportId, productType, amount,
      status: "pending",
      createdAt: new Date().toISOString(),
      paidAt: null,
      transactionId: transactionId || undefined
    };
    const orders = getStoredOrders();
    orders.push(order);
    setStoredOrders(orders);
    return order;
  }

  async getById(orderId: string): Promise<any> {
    const orders = getStoredOrders();
    return orders.find((o: any) => o.id === orderId) || null;
  }

  async listByUser(userId: string): Promise<any[]> {
    const orders = getStoredOrders();
    return orders.filter((o: any) => o.userId === userId);
  }

  async updateStatus(orderId: string, status: string, paidAt: string | null = null, transactionId: string | null = null): Promise<any> {
    const orders = getStoredOrders();
    const index = orders.findIndex((o: any) => o.id === orderId);
    if (index === -1) return null;
    orders[index].status = status;
    orders[index].updatedAt = new Date().toISOString();
    if (paidAt) orders[index].paidAt = paidAt;
    if (transactionId) orders[index].transactionId = transactionId;
    setStoredOrders(orders);
    return orders[index];
  }

  async handlePaymentSuccess(orderId: string, transactionId: string | null = null): Promise<any> {
    const order = await this.getById(orderId);
    if (!order) return { success: false, message: "订单不存在" };
    if (order.status === "paid") {
      if (transactionId && order.transactionId === transactionId) {
        return { success: true, message: "重复回调，已处理", orderId };
      }
      return { success: true, message: "订单已支付，无需重复处理", orderId };
    }
    if (order.status !== "pending") return { success: false, message: "订单状态不符合要求" };
    const paidAt = new Date().toISOString();
    await this.updateStatus(orderId, "paid", paidAt, transactionId);
    if (order.productType === "report_unlock") {
      setStoredReportUnlock(order.reportId, true);
      entitlementService.createEntitlement({
        userId: order.userId, reportId: order.reportId,
        productType: "report_unlock", source: "payment" as any,
        amount: order.amount, tokenCount: 0, paidAt,
        transactionId: transactionId || undefined
      });
    } else if (order.productType === "beauty_pro") {
      entitlementService.createEntitlement({
        userId: order.userId, productType: "beauty_pro",
        source: "payment" as any, amount: order.amount, tokenCount: 3, paidAt,
        transactionId: transactionId || undefined
      });
    }
    return { success: true, message: "支付成功，权限已授予", orderId, paidAt };
  }

  async verifyPayment(orderId: string, transactionId: string): Promise<any> {
    const order = await this.getById(orderId);
    if (!order) return { paid: false, amount: 0, productType: "report_unlock" };
    return { paid: order.status === "paid", amount: order.amount, productType: order.productType, transactionId: order.transactionId };
  }

  async isReportUnlocked(reportId: string): Promise<boolean> {
    return getStoredReportUnlock(reportId);
  }

  async cancelOrder(orderId: string): Promise<any> {
    const orders = getStoredOrders();
    const index = orders.findIndex((o: any) => o.id === orderId && o.status === "pending");
    if (index === -1) return null;
    orders[index].status = "cancelled";
    orders[index].updatedAt = new Date().toISOString();
    setStoredOrders(orders);
    return orders[index];
  }
}

export const orderService = new OrderService();
export default orderService;
