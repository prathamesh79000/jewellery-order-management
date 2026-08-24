import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
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
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";

import { useNavigate } from "react-router-dom";

import { getHistoryOrders } from "../services/orderService";
import { exportCompletedOrdersReport } from "../utils/orderReport";

import type { Order, OrderStatus } from "../types/order";
import { useAuth } from "../contexts/AuthContext";
import { isAdmin } from "../utils/permissions";

type HistoryFilter = "ALL" | "COMPLETED" | "CANCELLED";

function getStatusColor(status: OrderStatus): "success" | "error" | "default" {
  if (status === "COMPLETED") {
    return "success";
  }

  if (status === "CANCELLED") {
    return "error";
  }

  return "default";
}

function formatDate(date: string): string {
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

function HistoryPage() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const adminUser = isAdmin(userProfile);
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<HistoryFilter>("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reportError, setReportError] = useState("");

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

  const completedOrdersCount = useMemo(() => {
    return orders.filter((order) => order.status === "COMPLETED").length;
  }, [orders]);

  const handleExportReport = () => {
    setReportError("");

    if (!fromDate || !toDate) {
      setReportError("Please select both From Date and To Date.");
      return;
    }

    if (fromDate > toDate) {
      setReportError("From Date cannot be after To Date.");
      return;
    }

    const hasCompletedOrders = orders.some(
      (order) => order.status === "COMPLETED" && order.completedAt,
    );

    if (!hasCompletedOrders) {
      setReportError("There are no completed orders available for the report.");
      return;
    }

    try {
      exportCompletedOrdersReport(orders, fromDate, toDate);
    } catch (error) {
      console.error("Failed to export completed orders report:", error);

      setReportError("Failed to generate the Excel report. Please try again.");
    }
  };

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
            sm: 3,
          },
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            fontSize: {
              xs: "1.5rem",
              sm: "2rem",
            },
          }}
        >
          Order History
        </Typography>

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
          View completed and cancelled orders.
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

      {/* HISTORY FILTERS */}

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

      {adminUser && (
        <>
          {/* COMPLETED ORDERS REPORT */}

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
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontSize: {
                    xs: "1rem",
                    sm: "1.2rem",
                  },
                }}
              >
                Completed Orders Report
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
                Export detailed completed-order information with total jewellery
                weight for a selected date range.
              </Typography>
            </Box>

            <Stack
              sx={{
                flexDirection: {
                  xs: "column",
                  sm: "row",
                },
                gap: 2,
                alignItems: {
                  xs: "stretch",
                  sm: "center",
                },
              }}
            >
              <TextField
                fullWidth
                type="date"
                label="From Date"
                value={fromDate}
                onChange={(event) => {
                  setFromDate(event.target.value);
                  setReportError("");
                }}
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />

              <TextField
                fullWidth
                type="date"
                label="To Date"
                value={toDate}
                onChange={(event) => {
                  setToDate(event.target.value);
                  setReportError("");
                }}
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />

              <Button
                variant="contained"
                startIcon={<FileDownloadOutlinedIcon />}
                onClick={handleExportReport}
                sx={{
                  minWidth: {
                    xs: "100%",
                    sm: 190,
                  },
                  minHeight: 44,
                  flexShrink: 0,
                }}
              >
                Export Excel
              </Button>
            </Stack>

            {fromDate && toDate && fromDate > toDate && (
              <Alert
                severity="error"
                sx={{
                  mt: 2,
                  borderRadius: 2,
                }}
              >
                From Date cannot be after To Date.
              </Alert>
            )}

            {reportError && (
              <Alert
                severity="warning"
                sx={{
                  mt: 2,
                  borderRadius: 2,
                }}
              >
                {reportError}
              </Alert>
            )}

            {!loading && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: "block",
                  mt: 1.5,
                }}
              >
                {completedOrdersCount} completed{" "}
                {completedOrdersCount === 1 ? "order" : "orders"} available for
                reporting.
              </Typography>
            )}
          </Paper>
        </>
      )}
      {/* HISTORY LIST */}

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
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
            }}
          >
            No orders found
          </Typography>

          <Typography
            color="text.secondary"
            sx={{
              mt: 1,
            }}
          >
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
                <Box
                  sx={{
                    minWidth: 0,
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
                    {order.orderNumber}
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.5,
                      fontSize: {
                        xs: "0.9rem",
                        sm: "1rem",
                      },
                    }}
                  >
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
                    sx={{
                      fontWeight: 600,
                    }}
                  />

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mt: 1,
                    }}
                  >
                    Delivery: {formatDate(order.estimatedDeliveryDate)}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    Taken by: {order.takenBy.name}
                  </Typography>

                  {order.completedAt && (
                    <Typography variant="body2" color="text.secondary">
                      Completed:{" "}
                      {order.completedAt.toDate().toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </Typography>
                  )}
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
