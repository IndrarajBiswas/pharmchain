import { useEffect, useState } from "react";

// Extend the Window interface to include the contract property
declare global {
  interface Window {
    contract: any;
  }
}
import {
  fulfillPrescription,
  getPrescriptionDetails,
} from "../services/prescriptionService";
import { PinataIPFSService } from "../services/pinataIPFSService";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";

const PharmacyDashboard = () => {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    const init = async () => {
      setStatus("");
      try {
        const events = await window.contract.getPastEvents("PrescriptionIssued", {
          fromBlock: 0,
          toBlock: "latest",
        });

        const details = await Promise.all(
          events.map(async (e: any) => {
            const data = await getPrescriptionDetails(e.returnValues.prescriptionId);
            if (!data.fulfilled) {
              const resolvedCID = await PinataIPFSService.resolveCID(data.ipfsCID);
              return { ...data, resolvedCID };
            }
            return null;
          })
        );

        setPrescriptions(details.filter(Boolean));
      } catch (err: any) {
        console.error("Failed to load prescriptions:", err);
        setStatus(`Error: ${err.message}`);
      }
    };

    init();
  }, []);

  const handleFulfill = async (prescriptionId: string) => {
    setLoading(true);
    setStatus("");
    try {
      await fulfillPrescription(prescriptionId);
      setPrescriptions((prev) =>
        prev.map((p) =>
          p.prescriptionId === prescriptionId ? { ...p, fulfilled: true } : p
        )
      );
      setStatus("✅ Prescription fulfilled successfully.");
    } catch (err: any) {
      console.error("Fulfillment error:", err);
      setStatus(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: "100%", py: 4, backgroundColor: "#f9fafb" }}>
      <Container maxWidth="md">
        <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h5" fontWeight="bold" textAlign="center" gutterBottom>
            Pharmacy Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" mb={2}>
            View and fulfill pending prescriptions issued by doctors.
          </Typography>

          <Divider sx={{ my: 2 }} />

          {prescriptions.length === 0 && (
            <Typography textAlign="center">No pending prescriptions found.</Typography>
          )}

          <Box display="flex" flexDirection="column" gap={3}>
            {prescriptions.map((p) => (
              <Paper key={p.prescriptionId} variant="outlined" sx={{ p: 3 }}>
                <Typography fontWeight="bold">Prescription ID:</Typography>
                <Typography>{p.prescriptionId}</Typography>
                <Typography>Batch ID: {p.batchId}</Typography>
                <Typography>Patient: {p.patient}</Typography>
                <Typography>Issued At: {new Date(p.issuedAt * 1000).toLocaleString()}</Typography>
                <Typography>
                  File: <a href={p.resolvedCID} target="_blank" rel="noreferrer">View</a>
                </Typography>
                <Button
                  variant="contained"
                  color="success"
                  disabled={loading || p.fulfilled}
                  sx={{ mt: 2 }}
                  onClick={() => handleFulfill(p.prescriptionId)}
                >
                  {loading ? "Fulfilling..." : "Fulfill Prescription"}
                </Button>
              </Paper>
            ))}

            {status && (
              <Alert severity={status.includes("success") ? "success" : "error"}>{status}</Alert>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default PharmacyDashboard;
