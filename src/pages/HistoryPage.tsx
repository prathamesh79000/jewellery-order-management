import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";

import { useNavigate } from "react-router-dom";

import { getHistoryOrders } from "../services/orderService";
import type { Order, OrderStatus } from "../types/order";

type HistoryFilter = "ALL" | "COMPLETED" | "CANCELLED";

function getStatusColor(status: OrderStatus) {
  if (status === "COMPLETED") {
    return "success";
  }

  if (status === "CANCELLED") {
    return "error";
  }

  return "default";
}

function HistoryPage() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<HistoryFilter>("ALL");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        setError("");

        const historyOrders = await getHistoryOrders();

        setOrders(historyOrders);
      } catch (error) {
        console.error("Failed to load order history:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load order history.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  const filteredOrders = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "ALL" || order.status === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!searchValue) {
        return true;
      }

      return (
        order.orderNumber.toLowerCase().includes(searchValue) ||
        order.customer.name.toLowerCase().includes(searchValue) ||
        order.customer.phone.includes(searchValue)
      );
    });
  }, [orders, search, statusFilter]);

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 1200,
        mx: "auto",
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Order History
        </Typography>

        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          View completed and cancelled orders.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

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
          direction={{
            xs: "column",
            sm: "row",
          }}
          spacing={2}
        >
          <TextField
            fullWidth
            placeholder="Search order number, customer or phone"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            slotProps={{
              input: {
                startAdornment: <SearchIcon sx={{ mr: 1 }} />,
              },
            }}
          />

          <Select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as HistoryFilter)
            }
            sx={{
              minWidth: {
                xs: "100%",
                sm: 180,
              },
            }}
          >
            <MenuItem value="ALL">All History</MenuItem>

            <MenuItem value="COMPLETED">Completed</MenuItem>

            <MenuItem value="CANCELLED">Cancelled</MenuItem>
          </Select>
        </Stack>
      </Paper>

      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            py: 6,
          }}
        >
          <CircularProgress />
        </Box>
      ) : filteredOrders.length === 0 ? (
        <Paper
          elevation={1}
          sx={{
            p: 5,
            textAlign: "center",
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            No orders found
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 1 }}>
            No completed or cancelled orders match your search.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {filteredOrders.map((order) => (
            <Paper
              key={order.orderNumber}
              elevation={1}
              onClick={() => navigate(`/orders/${order.orderNumber}`)}
              sx={{
                p: {
                  xs: 2,
                  sm: 3,
                },
                borderRadius: 2,
                cursor: "pointer",
                transition: "0.2s",

                "&:hover": {
                  boxShadow: 4,
                },
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
                }}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {order.orderNumber}
                  </Typography>

                  <Typography sx={{ mt: 0.5 }}>
                    {order.customer.name}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    {order.customer.phone}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    textAlign: {
                      xs: "left",
                      sm: "right",
                    },
                  }}
                >
                  <Chip
                    label={order.status.replace("_", " ")}
                    color={getStatusColor(order.status)}
                    size="small"
                  />

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    Delivery: {order.estimatedDeliveryDate}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    Taken by: {order.takenBy.name}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}

export default HistoryPage;
