import * as XLSX from "xlsx";

import type { Order } from "../types/order";

interface CompletedOrderReportRow {
  "Order No.": string;
  "Customer Name": string;
  Phone: string;
  "Completed Date": string;
  "Estimated Delivery": string;
  "Taken By": string;
  "Item Name": string;
  "Weight (g)": number;
  Karagir: string;
  "Item Notes": string;
}

function formatDate(dateString: string): string {
  if (!dateString) {
    return "";
  }

  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTimestamp(timestamp: Order["completedAt"]): string {
  if (!timestamp) {
    return "";
  }

  return timestamp.toDate().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function exportCompletedOrdersReport(
  orders: Order[],
  fromDate: string,
  toDate: string,
): void {
  const start = new Date(`${fromDate}T00:00:00`);
  const end = new Date(`${toDate}T23:59:59.999`);

  const completedOrders = orders.filter((order) => {
    if (order.status !== "COMPLETED" || !order.completedAt) {
      return false;
    }

    const completedDate = order.completedAt.toDate();

    return completedDate >= start && completedDate <= end;
  });

  const rows: CompletedOrderReportRow[] = [];

  let totalWeight = 0;

  completedOrders.forEach((order) => {
    order.items.forEach((item) => {
      totalWeight += item.weight;

      rows.push({
        "Order No.": order.orderNumber,
        "Customer Name": order.customer.name,
        Phone: order.customer.phone,
        "Completed Date": formatTimestamp(order.completedAt),
        "Estimated Delivery": formatDate(order.estimatedDeliveryDate),
        "Taken By": order.takenBy.name,
        "Item Name": item.itemName,
        "Weight (g)": item.weight,
        Karagir: item.karagir,
        "Item Notes": item.notes,
      });
    });
  });

  const worksheetData: (CompletedOrderReportRow | string | number | null)[][] =
    [];

  worksheetData.push(["Hardik Jewellers - Completed Orders Report"]);

  worksheetData.push([
    `Report Period: ${formatDate(fromDate)} to ${formatDate(toDate)}`,
  ]);

  worksheetData.push([]);

  worksheetData.push([
    "Order No.",
    "Customer Name",
    "Phone",
    "Completed Date",
    "Estimated Delivery",
    "Taken By",
    "Item Name",
    "Weight (g)",
    "Karagir",
    "Item Notes",
  ]);

  rows.forEach((row) => {
    worksheetData.push([
      row["Order No."],
      row["Customer Name"],
      row.Phone,
      row["Completed Date"],
      row["Estimated Delivery"],
      row["Taken By"],
      row["Item Name"],
      row["Weight (g)"],
      row.Karagir,
      row["Item Notes"],
    ]);
  });

  const totalRowIndex = worksheetData.length;

  worksheetData.push([
    "",
    "",
    "",
    "",
    "",
    "",
    "TOTAL WEIGHT",
    totalWeight,
    "",
    "",
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  worksheet["!cols"] = [
    { wch: 14 },
    { wch: 24 },
    { wch: 14 },
    { wch: 18 },
    { wch: 20 },
    { wch: 18 },
    { wch: 24 },
    { wch: 12 },
    { wch: 18 },
    { wch: 35 },
  ];

  worksheet["!merges"] = [
    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: 9 },
    },
    {
      s: { r: 1, c: 0 },
      e: { r: 1, c: 9 },
    },
  ];

  worksheet[`H${totalRowIndex + 1}`] = {
    t: "n",
    v: Number(totalWeight.toFixed(3)),
  };

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Completed Orders");

  const safeFrom = fromDate.replace(/-/g, "");
  const safeTo = toDate.replace(/-/g, "");

  XLSX.writeFile(
    workbook,
    `Hardik-Jewellers-Completed-Orders-${safeFrom}-${safeTo}.xlsx`,
  );
}
