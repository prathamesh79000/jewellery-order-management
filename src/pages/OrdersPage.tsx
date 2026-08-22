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
import Button from "@mui/material/Button";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import { getActiveOrders } from "../services/orderService";
import type { Order } from "../types/order";
import { getOrderPriority, type OrderPriority } from "../utils/orderPriority";

type StatusFilter = "ALL" | "NEW" | "IN_PRODUCTION" | "READY";

function formatDeliveryDate(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

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

function getStatusChipColor(
  status: StatusFilter,
): "default" | "info" | "warning" | "primary" {
  switch (status) {
    case "NEW":
      return "info";

    case "IN_PRODUCTION":
      return "warning";

    case "READY":
      return "primary";

    default:
      return "default";
  }
}

function OrdersPage() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

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
      // ---------------------------------------------
      // STATUS FILTER
      // ---------------------------------------------

      if (statusFilter !== "ALL" && order.status !== statusFilter) {
        return false;
      }

      // ---------------------------------------------
      // SEARCH FILTER
      // ---------------------------------------------

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

    // ---------------------------------------------
    // PRIORITY SORTING
    // ---------------------------------------------

    return [...filtered].sort((a, b) => {
      const priorityA = getOrderPriority(a);
      const priorityB = getOrderPriority(b);

      if (priorityA.daysUntilDelivery !== priorityB.daysUntilDelivery) {
        return priorityA.daysUntilDelivery - priorityB.daysUntilDelivery;
      }

      return b.sequenceNumber - a.sequenceNumber;
    });
  }, [orders, search, statusFilter]);

  const statusFilters: {
    label: string;
    value: StatusFilter;
  }[] = [
    {
      label: "All",
      value: "ALL",
    },
    {
      label: "New",
      value: "NEW",
    },
    {
      label: "In Production",
      value: "IN_PRODUCTION",
    },
    {
      label: "Ready",
      value: "READY",
    },
  ];

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 1200,
        mx: "auto",
      }}
    >
      {/* ------------------------------------------ */}
      {/* HEADER */}
      {/* ------------------------------------------ */}

      <Stack
        sx={{
          flexDirection: {
            xs: "column",
            sm: "row",
          },
          gap: {
            xs: 1.5,
            sm: 2,
          },
          justifyContent: "space-between",
          alignItems: {
            xs: "stretch",
            sm: "center",
          },
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
            }}
          >
            Orders
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            View and manage active customer orders.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/orders/create")}
          sx={{
            alignSelf: {
              xs: "stretch",
              sm: "auto",
            },
            minWidth: {
              xs: 0,
              sm: 190,
            },
          }}
        >
          Create New Order
        </Button>
      </Stack>

      {/* ------------------------------------------ */}
      {/* SEARCH */}
      {/* ------------------------------------------ */}

      <Paper
        elevation={1}
        sx={{
          p: {
            xs: 1.5,
            sm: 2.5,
          },
          mb: 2,
          borderRadius: 2,
        }}
      >
        <TextField
          fullWidth
          placeholder="Search order, customer, phone, item..."
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

      {/* ------------------------------------------ */}
      {/* STATUS FILTERS */}
      {/* ------------------------------------------ */}

      <Paper
        elevation={1}
        sx={{
          p: {
            xs: 1,
            sm: 1.25,
          },
          mb: 2.5,
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: 1,
            overflowX: "auto",
            px: {
              xs: 0.5,
              sm: 0.25,
            },
            pb: {
              xs: 0.5,
              sm: 0,
            },

            "&::-webkit-scrollbar": {
              height: 4,
            },

            "&::-webkit-scrollbar-thumb": {
              borderRadius: 4,
              backgroundColor: "divider",
            },
          }}
        >
          {statusFilters.map((filter) => {
            const selected = statusFilter === filter.value;

            return (
              <Chip
                key={filter.value}
                label={filter.label}
                clickable
                color={selected ? getStatusChipColor(filter.value) : "default"}
                variant={selected ? "filled" : "outlined"}
                onClick={() => setStatusFilter(filter.value)}
                sx={{
                  flexShrink: 0,
                  fontWeight: selected ? 700 : 500,
                  px: {
                    xs: 0.5,
                    sm: 1,
                  },
                }}
              />
            );
          })}
        </Box>
      </Paper>

      {/* ------------------------------------------ */}
      {/* RESULT COUNT */}
      {/* ------------------------------------------ */}

      {!loading && !error && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1.5,
            px: {
              xs: 0.25,
              sm: 0,
            },
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontSize: {
                xs: "0.75rem",
                sm: "0.875rem",
              },
            }}
          >
            {filteredOrders.length}{" "}
            {filteredOrders.length === 1 ? "order" : "orders"}
          </Typography>

          {(search || statusFilter !== "ALL") && (
            <Chip
              label="Clear filters"
              size="small"
              variant="outlined"
              clickable
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
              }}
            />
          )}
        </Box>
      )}

      {/* ------------------------------------------ */}
      {/* ERROR */}
      {/* ------------------------------------------ */}

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 2,
          }}
        >
          {error}
        </Alert>
      )}

      {/* ------------------------------------------ */}
      {/* LOADING */}
      {/* ------------------------------------------ */}

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

      {/* ------------------------------------------ */}
      {/* EMPTY */}
      {/* ------------------------------------------ */}

      {!loading && !error && filteredOrders.length === 0 && (
        <Paper
          elevation={1}
          sx={{
            p: {
              xs: 4,
              sm: 5,
            },
            textAlign: "center",
            borderRadius: 2,
          }}
        >
          <Typography
            sx={{
              fontSize: {
                xs: "1rem",
                sm: "1.25rem",
              },
              fontWeight: 600,
            }}
          >
            {search || statusFilter !== "ALL"
              ? "No matching orders found"
              : "No active orders"}
          </Typography>

          <Typography
            color="text.secondary"
            sx={{
              mt: 1,
              fontSize: {
                xs: "0.8rem",
                sm: "0.875rem",
              },
            }}
          >
            {search || statusFilter !== "ALL"
              ? "Try changing your search or status filter."
              : "New orders will appear here."}
          </Typography>

          {(search || statusFilter !== "ALL") && (
            <Chip
              label="Clear filters"
              color="primary"
              clickable
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
              }}
              sx={{
                mt: 2,
                fontWeight: 600,
              }}
            />
          )}
        </Paper>
      )}

      {/* ------------------------------------------ */}
      {/* ORDERS */}
      {/* ------------------------------------------ */}

      {!loading && !error && filteredOrders.length > 0 && (
        <Stack
          spacing={{
            xs: 1.25,
            sm: 2,
          }}
        >
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
                    xs: 1.75,
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

                  transition: "box-shadow 0.15s ease, transform 0.15s ease",

                  "&:hover": {
                    boxShadow: 3,
                  },

                  "&:active": {
                    transform: "scale(0.995)",
                  },
                }}
              >
                <Stack spacing={1.5}>
                  {/* -------------------------------- */}
                  {/* TOP ROW */}
                  {/* -------------------------------- */}

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
                    <Typography
                      sx={{
                        fontSize: {
                          xs: "1rem",
                          sm: "1.1rem",
                        },
                        fontWeight: 700,
                      }}
                    >
                      {order.orderNumber}
                    </Typography>

                    <Stack
                      direction="row"
                      spacing={0.75}
                      sx={{
                        flexWrap: "wrap",
                      }}
                      useFlexGap
                    >
                      <Chip
                        label={priority.label}
                        color={priorityColor}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          fontSize: {
                            xs: "0.62rem",
                            sm: "0.7rem",
                          },
                        }}
                      />

                      <Chip
                        label={formatStatus(order.status)}
                        variant="outlined"
                        size="small"
                        sx={{
                          fontWeight: 600,
                          fontSize: {
                            xs: "0.62rem",
                            sm: "0.7rem",
                          },
                        }}
                      />
                    </Stack>
                  </Box>

                  {/* -------------------------------- */}
                  {/* CUSTOMER */}
                  {/* -------------------------------- */}

                  <Box>
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontSize: {
                          xs: "0.9rem",
                          sm: "1rem",
                        },
                      }}
                    >
                      {order.customer.name}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mt: 0.25,
                        fontSize: {
                          xs: "0.75rem",
                          sm: "0.875rem",
                        },
                      }}
                    >
                      {order.customer.phone}
                    </Typography>
                  </Box>

                  {/* -------------------------------- */}
                  {/* ITEMS */}
                  {/* -------------------------------- */}

                  <Box>
                    <Typography
                      sx={{
                        fontSize: {
                          xs: "0.8rem",
                          sm: "0.875rem",
                        },
                        fontWeight: 600,
                      }}
                    >
                      {order.items.length}{" "}
                      {order.items.length === 1 ? "Item" : "Items"} •{" "}
                      {totalWeight.toFixed(2)} g
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mt: 0.25,
                        fontSize: {
                          xs: "0.75rem",
                          sm: "0.875rem",
                        },

                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {order.items.map((item) => item.itemName).join(", ")}
                    </Typography>
                  </Box>

                  {/* -------------------------------- */}
                  {/* FOOTER */}
                  {/* -------------------------------- */}

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
                      gap: {
                        xs: 1,
                        sm: 2,
                      },
                      pt: 1,
                      borderTop: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          fontSize: {
                            xs: "0.75rem",
                            sm: "0.875rem",
                          },
                        }}
                      >
                        Delivery:{" "}
                        <strong>
                          {formatDeliveryDate(order.estimatedDeliveryDate)}
                        </strong>
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mt: 0.25,
                          fontSize: {
                            xs: "0.75rem",
                            sm: "0.875rem",
                          },
                        }}
                      >
                        Taken by: <strong>{order.takenBy.name}</strong>
                      </Typography>
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        fontSize: {
                          xs: "0.72rem",
                          sm: "0.8rem",
                        },
                      }}
                    >
                      Tap to view details
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
