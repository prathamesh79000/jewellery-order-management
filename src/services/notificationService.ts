import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "../firebase/firebase";

import type { Notification, NotificationType } from "../types/notification";

interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  message: string;
  orderNumber: string;
  createdByUid: string;
  createdByName: string;
}

function createNotificationId(
  orderNumber: string,
  type: NotificationType,
): string {
  return `${orderNumber}_${type}`;
}

export async function createNotification(
  input: CreateNotificationInput,
): Promise<void> {
  const notificationId = createNotificationId(input.orderNumber, input.type);

  const notificationRef = doc(db, "notifications", notificationId);

  await setDoc(notificationRef, {
    type: input.type,
    title: input.title,
    message: input.message,
    orderNumber: input.orderNumber,
    createdByUid: input.createdByUid,
    createdByName: input.createdByName,
    createdAt: serverTimestamp(),
    readBy: {},
  });
}

export function subscribeToNotifications(
  uid: string,
  callback: (notifications: Notification[]) => void,
): Unsubscribe {
  const notificationsRef = collection(db, "notifications");

  const notificationsQuery = query(notificationsRef);

  return onSnapshot(notificationsQuery, (snapshot) => {
    const notifications = snapshot.docs
      .map((document) => {
        const data = document.data();

        return {
          id: document.id,
          ...data,
          read: data.readBy?.[uid] === true,
        } as unknown as Notification;
      })
      .sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() ?? 0;
        const timeB = b.createdAt?.toMillis?.() ?? 0;

        return timeB - timeA;
      });

    callback(notifications);
  });
}

export async function markNotificationAsRead(
  notificationId: string,
  userUid: string,
): Promise<void> {
  const notificationRef = doc(db, "notifications", notificationId);

  await updateDoc(notificationRef, {
    [`readBy.${userUid}`]: true,
  });
}
