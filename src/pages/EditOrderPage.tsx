import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import { useNavigate, useParams } from "react-router-dom";

import { getOrderByNumber, updateOrder } from "../services/orderService";

import type { Order } from "../types/order";

interface OrderItemForm {
  id: string;
  itemName: string;
  weight: string;
  karagir: string;
  notes: string;
}

interface OrderItemErrors {
  itemName?: string;
  weight?: string;
  karagir?: string;
}

function createEmptyItem(): OrderItemForm {
  return {
    id: crypto.randomUUID(),
    itemName: "",
    weight: "",
    karagir: "",
    notes: "",
  };
}

function getTodayDate(): string {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function EditOrderPage() {
  const navigate = useNavigate();

  const { orderNumber } = useParams<{
    orderNumber: string;
  }>();

  const [order, setOrder] = useState<Order | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState("");

  const [items, setItems] = useState<OrderItemForm[]>([]);

  const [customerNameError, setCustomerNameError] = useState("");

  const [customerPhoneError, setCustomerPhoneError] = useState("");

  const [deliveryDateError, setDeliveryDateError] = useState("");

  const [itemErrors, setItemErrors] = useState<Record<string, OrderItemErrors>>(
    {},
  );

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");

  const [submitError, setSubmitError] = useState("");

  /*
   * LOAD EXISTING ORDER
   */

  useEffect(() => {
    if (!orderNumber) {
      setSubmitError("Order number is missing.");
      setLoading(false);
      return;
    }

    let mounted = true;

    const loadOrder = async () => {
      try {
        setLoading(true);
        setSubmitError("");

        const existingOrder = await getOrderByNumber(orderNumber);

        if (!mounted) {
          return;
        }

        if (!existingOrder) {
          setSubmitError("Order not found.");
          return;
        }

        /*
         * Completed and cancelled orders
         * cannot be edited.
         */
        if (
          existingOrder.status === "COMPLETED" ||
          existingOrder.status === "CANCELLED"
        ) {
          setSubmitError("Completed or cancelled orders cannot be edited.");
          setOrder(existingOrder);
          return;
        }

        setOrder(existingOrder);

        setCustomerName(existingOrder.customer.name);

        setCustomerPhone(existingOrder.customer.phone);

        setEstimatedDeliveryDate(existingOrder.estimatedDeliveryDate);

        setItems(
          existingOrder.items.map((item) => ({
            id: item.id,
            itemName: item.itemName,
            weight: String(item.weight),
            karagir: item.karagir,
            notes: item.notes,
          })),
        );
      } catch (error) {
        console.error("Failed to load order:", error);

        if (mounted) {
          setSubmitError(
            error instanceof Error ? error.message : "Failed to load order.",
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

  /*
   * ITEM UPDATE
   */

  const updateItem = (
    itemId: string,
    field: keyof OrderItemForm,
    value: string,
  ) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );

    setItemErrors((currentErrors) => {
      const currentItemErrors = currentErrors[itemId];

      if (!currentItemErrors) {
        return currentErrors;
      }

      const updatedItemErrors = {
        ...currentItemErrors,
      };

      delete updatedItemErrors[field as keyof OrderItemErrors];

      return {
        ...currentErrors,
        [itemId]: updatedItemErrors,
      };
    });

    setSubmitError("");
    setSuccessMessage("");
  };

  /*
   * ADD ITEM
   */

  const addItem = () => {
    setItems((currentItems) => [...currentItems, createEmptyItem()]);

    setSuccessMessage("");
    setSubmitError("");
  };

  /*
   * REMOVE ITEM
   */

  const removeItem = (itemId: string) => {
    /*
     * Never allow the order to have zero items.
     */
    if (items.length <= 1) {
      return;
    }

    setItems((currentItems) =>
      currentItems.filter((item) => item.id !== itemId),
    );

    setItemErrors((currentErrors) => {
      const updatedErrors = {
        ...currentErrors,
      };

      delete updatedErrors[itemId];

      return updatedErrors;
    });
  };

  /*
   * VALIDATION
   */

  const validateForm = (): boolean => {
    let isValid = true;

    setCustomerNameError("");
    setCustomerPhoneError("");
    setDeliveryDateError("");
    setItemErrors({});
    setSubmitError("");

    /*
     * CUSTOMER NAME
     */

    if (!customerName.trim()) {
      setCustomerNameError("Customer name is required.");

      isValid = false;
    }

    /*
     * CUSTOMER PHONE
     */

    const cleanPhone = customerPhone.replace(/\D/g, "");

    if (!cleanPhone) {
      setCustomerPhoneError("Customer phone is required.");

      isValid = false;
    } else if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setCustomerPhoneError("Enter a valid 10-digit Indian mobile number.");

      isValid = false;
    }

    /*
     * DELIVERY DATE
     */

    if (!estimatedDeliveryDate) {
      setDeliveryDateError("Estimated delivery date is required.");

      isValid = false;
    } else if (estimatedDeliveryDate < getTodayDate()) {
      setDeliveryDateError("Delivery date cannot be before today.");

      isValid = false;
    }

    /*
     * ITEMS
     */

    const errors: Record<string, OrderItemErrors> = {};

    items.forEach((item) => {
      const currentErrors: OrderItemErrors = {};

      if (!item.itemName.trim()) {
        currentErrors.itemName = "Item name is required.";

        isValid = false;
      }

      if (!item.weight.trim()) {
        currentErrors.weight = "Weight is required.";

        isValid = false;
      } else {
        const weight = Number(item.weight);

        if (!Number.isFinite(weight) || weight <= 0) {
          currentErrors.weight = "Weight must be greater than 0.";

          isValid = false;
        }
      }

      if (!item.karagir.trim()) {
        currentErrors.karagir = "Karagir name is required.";

        isValid = false;
      }

      if (Object.keys(currentErrors).length > 0) {
        errors[item.id] = currentErrors;
      }
    });

    setItemErrors(errors);

    return isValid;
  };

  /*
   * SAVE
   */

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSuccessMessage("");
    setSubmitError("");

    if (!validateForm()) {
      return;
    }

    if (!orderNumber || !order) {
      setSubmitError("Order could not be identified.");

      return;
    }

    try {
      setIsSaving(true);

      await updateOrder(orderNumber, {
        customer: {
          name: customerName.trim(),
          phone: customerPhone.replace(/\D/g, ""),
        },

        estimatedDeliveryDate,

        items: items.map((item) => ({
          id: item.id,
          itemName: item.itemName.trim(),
          weight: Number(item.weight),
          karagir: item.karagir.trim(),
          notes: item.notes.trim(),
        })),
      });

      setSuccessMessage(`Order ${order.orderNumber} updated successfully.`);

      /*
       * Give the user a moment to see the success
       * message before returning to the details page.
       */
      setTimeout(() => {
        navigate(`/orders/${order.orderNumber}`, {
          replace: true,
        });
      }, 800);
    } catch (error) {
      console.error("Failed to update order:", error);

      setSubmitError(
        error instanceof Error
          ? error.message
          : "Failed to update order. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  /*
   * LOADING
   */

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

  /*
   * RENDER
   */

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
        onClick={() =>
          navigate(orderNumber ? `/orders/${orderNumber}` : "/orders")
        }
        sx={{ mb: 2 }}
      >
        Back to Order
      </Button>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Edit Order
        </Typography>

        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          {order?.orderNumber
            ? `Update details for ${order.orderNumber}.`
            : "Update order details."}
        </Typography>
      </Box>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {submitError}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        {/* CUSTOMER DETAILS */}

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
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: 2,
            }}
          >
            Customer Details
          </Typography>

          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={2}
          >
            <TextField
              fullWidth
              required
              label="Customer Name"
              value={customerName}
              onChange={(event) => {
                setCustomerName(event.target.value);
                setCustomerNameError("");
                setSubmitError("");
              }}
              error={Boolean(customerNameError)}
              helperText={customerNameError}
            />

            <TextField
              fullWidth
              required
              label="Customer Phone"
              value={customerPhone}
              onChange={(event) => {
                const value = event.target.value;

                if (value.length <= 10 && /^\d*$/.test(value)) {
                  setCustomerPhone(value);
                }

                setCustomerPhoneError("");
                setSubmitError("");
              }}
              inputMode="numeric"
              error={Boolean(customerPhoneError)}
              helperText={customerPhoneError}
            />
          </Stack>
        </Paper>

        {/* ORDER DETAILS */}

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
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: 2,
            }}
          >
            Order Details
          </Typography>

          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Order Number"
              value={order?.orderNumber ?? ""}
              slotProps={{
                input: {
                  readOnly: true,
                },
              }}
            />

            <TextField
              fullWidth
              label="Order Taken By"
              value={
                order ? `${order.takenBy.name} (${order.takenBy.username})` : ""
              }
              slotProps={{
                input: {
                  readOnly: true,
                },
              }}
            />

            <TextField
              fullWidth
              required
              type="date"
              label="Estimated Delivery Date"
              value={estimatedDeliveryDate}
              onChange={(event) => {
                setEstimatedDeliveryDate(event.target.value);
                setDeliveryDateError("");
                setSubmitError("");
              }}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
                htmlInput: {
                  min: getTodayDate(),
                },
              }}
              error={Boolean(deliveryDateError)}
              helperText={deliveryDateError}
            />
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
              mb: 2,
            }}
          >
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                }}
              >
                Items
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Update every item included in this order.
              </Typography>
            </Box>
          </Box>

          <Stack spacing={3}>
            {items.map((item, index) => {
              const errors = itemErrors[item.id] ?? {};

              return (
                <Box key={item.id}>
                  {index > 0 && (
                    <Divider
                      sx={{
                        mb: 3,
                      }}
                    />
                  )}

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      Item {index + 1}
                    </Typography>

                    {items.length > 1 && (
                      <Button
                        type="button"
                        color="error"
                        size="small"
                        startIcon={<DeleteOutlineIcon />}
                        onClick={() => removeItem(item.id)}
                      >
                        Remove
                      </Button>
                    )}
                  </Box>

                  <Stack spacing={2}>
                    <TextField
                      fullWidth
                      required
                      label="Item Name"
                      placeholder="e.g. Gold Ring"
                      value={item.itemName}
                      onChange={(event) =>
                        updateItem(item.id, "itemName", event.target.value)
                      }
                      error={Boolean(errors.itemName)}
                      helperText={errors.itemName}
                    />

                    <Stack
                      direction={{
                        xs: "column",
                        sm: "row",
                      }}
                      spacing={2}
                    >
                      <TextField
                        fullWidth
                        required
                        label="Weight (grams)"
                        placeholder="e.g. 4.25"
                        value={item.weight}
                        onChange={(event) => {
                          const value = event.target.value;

                          if (value === "" || /^\d*\.?\d*$/.test(value)) {
                            updateItem(item.id, "weight", value);
                          }
                        }}
                        inputMode="decimal"
                        error={Boolean(errors.weight)}
                        helperText={errors.weight}
                      />

                      <TextField
                        fullWidth
                        required
                        label="Karagir"
                        placeholder="Enter karagir name"
                        value={item.karagir}
                        onChange={(event) =>
                          updateItem(item.id, "karagir", event.target.value)
                        }
                        error={Boolean(errors.karagir)}
                        helperText={errors.karagir}
                      />
                    </Stack>

                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      label="Item Notes"
                      placeholder="e.g. Ring size 18, chain length 22 inches"
                      value={item.notes}
                      onChange={(event) =>
                        updateItem(item.id, "notes", event.target.value)
                      }
                    />
                  </Stack>
                </Box>
              );
            })}
          </Stack>

          <Button
            type="button"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addItem}
            sx={{ mt: 3 }}
          >
            Add Another Item
          </Button>
        </Paper>

        {/* SAVE */}

        <Box
          sx={{
            display: "flex",
            justifyContent: {
              xs: "stretch",
              sm: "flex-end",
            },
            gap: 2,
            pb: 4,
          }}
        >
          <Button
            type="button"
            variant="outlined"
            onClick={() =>
              navigate(orderNumber ? `/orders/${orderNumber}` : "/orders")
            }
            disabled={isSaving}
            sx={{
              minWidth: {
                xs: 0,
                sm: 140,
              },
            }}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={
              isSaving ||
              !order ||
              order.status === "COMPLETED" ||
              order.status === "CANCELLED"
            }
            sx={{
              minWidth: {
                xs: 0,
                sm: 180,
              },
            }}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default EditOrderPage;
