import type { Order } from "../types/order";

export type OrderPriority =
  | "OVERDUE"
  | "DUE_TODAY"
  | "DUE_TOMORROW"
  | "HIGH"
  | "UPCOMING"
  | "NORMAL";

export interface OrderPriorityInfo {
  priority: OrderPriority;
  label: string;
  daysUntilDelivery: number;
}

function getTodayAtMidnight(): Date {
  const today = new Date();

  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function parseDateOnly(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);

  return new Date(year, month - 1, day);
}

export function getOrderPriority(order: Order): OrderPriorityInfo {
  const today = getTodayAtMidnight();
  const deliveryDate = parseDateOnly(order.estimatedDeliveryDate);

  const millisecondsPerDay = 1000 * 60 * 60 * 24;

  const daysUntilDelivery = Math.round(
    (deliveryDate.getTime() - today.getTime()) / millisecondsPerDay,
  );

  if (daysUntilDelivery < 0) {
    return {
      priority: "OVERDUE",
      label: "OVERDUE",
      daysUntilDelivery,
    };
  }

  if (daysUntilDelivery === 0) {
    return {
      priority: "DUE_TODAY",
      label: "DUE TODAY",
      daysUntilDelivery,
    };
  }

  if (daysUntilDelivery === 1) {
    return {
      priority: "DUE_TOMORROW",
      label: "DUE TOMORROW",
      daysUntilDelivery,
    };
  }

  if (daysUntilDelivery <= 3) {
    return {
      priority: "HIGH",
      label: "HIGH PRIORITY",
      daysUntilDelivery,
    };
  }

  if (daysUntilDelivery <= 7) {
    return {
      priority: "UPCOMING",
      label: "UPCOMING",
      daysUntilDelivery,
    };
  }

  return {
    priority: "NORMAL",
    label: "NORMAL",
    daysUntilDelivery,
  };
}
