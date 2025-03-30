import { useEffect, useState } from "react";
import {
  assignDoctorRole,
  assignManufacturerRole,
  assignWholesalerRole,
  assignPharmacyRole,
} from "../services/roleAccessService";
import { fetchActiveWalletAddress } from "../services/walletProvider";
import Web3 from "web3";
import RoleAccessABI from "../abi/RoleAccessControl.json";
import { CONTRACT_ADDRESSES } from "../constants/contracts";

import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import MenuItem from "@mui/material/MenuItem";

const CONTRACT_ADDRESS = CONTRACT_ADDRESSES.RoleAccessControl;

const RoleManager = () => {
  const [currentAccount, setCurrentAccount] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [address, setAddress] = useState<string>("");
  const [role, setRole] = useState<string>("doctor");
  const [status, setStatus] = useState<{ message: string; type: "success" | "error" | "" }>({
    message: "",
    type: "",
  });

  const checkIfAdmin = async (account: string) => {
    try {
      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(RoleAccessABI.abi, CONTRACT_ADDRESS);
      const adminRole = await contract.methods.DEFAULT_ADMIN_ROLE().call();
      const isAdmin = await contract.methods.hasRole(adminRole, account).call();
      setIsAdmin(Boolean(isAdmin));
    } catch (error) {
      console.error("Admin check failed:", error);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const account = await fetchActiveWalletAddress();
        setCurrentAccount(account);
        await checkIfAdmin(account);
      } catch (err) {
        console.error("Wallet not connected");
        setIsAdmin(false);
      }
    };

    init();
  }, []);

  const handleAssignRole = async () => {
    try {
      setStatus({ message: "Assigning role...", type: "" });

      switch (role) {
        case "doctor":
          await assignDoctorRole(address);
          break;
        case "manufacturer":
          await assignManufacturerRole(address);
          break;
        case "wholesaler":
          await assignWholesalerRole(address);
          break;
        case "pharmacy":
          await assignPharmacyRole(address);
          break;
        default:
          throw new Error("Invalid role");
      }

      setStatus({
        message: `Role '${role}' assigned to ${address}`,
        type: "success",
      });
      setAddress("");
    } catch (err: any) {
      console.error(err);
      setStatus({ message: `Error: ${err.message}`, type: "error" });
    }
  };

  if (isAdmin === false || isAdmin === null) return null;

  return (
    <Box sx={{ width: "100%", py: 4, backgroundColor: "#f9fafb" }}>
      <Container maxWidth="md">
        <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h5" fontWeight="bold" textAlign="center" gutterBottom>
            Assign Role
          </Typography>

          <Typography variant="body2" color="text.secondary" textAlign="center" mb={2}>
            Connected Wallet: <span style={{ fontFamily: "monospace" }}>{currentAccount}</span>
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Box display="flex" flexDirection="column" gap={3}>
            <TextField
              label="Wallet Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="0x..."
              fullWidth
            />

            <TextField
              select
              label="Select Role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              fullWidth
            >
              <MenuItem value="doctor">Doctor</MenuItem>
              <MenuItem value="manufacturer">Manufacturer</MenuItem>
              <MenuItem value="wholesaler">Wholesaler</MenuItem>
              <MenuItem value="pharmacy">Pharmacy</MenuItem>
            </TextField>

            <Button
              variant="contained"
              onClick={handleAssignRole}
              disabled={!address}
              sx={{ textTransform: "none" }}
            >
              Assign Role
            </Button>

            {status.message && (
              <Alert severity={status.type === "success" ? "success" : "error"}>
                {status.message}
              </Alert>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default RoleManager;
