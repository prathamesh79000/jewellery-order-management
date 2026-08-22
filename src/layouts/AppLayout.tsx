import { useState } from "react";
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
  Avatar,
  Divider,
  Menu,
  MenuItem,
} from "@mui/material";

import LogoutIcon from "@mui/icons-material/Logout";
import { isAdmin } from "../utils/permissions";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssignmentIcon from "@mui/icons-material/Assignment";
import HistoryIcon from "@mui/icons-material/History";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
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
  const { userProfile } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen((previous) => !previous);
  };

  const handleNavigation = (path: string) => {
    navigate(path);

    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const menuOpen = Boolean(anchorEl);

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setAnchorEl(null);
    }
  };

  const drawerContent = (
    <Box>
      <Toolbar>
        <Typography sx={{ variant: "h6", fontWeight: 700 }}>
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
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
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
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Order Management
          </Typography>

          <IconButton
            onClick={handleUserMenuOpen}
            color="inherit"
            sx={{
              ml: 1,
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
            <Box sx={{ px: 2, py: 1 }}>
              <Typography sx={{ fontWeight: 700 }}>
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
