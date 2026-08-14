import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/firebase";

import type {
  Order,
  OrderCustomer,
  OrderItem,
  OrderTakenBy,
} from "../types/order";

const ORDER_PREFIX = "HJ";

export interface CreateOrderInput {
  customer: OrderCustomer;
  takenBy: OrderTakenBy;
  estimatedDeliveryDate: string;
  items: OrderItem[];
}

function formatOrderNumber(
  sequenceNumber: number
): string {
  return `${ORDER_PREFIX}-${String(sequenceNumber).padStart(
    4,
    "0"
  )}`;
}

export async function createOrder(
  input: CreateOrderInput
): Promise<Order> {
  const counterRef = doc(
    db,
    "counters",
    "orders"
  );

  const ordersCollection = collection(
    db,
    "orders"
  );

  const order = await runTransaction(
    db,
    async (transaction) => {
      /*
       * IMPORTANT:
       * Firestore transactions must perform all reads
       * before writes.
       */

      const counterSnapshot =
        await transaction.get(counterRef);

      if (!counterSnapshot.exists()) {
        throw new Error(
          "Order counter does not exist."
        );
      }

      const currentNumber =
        counterSnapshot.data().lastNumber ?? 0;

      const nextNumber = currentNumber + 1;

      const orderNumber =
        formatOrderNumber(nextNumber);

      /*
       * We intentionally use the sequence number
       * as the Firebase document ID.
       *
       * Example:
       *
       * orders/1 → HJ-0001
       * orders/2 → HJ-0002
       */
      const orderRef = doc(
        ordersCollection,
        String(nextNumber)
      );

      const orderData = {
        sequenceNumber: nextNumber,

        orderNumber,

        customer: input.customer,

        takenBy: input.takenBy,

        estimatedDeliveryDate:
          input.estimatedDeliveryDate,

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
      transaction.set(
        orderRef,
        orderData
      );

      return {
        ...orderData,
        createdAt: null,
        updatedAt: null,
        statusUpdatedAt: null,
      } as unknown as Order;
    }
  );

  return order;
}