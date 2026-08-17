import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  Paper,
  Select,
  Typography,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Stack from "@mui/material/Stack";
import { useNavigate, useParams } from "react-router-dom";

import { getOrderByNumber, updateOrderStatus } from "../services/orderService";

import type { Order, OrderStatus } from "../types/order";

function formatDate(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTimestamp(timestamp: Order["createdAt"]): string {
  if (!timestamp) {
    return "-";
  }

  return timestamp.toDate().toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatStatus(status: OrderStatus): string {
  switch (status) {
    case "IN_PRODUCTION":
      return "IN PRODUCTION";

    default:
      return status;
  }
}

function getStatusColor(
  status: OrderStatus,
): "default" | "info" | "warning" | "success" | "error" {
  switch (status) {
    case "NEW":
      return "info";

    case "IN_PRODUCTION":
      return "warning";

    case "READY":
      return "success";

    case "COMPLETED":
      return "success";

    case "CANCELLED":
      return "error";

    default:
      return "default";
  }
}

function OrderDetailsPage() {
  const navigate = useNavigate();
  const { orderNumber } = useParams<{
    orderNumber: string;
  }>();

  const [order, setOrder] = useState<Order | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!orderNumber) {
      setError("Order number is missing.");
      setLoading(false);
      return;
    }

    let mounted = true;

    const loadOrder = async () => {
      try {
        setLoading(true);
        setError("");

        const result = await getOrderByNumber(orderNumber);

        if (!mounted) {
          return;
        }

        if (!result) {
          setError("Order not found.");
          return;
        }

        setOrder(result);
      } catch (err) {
        console.error("Failed to load order:", err);

        if (mounted) {
          setError(
            err instanceof Error ? err.message : "Failed to load order.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadOrder();

    return () => {
      mounted = false;
    };
  }, [orderNumber]);

  const allowedNextStatuses: Record<OrderStatus, OrderStatus[]> = {
    NEW: ["IN_PRODUCTION", "CANCELLED"],
    IN_PRODUCTION: ["READY", "CANCELLED"],
    READY: ["COMPLETED", "CANCELLED"],
    COMPLETED: [],
    CANCELLED: [],
  };

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!orderNumber || !order) {
      return;
    }

    if (newStatus === order.status) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await updateOrderStatus(orderNumber, newStatus);

      setOrder({
        ...order,
        status: newStatus,
      });

      setSuccess(`Order status updated to ${formatStatus(newStatus)}.`);
    } catch (err) {
      console.error("Failed to update order status:", err);

      setError(
        err instanceof Error ? err.message : "Failed to update order status.",
      );
    } finally {
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          py: 10,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error && !order) {
    return (
      <Box
        sx={{
          width: "100%",
          maxWidth: 1000,
          mx: "auto",
        }}
      >
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/orders")}
          sx={{ mb: 3 }}
        >
          Back to Orders
        </Button>

        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!order) {
    return null;
  }

  const totalWeight = order.items.reduce(
    (total, item) => total + item.weight,
    0,
  );

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 1000,
        mx: "auto",
      }}
    >
      {/* HEADER */}

      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/orders")}
        sx={{ mb: 2 }}
      >
        Back to Orders
      </Button>

      <Box sx={{ mb: 3 }}>
        <Typography sx={{ variant: "h4", fontWeight: 700 }}>
          {order.orderNumber}
        </Typography>
        {order.status !== "COMPLETED" && order.status !== "CANCELLED" && (
          <Button
            variant="outlined"
            onClick={() => navigate(`/orders/${order.orderNumber}/edit`)}
            sx={{ mt: 2 }}
          >
            Edit Order
          </Button>
        )}

        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Order details
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* STATUS */}

      <Paper
        elevation={1}
        sx={{
          p: {
            xs: 2,
            sm: 3,
          },
          mb: 3,
          borderRadius: 2,
        }}
      >
        <Stack
          spacing={2}
          sx={{
            flexDirection: {
              xs: "column",
              sm: "row",
            },
            justifyContent: "space-between",
            alignItems: {
              xs: "stretch",
              sm: "center",
            },
          }}
        >
          <Box>
            <Typography sx={{ variant: "h6", fontWeight: 700 }}>
              Order Status
            </Typography>

            <Chip
              label={formatStatus(order.status)}
              color={getStatusColor(order.status)}
              sx={{ mt: 1 }}
            />
          </Box>

          <Select
            value={order.status}
            onChange={(event) =>
              handleStatusChange(event.target.value as OrderStatus)
            }
            disabled={allowedNextStatuses[order.status].length === 0}
          >
            <MenuItem value={order.status}>
              {order.status.replace("_", " ")}
            </MenuItem>

            {allowedNextStatuses[order.status].map((status) => (
              <MenuItem key={status} value={status}>
                {status.replace("_", " ")}
              </MenuItem>
            ))}
          </Select>
        </Stack>
      </Paper>

      {/* CUSTOMER */}

      <Paper
        elevation={1}
        sx={{
          p: {
            xs: 2,
            sm: 3,
          },
          mb: 3,
          borderRadius: 2,
        }}
      >
        <Typography sx={{ variant: "h6", fontWeight: 700, mb: 2 }}>
          Customer Details
        </Typography>

        <Stack spacing={1}>
          <Typography>
            <strong>Name:</strong> {order.customer.name}
          </Typography>

          <Typography>
            <strong>Phone:</strong> {order.customer.phone}
          </Typography>
        </Stack>
      </Paper>

      {/* ORDER INFORMATION */}

      <Paper
        elevation={1}
        sx={{
          p: {
            xs: 2,
            sm: 3,
          },
          mb: 3,
          borderRadius: 2,
        }}
      >
        <Typography sx={{ variant: "h6", fontWeight: 700, mb: 2 }}>
          Order Information
        </Typography>

        <Stack spacing={1}>
          <Typography>
            <strong>Order Number:</strong> {order.orderNumber}
          </Typography>

          <Typography>
            <strong>Order Taken By:</strong> {order.takenBy.name} (
            {order.takenBy.username})
          </Typography>

          <Typography>
            <strong>Created:</strong> {formatTimestamp(order.createdAt)}
          </Typography>

          <Typography>
            <strong>Estimated Delivery:</strong>{" "}
            {formatDate(order.estimatedDeliveryDate)}
          </Typography>

          <Typography>
            <strong>Total Weight:</strong> {totalWeight.toFixed(3)} g
          </Typography>
        </Stack>
      </Paper>

      {/* ITEMS */}

      <Paper
        elevation={1}
        sx={{
          p: {
            xs: 2,
            sm: 3,
          },
          mb: 3,
          borderRadius: 2,
        }}
      >
        <Typography sx={{ variant: "h6", fontWeight: 700 }}>Items</Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.5, mb: 3 }}
        >
          {order.items.length} {order.items.length === 1 ? "item" : "items"} •{" "}
          {totalWeight.toFixed(3)} g
        </Typography>

        <Stack spacing={3}>
          {order.items.map((item, index) => (
            <Box key={item.id}>
              {index > 0 && <Divider sx={{ mb: 3 }} />}

              <Typography sx={{ fontWeight: 700, mb: 1.5 }}>
                Item {index + 1}
              </Typography>

              <Stack spacing={1}>
                <Typography>
                  <strong>Item Name:</strong> {item.itemName}
                </Typography>

                <Typography>
                  <strong>Weight:</strong> {item.weight.toFixed(3)} g
                </Typography>

                <Typography>
                  <strong>Karagir:</strong> {item.karagir}
                </Typography>

                {item.notes && (
                  <Typography>
                    <strong>Notes:</strong> {item.notes}
                  </Typography>
                )}
              </Stack>
            </Box>
          ))}
        </Stack>
      </Paper>

      {/* COMPLETION INFO */}

      {order.completedAt && (
        <Paper
          elevation={1}
          sx={{
            p: {
              xs: 2,
              sm: 3,
            },
            borderRadius: 2,
          }}
        >
          <Typography sx={{ fontWeight: 700 }}>Completed</Typography>

          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {formatTimestamp(order.completedAt)}
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

export default OrderDetailsPage;
