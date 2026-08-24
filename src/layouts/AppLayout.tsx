import { useEffect, useState } from "react";
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Popover,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import LogoutIcon from "@mui/icons-material/Logout";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssignmentIcon from "@mui/icons-material/Assignment";
import HistoryIcon from "@mui/icons-material/History";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import MenuIcon from "@mui/icons-material/Menu";
import {
  subscribeToNotifications,
  markNotificationAsRead,
} from "../services/notificationService";
import type { Notification } from "../types/notification";

import { isAdmin } from "../utils/permissions";
import { useAuth } from "../contexts/AuthContext";
import { logoutUser } from "../services/authService";

import { Outlet, useNavigate } from "react-router-dom";

const drawerWidth = 240;

const navigationItems = [
  {
    label: "Dashboard",
    icon: <DashboardIcon />,
    adminOnly: false,
  },
  {
    label: "Orders",
    icon: <AssignmentIcon />,
    adminOnly: false,
  },
  {
    label: "History",
    icon: <HistoryIcon />,
    adminOnly: false,
  },
  {
    label: "Admin",
    icon: <AdminPanelSettingsIcon />,
    adminOnly: true,
  },
];

function AppLayout() {
  const navigate = useNavigate();
  const { firebaseUser, userProfile } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [mobileOpen, setMobileOpen] = useState(false);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const [notificationAnchorEl, setNotificationAnchorEl] =
    useState<null | HTMLElement>(null);

  /*
   * Temporary local notification state.
   *
   * This will be replaced with Firestore realtime
   * notifications in the next Phase 8 step.
   */
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const menuOpen = Boolean(anchorEl);

  const notificationMenuOpen = Boolean(notificationAnchorEl);

  const unreadNotificationCount = notifications.filter(
    (notification) =>
      firebaseUser && notification.readBy?.[firebaseUser.uid] !== true,
  ).length;

  const handleDrawerToggle = () => {
    setMobileOpen((previous) => !previous);
  };

  const handleNavigation = (path: string) => {
    navigate(path);

    if (isMobile) {
      setMobileOpen(false);
    }
  };
  useEffect(() => {
    if (!firebaseUser) {
      setNotifications([]);
      return;
    }

    const unsubscribe = subscribeToNotifications(setNotifications);

    return unsubscribe;
  }, [firebaseUser]);

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (firebaseUser && notification.readBy?.[firebaseUser.uid] !== true) {
        await markNotificationAsRead(notification.id, firebaseUser.uid);
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    } finally {
      setNotificationAnchorEl(null);

      navigate(`/orders/${notification.orderNumber}`);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setAnchorEl(null);
      setNotificationAnchorEl(null);
    }
  };

  const drawerContent = (
    <Box>
      <Toolbar>
        <Typography
          sx={{
            fontWeight: 700,
          }}
        >
          Hardik Jewellers
        </Typography>
      </Toolbar>

      <List>
        {navigationItems
          .filter((item) => !item.adminOnly || isAdmin(userProfile))
          .map((item) => (
            <ListItemButton
              key={item.label}
              onClick={() => {
                if (item.label === "Dashboard") {
                  handleNavigation("/");
                }

                if (item.label === "Orders") {
                  handleNavigation("/orders");
                }

                if (item.label === "History") {
                  handleNavigation("/history");
                }

                if (item.label === "Admin") {
                  handleNavigation("/admin");
                }
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>

              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
      </List>
    </Box>
  );

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
      }}
    >
      <AppBar
        position="fixed"
        sx={{
          width: {
            md: `calc(100% - ${drawerWidth}px)`,
          },
          ml: {
            md: `${drawerWidth}px`,
          },
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{
                mr: 2,
              }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
            }}
          >
            Order Management
          </Typography>

          {/* NOTIFICATIONS */}

          <IconButton
            color="inherit"
            onClick={handleNotificationOpen}
            aria-label="Notifications"
            sx={{
              ml: 0.5,
            }}
          >
            <Badge
              badgeContent={unreadNotificationCount}
              color="error"
              max={99}
              invisible={unreadNotificationCount === 0}
            >
              <NotificationsNoneOutlinedIcon />
            </Badge>
          </IconButton>

          {/* USER MENU */}

          <IconButton
            onClick={handleUserMenuOpen}
            color="inherit"
            sx={{
              ml: 0.5,
            }}
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: "secondary.main",
                fontSize: 15,
              }}
            >
              {userProfile?.name?.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>

          {/* NOTIFICATION POPOVER */}

          <Popover
            open={notificationMenuOpen}
            anchorEl={notificationAnchorEl}
            onClose={handleNotificationClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            slotProps={{
              paper: {
                sx: {
                  width: {
                    xs: "calc(100vw - 24px)",
                    sm: 360,
                  },
                  maxWidth: 360,
                  borderRadius: 2,
                  mt: 1,
                },
              },
            }}
          >
            <Box
              sx={{
                px: 2,
                py: 1.5,
              }}
            >
              <Typography
                sx={{
                  fontWeight: 700,
                }}
              >
                Notifications
              </Typography>
            </Box>

            <Divider />

            {notifications.length === 0 ? (
              <Box
                sx={{
                  px: 2,
                  py: 4,
                  textAlign: "center",
                }}
              >
                <NotificationsNoneOutlinedIcon
                  sx={{
                    fontSize: 38,
                    color: "text.disabled",
                  }}
                />

                <Typography
                  sx={{
                    mt: 1,
                    fontWeight: 600,
                  }}
                >
                  No notifications
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mt: 0.5,
                  }}
                >
                  You're all caught up.
                </Typography>
              </Box>
            ) : (
              <List
                disablePadding
                sx={{
                  maxHeight: 420,
                  overflowY: "auto",
                }}
              >
                {notifications.map((notification) => (
                  <ListItemButton
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    sx={{
                      px: 2,
                      py: 1.5,
                      alignItems: "flex-start",
                      backgroundColor:
                        firebaseUser &&
                        notification.readBy?.[firebaseUser.uid] === true
                          ? "transparent"
                          : "action.hover",
                      "&:hover": {
                        backgroundColor: "action.selected",
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 36,
                        mt: 0.25,
                      }}
                    >
                      <NotificationsNoneOutlinedIcon fontSize="small" />
                    </ListItemIcon>

                    <ListItemText
                      primary={
                        <Typography
                          sx={{
                            fontWeight:
                              firebaseUser &&
                              notification.readBy?.[firebaseUser.uid] === true
                                ? 500
                                : 700,
                            fontSize: "0.9rem",
                          }}
                        >
                          {notification.title}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              mt: 0.25,
                            }}
                          >
                            {notification.message}
                          </Typography>

                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              display: "block",
                              mt: 0.5,
                            }}
                          >
                            {notification.createdAt
                              ?.toDate()
                              .toLocaleString("en-IN", {
                                day: "numeric",
                                month: "short",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItemButton>
                ))}
              </List>
            )}
          </Popover>

          {/* USER POPOVER */}

          <Menu
            anchorEl={anchorEl}
            open={menuOpen}
            onClose={handleUserMenuClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
          >
            <Box
              sx={{
                px: 2,
                py: 1,
              }}
            >
              <Typography
                sx={{
                  fontWeight: 700,
                }}
              >
                {userProfile?.name}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {userProfile?.role === "admin" ? "Administrator" : "Staff"}
              </Typography>
            </Box>

            <Divider />

            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* NAVIGATION DRAWER */}

      <Box
        component="nav"
        sx={{
          width: {
            md: drawerWidth,
          },
          flexShrink: {
            md: 0,
          },
        }}
      >
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              "& .MuiDrawer-paper": {
                width: drawerWidth,
                boxSizing: "border-box",
              },
            }}
          >
            {drawerContent}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            open
            sx={{
              "& .MuiDrawer-paper": {
                width: drawerWidth,
                boxSizing: "border-box",
              },
            }}
          >
            {drawerContent}
          </Drawer>
        )}
      </Box>

      {/* MAIN CONTENT */}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: {
            xs: 2,
            sm: 3,
          },
          mt: 8,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}

export default AppLayout;
