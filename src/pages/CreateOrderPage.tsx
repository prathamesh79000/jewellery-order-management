import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { createNotification } from "../services/notificationService";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import { auth } from "../firebase/firebase";
import { useAuth } from "../contexts/AuthContext";
import { createOrder } from "../services/orderService";

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

function CreateOrderPage() {
  const { userProfile } = useAuth();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState("");

  const [items, setItems] = useState<OrderItemForm[]>([createEmptyItem()]);

  const [customerNameError, setCustomerNameError] = useState("");
  const [customerPhoneError, setCustomerPhoneError] = useState("");
  const [deliveryDateError, setDeliveryDateError] = useState("");

  const [itemErrors, setItemErrors] = useState<Record<string, OrderItemErrors>>(
    {},
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [submitError, setSubmitError] = useState("");

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

  const addItem = () => {
    setItems((currentItems) => [...currentItems, createEmptyItem()]);

    setSuccessMessage("");
    setSubmitError("");
  };

  const removeItem = (itemId: string) => {
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

  const validateForm = (): boolean => {
    let isValid = true;

    setCustomerNameError("");
    setCustomerPhoneError("");
    setDeliveryDateError("");
    setItemErrors({});
    setSubmitError("");

    // CUSTOMER NAME

    if (!customerName.trim()) {
      setCustomerNameError("Customer name is required.");
      isValid = false;
    }

    // CUSTOMER PHONE

    const cleanPhone = customerPhone.replace(/\D/g, "");

    if (!cleanPhone) {
      setCustomerPhoneError("Customer phone is required.");
      isValid = false;
    } else if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setCustomerPhoneError("Enter a valid 10-digit Indian mobile number.");
      isValid = false;
    }

    // DELIVERY DATE

    if (!estimatedDeliveryDate) {
      setDeliveryDateError("Estimated delivery date is required.");
      isValid = false;
    } else if (estimatedDeliveryDate < getTodayDate()) {
      setDeliveryDateError("Delivery date cannot be before today.");
      isValid = false;
    }

    // ITEMS

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

  const resetForm = () => {
    setCustomerName("");
    setCustomerPhone("");
    setEstimatedDeliveryDate("");

    setItems([createEmptyItem()]);

    setCustomerNameError("");
    setCustomerPhoneError("");
    setDeliveryDateError("");
    setItemErrors({});
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSuccessMessage("");
    setSubmitError("");

    if (!validateForm()) {
      return;
    }

    if (!userProfile || !auth.currentUser) {
      setSubmitError(
        "Your login session could not be verified. Please log in again.",
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const order = await createOrder({
        customer: {
          name: customerName.trim(),
          phone: customerPhone.replace(/\D/g, ""),
        },

        takenBy: {
          uid: auth.currentUser!.uid,
          username: userProfile.username,
          name: userProfile.name,
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
      try {
        await createNotification({
          type: "NEW_ORDER",
          title: "New Order Created",
          message: `${order.orderNumber} has been created successfully.`,
          orderNumber: order.orderNumber,
          createdByUid: auth.currentUser.uid,
          createdByName: userProfile.name,
        });
      } catch (notificationError) {
        console.error(
          "Order created successfully, but notification could not be created:",
          notificationError,
        );
      }

      setSuccessMessage(`Order ${order.orderNumber} created successfully.`);

      resetForm();
    } catch (error) {
      console.error("Failed to create order:", error);

      setSubmitError(
        error instanceof Error
          ? error.message
          : "Failed to create order. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 1000,
        mx: "auto",
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
          }}
        >
          Create New Order
        </Typography>

        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Enter the customer's order details.
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
                setSuccessMessage("");
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
                setSuccessMessage("");
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
              label="Order Taken By"
              value={
                userProfile
                  ? `${userProfile.name} (${userProfile.username})`
                  : ""
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
                setSuccessMessage("");
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
                Add every item included in this order.
              </Typography>
            </Box>
          </Box>

          <Stack spacing={3}>
            {items.map((item, index) => {
              const errors = itemErrors[item.id] ?? {};

              return (
                <Box key={item.id}>
                  {index > 0 && <Divider sx={{ mb: 3 }} />}

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

        {/* SUBMIT */}

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            pb: 4,
          }}
        >
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isSubmitting}
            sx={{
              minWidth: {
                xs: "100%",
                sm: 200,
              },
            }}
          >
            {isSubmitting ? "Creating Order..." : "Submit Order"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default CreateOrderPage;
