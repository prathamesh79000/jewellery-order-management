import { useState } from "react";
import { Alert, Box, Button, Paper, Typography } from "@mui/material";

import { auth } from "../firebase/firebase";
import { createOrder } from "../services/orderService";
import type { Order } from "../types/order";

function OrderCreateTest() {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    try {
      setLoading(true);
      setError("");
      setOrder(null);

      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error("No authenticated user found. Please log in again.");
      }

      const createdOrder = await createOrder({
        customer: {
          name: "Test Customer",
          phone: "9999999999",
        },

        takenBy: {
          uid: currentUser.uid,
          username: "admin",
          name: "Prathamesh",
        },

        estimatedDeliveryDate: "2026-08-25",

        items: [
          {
            id: crypto.randomUUID(),
            itemName: "Test Gold Ring",
            weight: 4.25,
            karagir: "Test Karagir",
            notes: "Size 18",
          },
        ],
      });

      setOrder(createdOrder);
    } catch (err) {
      console.error("Failed to create test order:", err);

      setError(
        err instanceof Error ? err.message : "Failed to create test order.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Paper
        elevation={2}
        sx={{
          p: 4,
          maxWidth: 600,
          mx: "auto",
        }}
      >
        <Typography sx={{ variant: "h5", fontWeight: 700, mb: 1 }}>
          Order Creation Test
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Temporary developer test. This screen will be removed after the
          Firestore test.
        </Typography>

        <Button variant="contained" onClick={handleCreate} disabled={loading}>
          {loading ? "Creating..." : "Create Test Order"}
        </Button>

        {error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
        )}

        {order && (
          <Alert severity="success" sx={{ mt: 3 }}>
            Order created successfully:
            <strong> {order.orderNumber}</strong>
          </Alert>
        )}
      </Paper>
    </Box>
  );
}

export default OrderCreateTest;
