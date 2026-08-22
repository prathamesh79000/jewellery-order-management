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
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import EditIcon from "@mui/icons-material/Edit";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import ScaleOutlinedIcon from "@mui/icons-material/ScaleOutlined";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import NotesOutlinedIcon from "@mui/icons-material/NotesOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import { auth } from "../firebase/firebase";
import { createNotification } from "../services/notificationService";
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

function getStatusDescription(status: OrderStatus): string {
  switch (status) {
    case "NEW":
      return "This order has been received and is waiting to enter production.";

    case "IN_PRODUCTION":
      return "This order is currently being worked on.";

    case "READY":
      return "The jewellery is ready for customer delivery or collection.";

    case "COMPLETED":
      return "This order has been completed successfully.";

    case "CANCELLED":
      return "This order has been cancelled.";

    default:
      return "";
  }
}

interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

function InfoItem({ icon, label, value }: InfoItemProps) {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 1.5,
        alignItems: "flex-start",
        minWidth: 0,
      }}
    >
      <Box
        sx={{
          width: 38,
          height: 38,
          flexShrink: 0,
          borderRadius: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "rgba(194, 139, 0, 0.10)",
          color: "primary.main",
        }}
      >
        {icon}
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: "block",
            fontWeight: 600,
            mb: 0.25,
          }}
        >
          {label}
        </Typography>

        <Typography
          variant="body1"
          sx={{
            fontWeight: 600,
            wordBreak: "break-word",
          }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  );
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

      try {
        const currentUser = auth.currentUser;

        if (currentUser) {
          let notificationType:
            | "ORDER_IN_PRODUCTION"
            | "ORDER_READY"
            | "ORDER_COMPLETED"
            | "ORDER_CANCELLED";

          let title: string;

          switch (newStatus) {
            case "IN_PRODUCTION":
              notificationType = "ORDER_IN_PRODUCTION";
              title = "Order Moved to Production";
              break;

            case "READY":
              notificationType = "ORDER_READY";
              title = "Order Ready for Delivery";
              break;

            case "COMPLETED":
              notificationType = "ORDER_COMPLETED";
              title = "Order Completed";
              break;

            case "CANCELLED":
              notificationType = "ORDER_CANCELLED";
              title = "Order Cancelled";
              break;

            default:
              return;
          }

          await createNotification({
            recipientUid: currentUser.uid,
            type: notificationType,
            title,
            message: `${orderNumber} is now ${formatStatus(newStatus)}.`,
            orderNumber,
          });
        }
      } catch (notificationError) {
        console.error(
          "Order status updated successfully, but notification could not be created:",
          notificationError,
        );
      }

      setSuccess(`Order status updated to ${formatStatus(newStatus)}.`);
    } catch (err) {
      console.error("Failed to update order status:", err);

      setError(
        err instanceof Error ? err.message : "Failed to update order status.",
      );
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
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
          sx={{
            mb: 2,
            minHeight: 44,
          }}
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

  const nextStatuses = allowedNextStatuses[order.status];

  const canEdit = order.status !== "COMPLETED" && order.status !== "CANCELLED";

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 1000,
        mx: "auto",
        pb: {
          xs: 3,
          sm: 5,
        },
      }}
    >
      {/* BACK */}

      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/orders")}
        sx={{
          mb: {
            xs: 1.5,
            sm: 2,
          },
          minHeight: 44,
          px: 0.5,
        }}
      >
        Back to Orders
      </Button>

      {/* HEADER */}

      <Box
        sx={{
          mb: {
            xs: 2.5,
            sm: 3,
          },
        }}
      >
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
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                fontSize: {
                  xs: "1.65rem",
                  sm: "2rem",
                },
                letterSpacing: "-0.02em",
              }}
            >
              {order.orderNumber}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Order details and status
            </Typography>
          </Box>

          {canEdit && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/orders/${order.orderNumber}/edit`)}
              sx={{
                alignSelf: {
                  xs: "stretch",
                  sm: "auto",
                },
                minHeight: 44,
              }}
            >
              Edit Order
            </Button>
          )}
        </Stack>
      </Box>

      {/* ALERTS */}

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 2,
            borderRadius: 2,
          }}
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{
            mb: 2,
            borderRadius: 2,
          }}
        >
          {success}
        </Alert>
      )}

      {/* STATUS */}

      <Paper
        elevation={0}
        sx={{
          p: {
            xs: 2,
            sm: 3,
          },
          mb: 2,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          borderLeft: "4px solid",
          borderLeftColor:
            order.status === "CANCELLED"
              ? "error.main"
              : order.status === "COMPLETED"
                ? "success.main"
                : "primary.main",
        }}
      >
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
          }}
        >
          <Box>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 800,
              }}
            >
              Order Status
            </Typography>

            <Chip
              label={formatStatus(order.status)}
              color={getStatusColor(order.status)}
              sx={{
                mt: 1,
                fontWeight: 700,
              }}
            />

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 1,
                maxWidth: 550,
              }}
            >
              {getStatusDescription(order.status)}
            </Typography>
          </Box>

          {nextStatuses.length > 0 && (
            <Box
              sx={{
                width: {
                  xs: "100%",
                  sm: 220,
                },
                flexShrink: 0,
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: "block",
                  mb: 0.5,
                  fontWeight: 600,
                }}
              >
                Change status
              </Typography>

              <Select
                fullWidth
                size="small"
                value={order.status}
                onChange={(event) =>
                  handleStatusChange(event.target.value as OrderStatus)
                }
              >
                <MenuItem value={order.status}>
                  {formatStatus(order.status)}
                </MenuItem>

                {nextStatuses.map((status) => (
                  <MenuItem key={status} value={status}>
                    {formatStatus(status)}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          )}
        </Stack>
      </Paper>

      {/* CUSTOMER */}

      <Paper
        elevation={0}
        sx={{
          p: {
            xs: 2,
            sm: 3,
          },
          mb: 2,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            mb: 2,
          }}
        >
          Customer Details
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
            },
            gap: {
              xs: 2,
              sm: 3,
            },
          }}
        >
          <InfoItem
            icon={<PersonOutlineIcon />}
            label="Customer Name"
            value={order.customer.name}
          />

          <InfoItem
            icon={<PhoneOutlinedIcon />}
            label="Phone Number"
            value={order.customer.phone}
          />
        </Box>
      </Paper>

      {/* ORDER INFORMATION */}

      <Paper
        elevation={0}
        sx={{
          p: {
            xs: 2,
            sm: 3,
          },
          mb: 2,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            mb: 2,
          }}
        >
          Order Information
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
            },
            gap: {
              xs: 2,
              sm: 3,
            },
          }}
        >
          <InfoItem
            icon={<ReceiptLongOutlinedIcon />}
            label="Order Number"
            value={order.orderNumber}
          />

          <InfoItem
            icon={<BadgeOutlinedIcon />}
            label="Order Taken By"
            value={
              <>
                {order.takenBy.name}
                <Typography
                  component="span"
                  variant="body2"
                  color="text.secondary"
                  sx={{ ml: 0.5 }}
                >
                  ({order.takenBy.username})
                </Typography>
              </>
            }
          />

          <InfoItem
            icon={<AccessTimeIcon />}
            label="Created"
            value={formatTimestamp(order.createdAt)}
          />

          <InfoItem
            icon={<CalendarMonthIcon />}
            label="Estimated Delivery"
            value={formatDate(order.estimatedDeliveryDate)}
          />

          <InfoItem
            icon={<ScaleOutlinedIcon />}
            label="Total Weight"
            value={`${totalWeight.toFixed(3)} g`}
          />
        </Box>
      </Paper>

      {/* ITEMS */}

      <Paper
        elevation={0}
        sx={{
          p: {
            xs: 2,
            sm: 3,
          },
          mb: 2,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Stack
          sx={{
            flexDirection: "row",
            gap: 1,
            alignItems: "center",
            mb: 0.5,
          }}
        >
          <Inventory2OutlinedIcon color="primary" />

          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
            }}
          >
            Jewellery Items
          </Typography>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {order.items.length} {order.items.length === 1 ? "item" : "items"} •{" "}
          {totalWeight.toFixed(3)} g total
        </Typography>

        <Stack spacing={1.5}>
          {order.items.map((item, index) => (
            <Box
              key={item.id}
              sx={{
                p: {
                  xs: 1.75,
                  sm: 2,
                },
                borderRadius: 2,
                bgcolor: "action.hover",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
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
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: "block",
                      mb: 0.25,
                    }}
                  >
                    Item {index + 1}
                  </Typography>

                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 800,
                      wordBreak: "break-word",
                    }}
                  >
                    {item.itemName}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    flexWrap: "wrap",
                  }}
                >
                  <Chip
                    icon={<ScaleOutlinedIcon />}
                    label={`${item.weight.toFixed(3)} g`}
                    size="small"
                    variant="outlined"
                  />

                  <Chip
                    icon={<PrecisionManufacturingOutlinedIcon />}
                    label={item.karagir}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </Stack>

              {item.notes && (
                <>
                  <Divider sx={{ my: 1.5 }} />

                  <Stack
                    sx={{
                      flexDirection: "row",
                      gap: 1,
                      alignItems: "flex-start",
                    }}
                  >
                    <NotesOutlinedIcon
                      sx={{
                        fontSize: 19,
                        color: "text.secondary",
                        mt: 0.15,
                      }}
                    />

                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: "block",
                          fontWeight: 600,
                        }}
                      >
                        Notes
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{
                          mt: 0.25,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {item.notes}
                      </Typography>
                    </Box>
                  </Stack>
                </>
              )}
            </Box>
          ))}
        </Stack>
      </Paper>

      {/* COMPLETION INFO */}

      {order.completedAt && (
        <Paper
          elevation={0}
          sx={{
            p: {
              xs: 2,
              sm: 3,
            },
            borderRadius: 3,
            border: "1px solid",
            borderColor: "success.light",
            bgcolor: "rgba(46, 125, 50, 0.04)",
          }}
        >
          <Stack
            sx={{
              flexDirection: "row",
              gap: 1.5,
              alignItems: "center",
            }}
          >
            <CheckCircleOutlineIcon color="success" />

            <Box>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 800,
                }}
              >
                Order Completed
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.25 }}
              >
                Completed on {formatTimestamp(order.completedAt)}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      )}
    </Box>
  );
}

export default OrderDetailsPage;
