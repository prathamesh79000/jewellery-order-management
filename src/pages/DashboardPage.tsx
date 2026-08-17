import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

import DashboardIcon from "@mui/icons-material/Dashboard";
import FiberNewIcon from "@mui/icons-material/FiberNew";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";

import { useNavigate } from "react-router-dom";

import { getActiveOrders, getHistoryOrders } from "../services/orderService";

import type { Order } from "../types/order";

type Priority = "OVERDUE" | "DUE_SOON" | "ON_TRACK";

function getStatusColor(
  status: Order["status"],
): "info" | "warning" | "primary" | "success" | "error" | "default" {
  switch (status) {
    case "NEW":
      return "info";

    case "IN_PRODUCTION":
      return "warning";

    case "READY":
      return "primary";

    case "COMPLETED":
      return "success";

    case "CANCELLED":
      return "error";

    default:
      return "default";
  }
}

function formatStatus(status: Order["status"]): string {
  return status.replace("_", " ");
}

function formatDeliveryDate(date: string): string {
  if (!date) {
    return "-";
  }

  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getDateDifferenceInDays(date: string): number {
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const deliveryDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(deliveryDate.getTime())) {
    return 999999;
  }

  deliveryDate.setHours(0, 0, 0, 0);

  const difference = deliveryDate.getTime() - today.getTime();

  return Math.ceil(difference / (1000 * 60 * 60 * 24));
}

function getOrderPriority(date: string): Priority {
  const daysRemaining = getDateDifferenceInDays(date);

  if (daysRemaining < 0) {
    return "OVERDUE";
  }

  if (daysRemaining <= 3) {
    return "DUE_SOON";
  }

  return "ON_TRACK";
}

function getPriorityColor(priority: Priority): "error" | "warning" | "success" {
  switch (priority) {
    case "OVERDUE":
      return "error";

    case "DUE_SOON":
      return "warning";

    case "ON_TRACK":
      return "success";
  }
}

function getPriorityLabel(priority: Priority): string {
  switch (priority) {
    case "OVERDUE":
      return "OVERDUE";

    case "DUE_SOON":
      return "DUE SOON";

    case "ON_TRACK":
      return "ON TRACK";
  }
}

