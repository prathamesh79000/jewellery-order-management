import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "../firebase/firebase";

import type { Notification, NotificationType } from "../types/notification";

interface CreateNotificationInput {
  recipientUid: string;
  type: NotificationType;
  title: string;
  message: string;
  orderNumber: string;
}

function createNotificationId(
  recipientUid: string,
  orderNumber: string,
  type: NotificationType,
): string {
  return `${recipientUid}_${orderNumber}_${type}`;
}

export async function createNotification(
  input: CreateNotificationInput,
): Promise<void> {
  const notificationId = createNotificationId(
    input.recipientUid,
    input.orderNumber,
    input.type,
  );

  const notificationRef = doc(db, "notifications", notificationId);

  await setDoc(notificationRef, {
    recipientUid: input.recipientUid,
    type: input.type,
    title: input.title,
    message: input.message,
    orderNumber: input.orderNumber,
    createdAt: serverTimestamp(),
    read: false,
  });
}

export function subscribeToNotifications(
  recipientUid: string,
  callback: (notifications: Notification[]) => void,
): Unsubscribe {
  const notificationsRef = collection(db, "notifications");

  const notificationsQuery = query(
    notificationsRef,
    where("recipientUid", "==", recipientUid),
  );

  return onSnapshot(notificationsQuery, (snapshot) => {
    const notifications = snapshot.docs
      .map((document) => {
        return {
          id: document.id,
          ...document.data(),
        } as Notification;
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
): Promise<void> {
  const notificationRef = doc(db, "notifications", notificationId);

  await updateDoc(notificationRef, {
    read: true,
  });
}
