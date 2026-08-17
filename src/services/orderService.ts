import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { db } from "../firebase/firebase";

import type {
  Order,
  OrderCustomer,
  OrderItem,
  OrderTakenBy,
  OrderStatus,
} from "../types/order";

const ORDER_PREFIX = "HJ";

export interface CreateOrderInput {
  customer: OrderCustomer;
  takenBy: OrderTakenBy;
  estimatedDeliveryDate: string;
  items: OrderItem[];
}

export interface UpdateOrderInput {
  customer: OrderCustomer;
  estimatedDeliveryDate: string;
  items: OrderItem[];
}

function formatOrderNumber(sequenceNumber: number): string {
  return `${ORDER_PREFIX}-${String(sequenceNumber).padStart(4, "0")}`;
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const counterRef = doc(db, "counters", "orders");

  const ordersCollection = collection(db, "orders");

  const order = await runTransaction(db, async (transaction) => {
    /*
     * IMPORTANT:
     * Firestore transactions must perform all reads
     * before writes.
     */

    const counterSnapshot = await transaction.get(counterRef);

    if (!counterSnapshot.exists()) {
      throw new Error("Order counter does not exist.");
    }

    const currentNumber = counterSnapshot.data().lastNumber ?? 0;

    const nextNumber = currentNumber + 1;

    const orderNumber = formatOrderNumber(nextNumber);

    /*
     * We intentionally use the sequence number
     * as the Firebase document ID.
     *
     * Example:
     *
     * orders/1 → HJ-0001
     * orders/2 → HJ-0002
     */
    const orderRef = doc(ordersCollection, String(nextNumber));

    const orderData = {
      sequenceNumber: nextNumber,

      orderNumber,

      customer: input.customer,

      takenBy: input.takenBy,

      estimatedDeliveryDate: input.estimatedDeliveryDate,

      status: "NEW" as const,

      statusUpdatedAt: serverTimestamp(),

      items: input.items,

      createdAt: serverTimestamp(),

      updatedAt: serverTimestamp(),

      completedAt: null,
    };

    /*
     * Update counter.
     */
    transaction.update(counterRef, {
      lastNumber: nextNumber,
      updatedAt: serverTimestamp(),
    });

    /*
     * Create order.
     */
    transaction.set(orderRef, orderData);

    return {
      ...orderData,
      createdAt: null,
      updatedAt: null,
      statusUpdatedAt: null,
    } as unknown as Order;
  });

  return order;
}

export async function getOrderByNumber(
  orderNumber: string,
): Promise<Order | null> {
  const ordersCollection = collection(db, "orders");

  const ordersQuery = query(
    ordersCollection,
    where("orderNumber", "==", orderNumber),
    limit(1),
  );

  const snapshot = await getDocs(ordersQuery);

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].data() as Order;
}

export async function updateOrder(
  orderNumber: string,
  input: UpdateOrderInput,
): Promise<void> {
  const ordersCollection = collection(db, "orders");

  const ordersQuery = query(
    ordersCollection,
    where("orderNumber", "==", orderNumber),
    limit(1),
  );

  const snapshot = await getDocs(ordersQuery);

  if (snapshot.empty) {
    throw new Error("Order not found.");
  }

  const orderRef = snapshot.docs[0].ref;

  await runTransaction(db, async (transaction) => {
    const orderSnapshot = await transaction.get(orderRef);

    if (!orderSnapshot.exists()) {
      throw new Error("Order not found.");
    }

    const orderData = orderSnapshot.data();

    const currentStatus = orderData.status as OrderStatus;

    /*
     * Completed and cancelled orders
     * cannot be edited.
     */
    if (currentStatus === "COMPLETED" || currentStatus === "CANCELLED") {
      throw new Error("Completed or cancelled orders cannot be edited.");
    }

    transaction.update(orderRef, {
      customer: input.customer,

      estimatedDeliveryDate: input.estimatedDeliveryDate,

      items: input.items,

      updatedAt: serverTimestamp(),
    });
  });
}

function isValidStatusTransition(
  currentStatus: OrderStatus,
  newStatus: OrderStatus,
): boolean {
  switch (currentStatus) {
    case "NEW":
      return newStatus === "IN_PRODUCTION" || newStatus === "CANCELLED";

    case "IN_PRODUCTION":
      return newStatus === "READY" || newStatus === "CANCELLED";

    case "READY":
      return newStatus === "COMPLETED" || newStatus === "CANCELLED";

    case "COMPLETED":
      return false;

    case "CANCELLED":
      return false;

    default:
      return false;
  }
}

export async function updateOrderStatus(
  orderNumber: string,
  status: OrderStatus,
): Promise<void> {
  const ordersCollection = collection(db, "orders");

  const ordersQuery = query(
    ordersCollection,
    where("orderNumber", "==", orderNumber),
    limit(1),
  );

  const snapshot = await getDocs(ordersQuery);

  if (snapshot.empty) {
    throw new Error("Order not found.");
  }

  const orderRef = snapshot.docs[0].ref;

  await runTransaction(db, async (transaction) => {
    /*
     * Read the latest version of the order inside
     * the transaction so we validate against the
     * current Firestore status.
     */
    const orderSnapshot = await transaction.get(orderRef);

    if (!orderSnapshot.exists()) {
      throw new Error("Order not found.");
    }

    const orderData = orderSnapshot.data();

    const currentStatus = orderData.status as OrderStatus;

    /*
     * No change required.
     */
    if (currentStatus === status) {
      return;
    }

    /*
     * Prevent invalid status transitions.
     */
    if (!isValidStatusTransition(currentStatus, status)) {
      throw new Error(
        `Invalid status transition: ${currentStatus} → ${status}.`,
      );
    }

    /*
     * Update status information.
     */
    transaction.update(orderRef, {
      status,

      statusUpdatedAt: serverTimestamp(),

      updatedAt: serverTimestamp(),

      /*
       * Only completed orders receive
       * a completedAt timestamp.
       */
      completedAt: status === "COMPLETED" ? serverTimestamp() : null,
    });
  });
}

export async function getActiveOrders(): Promise<Order[]> {
  const ordersRef = collection(db, "orders");

  const snapshot = await getDocs(ordersRef);

  const activeOrders = snapshot.docs
    .map((document) => {
      return document.data() as Order;
    })
    .filter(
      (order) =>
        order.status === "NEW" ||
        order.status === "IN_PRODUCTION" ||
        order.status === "READY",
    );

  return activeOrders;
}

export async function getHistoryOrders(): Promise<Order[]> {
  const ordersRef = collection(db, "orders");

  const snapshot = await getDocs(ordersRef);

  const historyOrders = snapshot.docs
    .map((document) => document.data() as Order)
    .filter(
      (order) => order.status === "COMPLETED" || order.status === "CANCELLED",
    )
    .sort((a, b) => b.sequenceNumber - a.sequenceNumber);

  return historyOrders;
}
