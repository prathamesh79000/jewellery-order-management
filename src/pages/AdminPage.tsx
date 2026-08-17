import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

import {
  getAllUsers,
  updateUserDisabledStatus,
  type ManagedUser,
} from "../services/userService";

function AdminPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const [updatingUid, setUpdatingUid] = useState<string | null>(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getAllUsers();

        setUsers(data);
      } catch (error) {
        console.error("Failed to load users:", error);

        setError(
          error instanceof Error ? error.message : "Failed to load users.",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadUsers();
  }, []);

  const handleToggleDisabled = async (user: ManagedUser) => {
    try {
      setUpdatingUid(user.uid);
      setError("");
      setSuccessMessage("");

      await updateUserDisabledStatus(user.uid, !user.disabled);

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.uid === user.uid
            ? {
                ...currentUser,
                disabled: !currentUser.disabled,
              }
            : currentUser,
        ),
      );

      setSuccessMessage(
        `${user.name} is now ${user.disabled ? "enabled" : "disabled"}.`,
      );
    } catch (error) {
      console.error("Failed to update user status:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update user status.",
      );
    } finally {
      setUpdatingUid(null);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          py: 8,
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
        maxWidth: 1100,
        mx: "auto",
      }}
    >
      {/* HEADER */}

      <Box sx={{ mb: 3 }}>
        <Stack sx={{ direction: "row", alignItems: "center" }} spacing={1}>
          <AdminPanelSettingsIcon color="primary" />

          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
            }}
          >
            Admin Panel
          </Typography>
        </Stack>

        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Manage staff and system access.
        </Typography>
      </Box>

      {/* ERROR */}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* SUCCESS */}

      {successMessage && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccessMessage("")}
        >
          {successMessage}
        </Alert>
      )}

      {/* STAFF MANAGEMENT */}

      <Paper
        elevation={1}
        sx={{
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        {/* SECTION HEADER */}

        <Box
          sx={{
            p: {
              xs: 2,
              sm: 3,
            },
          }}
        >
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
              }}
            >
              Staff Management
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 0.5,
              }}
            >
              View users and manage their access status.
            </Typography>
          </Box>
        </Box>

        {/* DESKTOP TABLE HEADER */}

        <Box
          sx={{
            display: {
              xs: "none",
              sm: "grid",
            },
            gridTemplateColumns: "1.5fr 1.5fr 1fr 1fr 1fr",
            gap: 2,
            px: 3,
            py: 1.5,
            bgcolor: "action.hover",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
            }}
          >
            NAME
          </Typography>

          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
            }}
          >
            USERNAME
          </Typography>

          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
            }}
          >
            ROLE
          </Typography>

          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
            }}
          >
            STATUS
          </Typography>

          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
            }}
          >
            ACTION
          </Typography>
        </Box>

        {/* USERS */}

        {users.length === 0 ? (
          <Box
            sx={{
              p: 4,
              textAlign: "center",
            }}
          >
            <Typography
              sx={{
                fontWeight: 600,
              }}
            >
              No users found
            </Typography>
          </Box>
        ) : (
          <Stack
            divider={
              <Box
                sx={{
                  borderBottom: 1,
                  borderColor: "divider",
                }}
              />
            }
          >
            {users.map((user) => (
              <Box
                key={user.uid}
                sx={{
                  px: {
                    xs: 2,
                    sm: 3,
                  },
                  py: 2,
                }}
              >
                {/* DESKTOP */}

                <Box
                  sx={{
                    display: {
                      xs: "none",
                      sm: "grid",
                    },
                    gridTemplateColumns: "1.5fr 1.5fr 1fr 1fr 1fr",
                    gap: 2,
                    alignItems: "center",
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 600,
                    }}
                  >
                    {user.name}
                  </Typography>

                  <Typography color="text.secondary">
                    {user.username}
                  </Typography>

                  <Box>
                    <Chip
                      size="small"
                      label={user.role === "admin" ? "Administrator" : "Staff"}
                      color={user.role === "admin" ? "primary" : "default"}
                    />
                  </Box>

                  <Box>
                    <Chip
                      size="small"
                      label={user.disabled ? "Disabled" : "Active"}
                      color={user.disabled ? "error" : "success"}
                    />
                  </Box>

                  <Box>
                    {user.role === "admin" ? (
                      <Typography variant="body2" color="text.secondary">
                        —
                      </Typography>
                    ) : (
                      <Button
                        size="small"
                        variant="outlined"
                        color={user.disabled ? "success" : "error"}
                        disabled={updatingUid === user.uid}
                        onClick={() => handleToggleDisabled(user)}
                      >
                        {updatingUid === user.uid
                          ? "Updating..."
                          : user.disabled
                            ? "Enable"
                            : "Disable"}
                      </Button>
                    )}
                  </Box>
                </Box>

                {/* MOBILE */}

                <Box
                  sx={{
                    display: {
                      xs: "block",
                      sm: "none",
                    },
                  }}
                >
                  <Stack spacing={1.5}>
                    <Box>
                      <Typography
                        sx={{
                          fontWeight: 700,
                        }}
                      >
                        {user.name}
                      </Typography>

                      <Typography variant="body2" color="text.secondary">
                        @{user.username}
                      </Typography>
                    </Box>

                    <Stack
                      sx={{ direction: "row", flexWrap: "wrap" }}
                      spacing={1}
                    >
                      <Chip
                        size="small"
                        label={
                          user.role === "admin" ? "Administrator" : "Staff"
                        }
                        color={user.role === "admin" ? "primary" : "default"}
                      />

                      <Chip
                        size="small"
                        label={user.disabled ? "Disabled" : "Active"}
                        color={user.disabled ? "error" : "success"}
                      />
                    </Stack>

                    {user.role !== "admin" && (
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        color={user.disabled ? "success" : "error"}
                        disabled={updatingUid === user.uid}
                        onClick={() => handleToggleDisabled(user)}
                        sx={{
                          mt: 0.5,
                        }}
                      >
                        {updatingUid === user.uid
                          ? "Updating..."
                          : user.disabled
                            ? "Enable Staff"
                            : "Disable Staff"}
                      </Button>
                    )}
                  </Stack>
                </Box>
              </Box>
            ))}
          </Stack>
        )}
      </Paper>

      {/* INFORMATION */}

      <Alert
        severity="info"
        sx={{
          mt: 2,
          borderRadius: 2,
        }}
      >
        New staff accounts are created directly in Firebase Authentication.
        After creating the account, add the corresponding user profile in
        Firestore.
      </Alert>
    </Box>
  );
}

export default AdminPage;