function getPriorityIcon(priority: Priority) {
  switch (priority) {
    case "OVERDUE":
      return <WarningAmberOutlinedIcon />;

    case "DUE_SOON":
      return <AccessTimeOutlinedIcon />;

    case "ON_TRACK":
      return <EventOutlinedIcon />;
  }
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <Card
      elevation={1}
      sx={{
        borderRadius: 2,
        height: "100%",
      }}
    >
      <CardContent
        sx={{
          p: {
            xs: 1.5,
            sm: 2,
          },
          "&:last-child": {
            pb: {
              xs: 1.5,
              sm: 2,
            },
          },
        }}
      >
        <Stack
          sx={{
            direction: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
          spacing={1}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontSize: {
                  xs: "0.72rem",
                  sm: "0.875rem",
                },
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </Typography>

            <Typography
              sx={{
                fontSize: {
                  xs: "1.6rem",
                  sm: "2rem",
                },
                lineHeight: 1.1,
                fontWeight: 700,
                mt: 0.5,
              }}
            >
              {value}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
              "& svg": {
                fontSize: {
                  xs: 24,
                  sm: 32,
                },
              },
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

interface PriorityCardProps {
  label: string;
  value: number;
  color: "error" | "warning" | "success";
  icon: React.ReactNode;
}

function PriorityCard({ label, value, color, icon }: PriorityCardProps) {
  return (
    <Card
      elevation={1}
      sx={{
        borderRadius: 2,
        height: "100%",
        borderLeft: 4,
        borderColor: `${color}.main`,
      }}
    >
      <CardContent
        sx={{
          p: {
            xs: 1.5,
            sm: 2,
          },
          "&:last-child": {
            pb: {
              xs: 1.5,
              sm: 2,
            },
          },
        }}
      >
        <Stack
          sx={{
            direction: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
          spacing={1}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontSize: {
                  xs: "0.72rem",
                  sm: "0.875rem",
                },
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </Typography>

            <Typography
              sx={{
                fontSize: {
                  xs: "1.6rem",
                  sm: "2rem",
                },
                lineHeight: 1.1,
                fontWeight: 700,
                mt: 0.5,
              }}
            >
              {value}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              color: `${color}.main`,
              flexShrink: 0,
              "& svg": {
                fontSize: {
                  xs: 24,
                  sm: 32,
                },
              },
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function DashboardPage() {
  const navigate = useNavigate();

  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const [active, history] = await Promise.all([
          getActiveOrders(),
          getHistoryOrders(),
        ]);

        setActiveOrders(active);
        setHistoryOrders(history);
      } catch (error) {
        console.error("Failed to load dashboard:", error);

        setError(
          error instanceof Error ? error.message : "Failed to load dashboard.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const statistics = useMemo(() => {
    const overdue = activeOrders.filter(
      (order) => getOrderPriority(order.estimatedDeliveryDate) === "OVERDUE",
    ).length;

    const dueSoon = activeOrders.filter(
      (order) => getOrderPriority(order.estimatedDeliveryDate) === "DUE_SOON",
    ).length;

    return {
      newOrders: activeOrders.filter((order) => order.status === "NEW").length,

      inProduction: activeOrders.filter(
        (order) => order.status === "IN_PRODUCTION",
      ).length,

      ready: activeOrders.filter((order) => order.status === "READY").length,

      completed: historyOrders.filter((order) => order.status === "COMPLETED")
        .length,

      cancelled: historyOrders.filter((order) => order.status === "CANCELLED")
        .length,

      totalActive: activeOrders.length,

      overdue,

      dueSoon,
    };
  }, [activeOrders, historyOrders]);

  const recentActiveOrders = useMemo(() => {
    return [...activeOrders]
      .sort((a, b) => {
        const priorityRank: Record<Priority, number> = {
          OVERDUE: 0,
          DUE_SOON: 1,
          ON_TRACK: 2,
        };

        const priorityA = getOrderPriority(a.estimatedDeliveryDate);

        const priorityB = getOrderPriority(b.estimatedDeliveryDate);

        const priorityDifference =
          priorityRank[priorityA] - priorityRank[priorityB];

        if (priorityDifference !== 0) {
          return priorityDifference;
        }

        return b.sequenceNumber - a.sequenceNumber;
      })
      .slice(0, 8);
  }, [activeOrders]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 300,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 1200,
        mx: "auto",
      }}
    >
      {/* HEADER */}

      <Box
        sx={{
          mb: {
            xs: 2.5,
            sm: 4,
          },
        }}
      >
        <Stack sx={{ direction: "row", alignItems: "center" }} spacing={1}>
          <DashboardIcon
            color="primary"
            sx={{
              fontSize: {
                xs: 22,
                sm: 28,
              },
            }}
          />

          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              fontSize: {
                xs: "1.5rem",
                sm: "2.125rem",
              },
            }}
          >
            Dashboard
          </Typography>
        </Stack>

        <Typography
          color="text.secondary"
          sx={{
            mt: 0.5,
            fontSize: {
              xs: "0.8rem",
              sm: "1rem",
            },
          }}
        >
          Overview of your current order activity.
        </Typography>
      </Box>

      {/* ERROR */}

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

      {/* ORDER STATISTICS */}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            sm: "repeat(2, minmax(0, 1fr))",
            md: "repeat(3, minmax(0, 1fr))",
            lg: "repeat(5, minmax(0, 1fr))",
          },
          gap: {
            xs: 1.25,
            sm: 2,
          },
          mb: {
            xs: 2,
            sm: 3,
          },
        }}
      >
        <StatCard
          label="New Orders"
          value={statistics.newOrders}
          icon={<FiberNewIcon color="info" />}
        />

        <StatCard
          label="In Production"
          value={statistics.inProduction}
          icon={<PrecisionManufacturingIcon color="warning" />}
        />

        <StatCard
          label="Ready"
          value={statistics.ready}
          icon={<Inventory2OutlinedIcon color="primary" />}
        />

        <StatCard
          label="Completed"
          value={statistics.completed}
          icon={<CheckCircleOutlineIcon color="success" />}
        />

        <Box
          sx={{
            gridColumn: {
              xs: "1 / -1",
              sm: "auto",
            },
          }}
        >
          <StatCard
            label="Cancelled"
            value={statistics.cancelled}
            icon={<CancelOutlinedIcon color="error" />}
          />
        </Box>
      </Box>

      {/* DELIVERY PRIORITY */}

      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          fontSize: {
            xs: "1.15rem",
            sm: "1.5rem",
          },
          mb: 1.5,
        }}
      >
        Delivery Priority
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(3, minmax(0, 1fr))",
            sm: "repeat(3, minmax(0, 1fr))",
          },
          gap: {
            xs: 1,
            sm: 2,
          },
          mb: {
            xs: 3,
            sm: 4,
          },
        }}
      >
        <PriorityCard
          label="Overdue"
          value={statistics.overdue}
          color="error"
          icon={<WarningAmberOutlinedIcon />}
        />

        <PriorityCard
          label="Due Soon"
          value={statistics.dueSoon}
          color="warning"
          icon={<AccessTimeOutlinedIcon />}
        />

        <PriorityCard
          label="On Track"
          value={Math.max(
            statistics.totalActive - statistics.overdue - statistics.dueSoon,
            0,
          )}
          color="success"
          icon={<EventOutlinedIcon />}
        />
      </Box>

      {/* ACTIVE ORDERS */}

      <Box
        sx={{
          mb: {
            xs: 1.5,
            sm: 2,
          },
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            fontSize: {
              xs: "1.2rem",
              sm: "1.5rem",
            },
          }}
        >
          Active Orders
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: 0.5,
            fontSize: {
              xs: "0.75rem",
              sm: "0.875rem",
            },
          }}
        >
          Orders that still require attention.
        </Typography>
      </Box>

      {recentActiveOrders.length === 0 ? (
        <Card
          elevation={1}
          sx={{
            borderRadius: 2,
          }}
        >
          <CardContent
            sx={{
              py: {
                xs: 4,
                sm: 6,
              },
              textAlign: "center",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: {
                  xs: "1rem",
                  sm: "1.25rem",
                },
              }}
            >
              No active orders
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
              There are currently no orders in production.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack
          spacing={{
            xs: 1.25,
            sm: 2,
          }}
        >
          {recentActiveOrders.map((order) => {
            const priority = getOrderPriority(order.estimatedDeliveryDate);

            return (
              <Card
                key={order.orderNumber}
                elevation={1}
                sx={{
                  borderRadius: 2,
                  overflow: "hidden",
                  borderLeft: {
                    xs: 4,
                    sm: 5,
                  },
                  borderColor: `${getPriorityColor(priority)}.main`,
                }}
              >
                <CardActionArea
                  onClick={() => navigate(`/orders/${order.orderNumber}`)}
                >
                  <CardContent
                    sx={{
                      p: {
                        xs: 1.75,
                        sm: 2,
                      },
                      "&:last-child": {
                        pb: {
                          xs: 1.75,
                          sm: 2,
                        },
                      },
                    }}
                  >
                    <Stack spacing={1.25}>
                      {/* TOP ROW */}

                      <Stack
                        sx={{
                          direction: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                        spacing={1}
                      >
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: {
                              xs: "0.95rem",
                              sm: "1rem",
                            },
                          }}
                        >
                          {order.orderNumber}
                        </Typography>

                        <Chip
                          label={formatStatus(order.status)}
                          color={getStatusColor(order.status)}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: {
                              xs: "0.62rem",
                              sm: "0.75rem",
                            },
                          }}
                        />
                      </Stack>

                      {/* CUSTOMER */}

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

                      <Divider />

                      {/* DELIVERY */}

                      <Stack
                        sx={{
                          direction: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                        spacing={1}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontSize: {
                                xs: "0.65rem",
                                sm: "0.75rem",
                              },
                              variant: "caption",
                              color: "text.secondary",
                              display: "block",
                            }}
                          >
                            Delivery
                          </Typography>

                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 500,
                              fontSize: {
                                xs: "0.8rem",
                                sm: "0.875rem",
                              },
                            }}
                          >
                            {formatDeliveryDate(order.estimatedDeliveryDate)}
                          </Typography>
                        </Box>

                        <Chip
                          icon={getPriorityIcon(priority)}
                          label={getPriorityLabel(priority)}
                          color={getPriorityColor(priority)}
                          size="small"
                          variant="outlined"
                          sx={{
                            flexShrink: 0,
                            fontWeight: 600,
                            fontSize: {
                              xs: "0.6rem",
                              sm: "0.7rem",
                            },
                            "& .MuiChip-icon": {
                              fontSize: {
                                xs: 14,
                                sm: 16,
                              },
                            },
                          }}
                        />
                      </Stack>

                      {/* TAKEN BY */}

                      <Box>
                        <Typography
                          sx={{
                            fontSize: {
                              xs: "0.65rem",
                              sm: "0.75rem",
                            },
                            variant: "caption",
                            color: "text.secondary",
                            display: "block",
                          }}
                        >
                          Taken by
                        </Typography>

                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            fontSize: {
                              xs: "0.8rem",
                              sm: "0.875rem",
                            },
                          }}
                        >
                          {order.takenBy.name}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            );
          })}
        </Stack>
      )}

      {/* FOOTER SUMMARY */}

      <Box
        sx={{
          mt: {
            xs: 2,
            sm: 3,
          },
          pb: {
            xs: 2,
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
          {statistics.totalActive} active order
          {statistics.totalActive === 1 ? "" : "s"} currently being handled.
        </Typography>
      </Box>
    </Box>
  );
}

export default DashboardPage;
