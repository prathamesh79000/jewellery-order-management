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
            alignItems: "center",
            justifyContent: "center",
          }}
          spacing={{
            xs: 0.5,
            sm: 0.75,
          }}
        >
          {/* LABEL */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontSize: {
                xs: "0.72rem",
                sm: "0.875rem",
              },
              fontWeight: 500,
              lineHeight: 1.2,
              textAlign: "center",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </Typography>

          {/* VALUE */}
          <Typography
            sx={{
              fontSize: {
                xs: "1.6rem",
                sm: "2rem",
              },
              lineHeight: 1.1,
              fontWeight: 700,
              textAlign: "center",
            }}
          >
            {value}
          </Typography>

          {/* ICON */}
          <Box
            sx={{
              height: {
                xs: 28,
                sm: 36,
              },
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
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

// interface PriorityCardProps {
//   label: string;
//   value: number;
//   color: "error" | "warning" | "success";
//   icon: React.ReactNode;
// }

// function PriorityCard({ label, value, color, icon }: PriorityCardProps) {
//   return (
//     <Card
//       elevation={1}
//       sx={{
//         borderRadius: 2,
//         height: "100%",
//         borderLeft: 4,
//         borderColor: `${color}.main`,
//       }}
//     >
//       <CardContent
//         sx={{
//           p: {
//             xs: 1.5,
//             sm: 2,
//           },
//           "&:last-child": {
//             pb: {
//               xs: 1.5,
//               sm: 2,
//             },
//           },
//         }}
//       >
//         <Stack
//           sx={{
//             alignItems: "center",
//             justifyContent: "center",
//           }}
//           spacing={{
//             xs: 0.5,
//             sm: 0.75,
//           }}
//         >
//           {/* LABEL */}
//           <Typography
//             variant="body2"
//             color="text.secondary"
//             sx={{
//               fontSize: {
//                 xs: "0.72rem",
//                 sm: "0.875rem",
//               },
//               fontWeight: 500,
//               lineHeight: 1.2,
//               textAlign: "center",
//               whiteSpace: "nowrap",
//             }}
//           >
//             {label}
//           </Typography>

//           {/* VALUE */}
//           <Typography
//             sx={{
//               fontSize: {
//                 xs: "1.6rem",
//                 sm: "2rem",
//               },
//               lineHeight: 1.1,
//               fontWeight: 700,
//               textAlign: "center",
//             }}
//           >
//             {value}
//           </Typography>

//           {/* ICON */}
//           <Box
//             sx={{
//               height: {
//                 xs: 28,
//                 sm: 36,
//               },
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//               color: `${color}.main`,
//               "& svg": {
//                 fontSize: {
//                   xs: 24,
//                   sm: 32,
//                 },
//               },
//             }}
//           >
//             {icon}
//           </Box>
//         </Stack>
//       </CardContent>
//     </Card>
//   );
// }

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

  const todaysDeliveries = useMemo(() => {
    const today = new Date();

    const todayString = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");

    return activeOrders
      .filter((order) => order.estimatedDeliveryDate === todayString)
      .sort((a, b) => a.orderNumber.localeCompare(b.orderNumber));
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
        <Stack
          direction="row"
          spacing={{
            xs: 0.75,
            sm: 1,
          }}
          sx={{
            alignItems: "center",
          }}
        >
          <DashboardIcon
            color="primary"
            sx={{
              fontSize: {
                xs: 22,
                sm: 28,
              },
              flexShrink: 0,
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
              lineHeight: 1.2,
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

      {/* REQUIRES ATTENTION */}

      {/* REQUIRES ATTENTION */}

      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          fontSize: {
            xs: "1.1rem",
            sm: "1.25rem",
          },
          mt: {
            xs: 3,
            sm: 4,
          },
          mb: 1.5,
        }}
      >
        Requires Attention
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(3, minmax(0, 1fr))",
          },
          gap: {
            xs: 1.25,
            sm: 2,
          },
        }}
      >
        {/* OVERDUE */}

        <Card
          elevation={1}
          sx={{
            borderRadius: 2,
            borderLeft: 4,
            borderColor: "error.main",
            height: "100%",
          }}
        >
          <CardActionArea
            onClick={() => navigate("/orders")}
            sx={{
              height: "100%",
            }}
          >
            <CardContent
              sx={{
                minHeight: {
                  xs: 120,
                  sm: 128,
                },
                p: {
                  xs: 1.5,
                  sm: 2,
                },
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
              }}
            >
              <WarningAmberOutlinedIcon
                color="error"
                sx={{
                  fontSize: {
                    xs: 24,
                    sm: 28,
                  },
                  mb: 0.75,
                }}
              />

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontSize: {
                    xs: "0.75rem",
                    sm: "0.875rem",
                  },
                  lineHeight: 1.2,
                }}
              >
                Overdue
              </Typography>

              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: {
                    xs: "1.4rem",
                    sm: "1.6rem",
                  },
                  lineHeight: 1.2,
                  mt: 0.25,
                }}
              >
                {statistics.overdue}
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>

        {/* DUE SOON */}

        <Card
          elevation={1}
          sx={{
            borderRadius: 2,
            borderLeft: 4,
            borderColor: "warning.main",
            height: "100%",
          }}
        >
          <CardActionArea
            onClick={() => navigate("/orders")}
            sx={{
              height: "100%",
            }}
          >
            <CardContent
              sx={{
                minHeight: {
                  xs: 120,
                  sm: 128,
                },
                p: {
                  xs: 1.5,
                  sm: 2,
                },
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
              }}
            >
              <AccessTimeOutlinedIcon
                color="warning"
                sx={{
                  fontSize: {
                    xs: 24,
                    sm: 28,
                  },
                  mb: 0.75,
                }}
              />

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontSize: {
                    xs: "0.75rem",
                    sm: "0.875rem",
                  },
                  lineHeight: 1.2,
                }}
              >
                Due Soon
              </Typography>

              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: {
                    xs: "1.4rem",
                    sm: "1.6rem",
                  },
                  lineHeight: 1.2,
                  mt: 0.25,
                }}
              >
                {statistics.dueSoon}
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>

        {/* TODAY'S DELIVERIES */}

        <Card
          elevation={1}
          sx={{
            borderRadius: 2,
            borderLeft: 4,
            borderColor: "info.main",
            height: "100%",
          }}
        >
          <CardActionArea
            onClick={() => navigate("/orders")}
            sx={{
              height: "100%",
            }}
          >
            <CardContent
              sx={{
                minHeight: {
                  xs: 120,
                  sm: 128,
                },
                p: {
                  xs: 1.5,
                  sm: 2,
                },
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
              }}
            >
              <EventOutlinedIcon
                color="info"
                sx={{
                  fontSize: {
                    xs: 24,
                    sm: 28,
                  },
                  mb: 0.75,
                }}
              />

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontSize: {
                    xs: "0.75rem",
                    sm: "0.875rem",
                  },
                  lineHeight: 1.2,
                }}
              >
                Today's Deliveries
              </Typography>

              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: {
                    xs: "1.4rem",
                    sm: "1.6rem",
                  },
                  lineHeight: 1.2,
                  mt: 0.25,
                }}
              >
                {todaysDeliveries.length}
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>
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
                    {/* ORDER SUMMARY */}

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          sm: "1fr 1fr 1fr",
                        },
                        columnGap: {
                          xs: 0,
                          sm: 3,
                        },
                        rowGap: {
                          xs: 1.5,
                          sm: 0,
                        },
                      }}
                    >
                      {/* CUSTOMER */}

                      <Box
                        sx={{
                          minWidth: 0,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          minHeight: {
                            xs: "auto",
                            sm: 72,
                          },
                        }}
                      >
                        <Typography
                          sx={{
                            fontWeight: 600,
                            fontSize: {
                              xs: "0.9rem",
                              sm: "1rem",
                            },
                            lineHeight: 1.3,
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
                            lineHeight: 1.3,
                          }}
                        >
                          {order.customer.phone}
                        </Typography>
                      </Box>

                      {/* ORDER NUMBER + STATUS */}

                      <Box
                        sx={{
                          minWidth: 0,
                          minHeight: {
                            xs: "auto",
                            sm: 72,
                          },
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: {
                            xs: "flex-start",
                            sm: "center",
                          },
                        }}
                      >
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: {
                              xs: "0.95rem",
                              sm: "1rem",
                            },
                            lineHeight: 1.3,
                          }}
                        >
                          {order.orderNumber}
                        </Typography>

                        <Chip
                          label={formatStatus(order.status)}
                          color={getStatusColor(order.status)}
                          size="small"
                          sx={{
                            mt: 0.75,
                            fontWeight: 600,
                            fontSize: {
                              xs: "0.62rem",
                              sm: "0.7rem",
                            },
                          }}
                        />
                      </Box>

                      {/* DELIVERY */}

                      <Box
                        sx={{
                          minWidth: 0,
                          minHeight: {
                            xs: "auto",
                            sm: 72,
                          },
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "flex-start",
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: "block",
                            fontSize: {
                              xs: "0.65rem",
                              sm: "0.75rem",
                            },
                            lineHeight: 1.2,
                          }}
                        >
                          Delivery
                        </Typography>

                        <Typography
                          sx={{
                            mt: 0.35,
                            fontWeight: 500,
                            fontSize: {
                              xs: "0.8rem",
                              sm: "0.875rem",
                            },
                            lineHeight: 1.3,
                          }}
                        >
                          {formatDeliveryDate(order.estimatedDeliveryDate)}
                        </Typography>

                        <Chip
                          icon={getPriorityIcon(priority)}
                          label={getPriorityLabel(priority)}
                          color={getPriorityColor(priority)}
                          size="small"
                          variant="outlined"
                          sx={{
                            mt: 0.75,
                            fontWeight: 600,
                            fontSize: {
                              xs: "0.58rem",
                              sm: "0.68rem",
                            },
                            height: {
                              xs: 22,
                              sm: 24,
                            },
                            "& .MuiChip-icon": {
                              fontSize: {
                                xs: 13,
                                sm: 15,
                              },
                            },
                          }}
                        />
                      </Box>
                    </Box>

                    <Divider sx={{ my: { xs: 1.5, sm: 2 } }} />

                    {/* TAKEN BY */}

                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: "block",
                          fontSize: {
                            xs: "0.65rem",
                            sm: "0.75rem",
                          },
                          lineHeight: 1.2,
                        }}
                      >
                        Taken by
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{
                          mt: 0.25,
                          fontWeight: 500,
                          fontSize: {
                            xs: "0.8rem",
                            sm: "0.875rem",
                          },
                          lineHeight: 1.3,
                        }}
                      >
                        {order.takenBy.name}
                      </Typography>
                    </Box>
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
