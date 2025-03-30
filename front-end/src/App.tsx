import { useEffect, useState } from "react";
import RoleManager from "./components/RoleManager";
import DrugBatchForm from "./components/DrugBatchForm";
import DoctorDashboard from "./components/DoctorDashboard";
import {
  checkDoctorRole,
  checkManufacturerRole,
  checkWholesalerRole,
  checkPharmacyRole,
} from "./services/roleAccessService";
import { fetchActiveWalletAddress } from "./services/walletProvider";

import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";

function App() {
  const [wallet, setWallet] = useState("");
  const [currentRole, setCurrentRole] = useState<string | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const address = await fetchActiveWalletAddress();
        setWallet(address);

        const [isDoctor, isManufacturer, isWholesaler, isPharmacy] = await Promise.all([
          checkDoctorRole(),
          checkManufacturerRole(),
          checkWholesalerRole(),
          checkPharmacyRole(),
        ]);

        if (isManufacturer) setCurrentRole("manufacturer");
        else if (isDoctor) setCurrentRole("doctor");
        else if (isWholesaler) setCurrentRole("wholesaler");
        else if (isPharmacy) setCurrentRole("pharmacy");
        else setCurrentRole(null);
      } catch (err) {
        console.error("Failed to fetch roles or wallet", err);
        setCurrentRole(null);
      }
    };

    loadUserData();
  }, []);

  return (
    <Box sx={{ px: 4, py: 6, backgroundColor: "#f4f6f8", minHeight: "100vh" }}>
      <Box textAlign="center" mb={5}>
        <Typography variant="h3" fontWeight="bold" color="primary" gutterBottom>
          Drug Supply Chain Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          A decentralized platform to track pharmaceutical supply chain.
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          mt={1}
          sx={{ fontFamily: "monospace" }}
        >
          Connected Wallet: {wallet || "Not connected"}
        </Typography>
      </Box>

      {/* Manufacturer */}
      {currentRole === "manufacturer" && <DrugBatchForm />}

      {/* Doctor */}
      {currentRole === "doctor" && <DoctorDashboard />}

      {/* Wholesaler */}
      {currentRole === "wholesaler" && (
        <Paper elevation={3} sx={{ p: 4, mx: "auto", maxWidth: "800px", mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Wholesaler Panel
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography>This is where the wholesaler-related components will go.</Typography>
        </Paper>
      )}

      {/* Pharmacy */}
      {currentRole === "pharmacy" && (
        <Paper elevation={3} sx={{ p: 4, mx: "auto", maxWidth: "800px", mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Pharmacy Panel
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography>This is where the pharmacy-related components will go.</Typography>
        </Paper>
      )}

      {/* Admin */}
      {currentRole === null && <RoleManager />}
    </Box>
  );
}

export default App;
