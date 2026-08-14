import { Box, Typography } from "@mui/material";

function AdminPage() {
  return (
    <Box>
      <Typography sx={{ variant: "h4", fontWeight: 700 }}>
        Admin Panel
      </Typography>

      <Typography color="text.secondary" sx={{ mt: 1 }}>
        Admin-only area.
      </Typography>
    </Box>
  );
}

export default AdminPage;
