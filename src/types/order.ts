import type { Timestamp } from "firebase/firestore";

export type OrderStatus =
  | "NEW"
  | "IN_PRODUCTION"
  | "READY"
  | "COMPLETED"
  | "CANCELLED";

export interface OrderItem {
  id: string;
  itemName: string;
  weight: number;
  karagir: string;
  notes: string;
}

export interface OrderCustomer {
  name: string;
  phone: string;
}

export interface OrderTakenBy {
  uid: string;
  username: string;
  name: string;
}

export interface Order {
  sequenceNumber: number;

  orderNumber: string;

  customer: OrderCustomer;

  takenBy: OrderTakenBy;

  estimatedDeliveryDate: string;

  status: OrderStatus;

  statusUpdatedAt: Timestamp;

  items: OrderItem[];

  createdAt: Timestamp;

  updatedAt: Timestamp;

  completedAt: Timestamp | null;
}
