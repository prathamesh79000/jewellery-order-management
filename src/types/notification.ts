import type { Timestamp } from "firebase/firestore";

export type NotificationType =
  | "NEW_ORDER"
  | "ORDER_IN_PRODUCTION"
  | "ORDER_READY"
  | "ORDER_COMPLETED"
  | "ORDER_CANCELLED";

export interface Notification {
  id: string;
  recipientUid: string;
  type: NotificationType;
  title: string;
  message: string;
  orderNumber: string;
  createdAt: Timestamp;
  read: boolean;
}
