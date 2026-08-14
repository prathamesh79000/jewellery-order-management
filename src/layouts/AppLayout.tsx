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
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssignmentIcon from "@mui/icons-material/Assignment";
import HistoryIcon from "@mui/icons-material/History";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

const drawerWidth = 240;

const navigationItems = [
  {
    label: "Dashboard",
    icon: <DashboardIcon />,
  },
  {
    label: "Orders",
    icon: <AssignmentIcon />,
  },
  {
    label: "History",
    icon: <HistoryIcon />,
  },
  {
    label: "Admin",
    icon: <AdminPanelSettingsIcon />,
  },
];

function AppLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen((previous) => !previous);
  };

  const drawerContent = (
    <Box>
      <Toolbar>
        <Typography sx={{ variant: "h6", fontWeight: 700 }}>
          Hardik Jewellers
        </Typography>
      </Toolbar>

      <List>
        {navigationItems.map((item) => (
          <ListItemButton key={item.label}>
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

          <Typography variant="body2">User</Typography>
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
        <Typography sx={{ variant: "h4", fontWeight: 700 }}>
          Welcome to Hardik Jewellers
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Order management system
        </Typography>
      </Box>
    </Box>
  );
}

export default AppLayout;
