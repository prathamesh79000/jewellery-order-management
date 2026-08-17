import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";
import { getActiveOrders } from "../services/orderService";
import type { Order } from "../types/order";
import { getOrderPriority, type OrderPriority } from "../utils/orderPriority";

function formatDeliveryDate(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getPriorityChipColor(
  priority: OrderPriority,
): "error" | "warning" | "info" | "default" {
  switch (priority) {
    case "OVERDUE":
    case "DUE_TODAY":
    case "DUE_TOMORROW":
      return "error";

    case "HIGH":
      return "warning";

    case "UPCOMING":
      return "info";

    default:
      return "default";
  }
}

function formatStatus(status: Order["status"]): string {
  switch (status) {
    case "IN_PRODUCTION":
      return "IN PRODUCTION";

    default:
      return status;
  }
}

function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadOrders = async () => {
      try {
        setLoading(true);
        setError("");

        const activeOrders = await getActiveOrders();

        if (isMounted) {
          setOrders(activeOrders);
        }
      } catch (err) {
        console.error("Failed to load orders:", err);

        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Failed to load orders.",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredOrders = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    const filtered = orders.filter((order) => {
      if (!searchTerm) {
        return true;
      }

      const searchableText = [
        order.orderNumber,
        order.customer.name,
        order.customer.phone,
        order.takenBy.name,
        order.takenBy.username,
        ...order.items.flatMap((item) => [
          item.itemName,
          item.karagir,
          item.notes,
        ]),
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(searchTerm);
    });

    return [...filtered].sort((a, b) => {
      const priorityA = getOrderPriority(a);
      const priorityB = getOrderPriority(b);

      if (priorityA.daysUntilDelivery !== priorityB.daysUntilDelivery) {
        return priorityA.daysUntilDelivery - priorityB.daysUntilDelivery;
      }

      return b.sequenceNumber - a.sequenceNumber;
    });
  }, [orders, search]);

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 1200,
        mx: "auto",
      }}
    >
      {/* HEADER */}

      <Box sx={{ mb: 3 }}>
        <Typography sx={{ variant: "h4", fontWeight: 700 }}>Orders</Typography>

        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          View and manage active customer orders.
        </Typography>
      </Box>

      {/* SEARCH */}

      <Paper
        elevation={1}
        sx={{
          p: {
            xs: 2,
            sm: 2.5,
          },
          mb: 3,
          borderRadius: 2,
        }}
      >
        <TextField
          fullWidth
          placeholder="Search order number, customer, phone, item or karagir..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            },
          }}
        />
      </Paper>

      {/* ERROR */}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* LOADING */}

      {loading && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            py: 8,
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {/* EMPTY */}

      {!loading && !error && filteredOrders.length === 0 && (
        <Paper
          elevation={1}
          sx={{
            p: 5,
            textAlign: "center",
            borderRadius: 2,
          }}
        >
          <Typography sx={{ variant: "h6", fontWeight: 600 }}>
            {search ? "No matching orders found" : "No active orders"}
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 1 }}>
            {search
              ? "Try a different search term."
              : "New orders will appear here."}
          </Typography>
        </Paper>
      )}

      {/* ORDERS */}

      {!loading && filteredOrders.length > 0 && (
        <Stack spacing={2}>
          {filteredOrders.map((order) => {
            const priority = getOrderPriority(order);

            const priorityColor = getPriorityChipColor(priority.priority);

            const totalWeight = order.items.reduce(
              (total, item) => total + item.weight,
              0,
            );

            return (
              <Paper
                key={order.orderNumber}
                onClick={() => navigate(`/orders/${order.orderNumber}`)}
                elevation={1}
                sx={{
                  cursor: "pointer",
                  p: {
                    xs: 2,
                    sm: 2.5,
                  },
                  borderRadius: 2,
                  borderLeft: {
                    xs: "4px solid",
                    sm: "5px solid",
                  },
                  borderColor:
                    priorityColor === "error"
                      ? "error.main"
                      : priorityColor === "warning"
                        ? "warning.main"
                        : priorityColor === "info"
                          ? "info.main"
                          : "divider",
                }}
              >
                <Stack spacing={1.5}>
                  {/* TOP ROW */}

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: {
                        xs: "flex-start",
                        sm: "center",
                      },
                      flexDirection: {
                        xs: "column",
                        sm: "row",
                      },
                      gap: 1,
                    }}
                  >
                    <Typography sx={{ variant: "h6", fontWeight: 700 }}>
                      {order.orderNumber}
                    </Typography>

                    <Stack
                      sx={{
                        direction: "row",
                        spacing: 1,
                        flexWrap: "wrap",
                      }}
                      useFlexGap
                    >
                      <Chip
                        label={priority.label}
                        color={priorityColor}
                        size="small"
                      />

                      <Chip
                        label={formatStatus(order.status)}
                        variant="outlined"
                        size="small"
                      />
                    </Stack>
                  </Box>

                  {/* CUSTOMER */}

                  <Box>
                    <Typography sx={{ fontWeight: 600 }}>
                      {order.customer.name}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      {order.customer.phone}
                    </Typography>
                  </Box>

                  {/* ITEMS SUMMARY */}

                  <Box>
                    <Typography sx={{ variant: "body2", fontWeight: 600 }}>
                      {order.items.length}{" "}
                      {order.items.length === 1 ? "Item" : "Items"} •{" "}
                      {totalWeight.toFixed(2)} g
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      {order.items.map((item) => item.itemName).join(", ")}
                    </Typography>
                  </Box>

                  {/* FOOTER */}

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: {
                        xs: "flex-start",
                        sm: "center",
                      },
                      flexDirection: {
                        xs: "column",
                        sm: "row",
                      },
                      gap: 1,
                      pt: 1,
                    }}
                  >
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Delivery:{" "}
                        <strong>
                          {formatDeliveryDate(order.estimatedDeliveryDate)}
                        </strong>
                      </Typography>

                      <Typography variant="body2" color="text.secondary">
                        Taken by: <strong>{order.takenBy.name}</strong>
                      </Typography>
                    </Box>

                    <Typography variant="body2" color="text.secondary">
                      {order.items.length} item
                      {order.items.length === 1 ? "" : "s"}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}

export default OrdersPage;
