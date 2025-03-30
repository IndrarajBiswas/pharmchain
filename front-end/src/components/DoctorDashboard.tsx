import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { isAddress } from "ethers";
import {
  getAllBatches,
  getBatchDetails
} from "../services/drugBatchService";
import { issuePrescription } from "../services/prescriptionService";
import { PinataIPFSService } from "../services/pinataIPFSService";
import { fetchActiveWalletAddress } from "../services/walletProvider";
import { checkDoctorRole } from "../services/roleAccessService";

import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Container,
  Paper,
  Alert,
  Divider
} from "@mui/material";

const DoctorDashboard = () => {
  const [wallet, setWallet] = useState<string>("");
  const [isDoctor, setIsDoctor] = useState<boolean | null>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<any | null>(null);
  const [prescriptionId, setPrescriptionId] = useState<string>(uuidv4());
  const [patient, setPatient] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      try {
        const account = await fetchActiveWalletAddress();
        setWallet(account);
        const hasRole = await checkDoctorRole();
        setIsDoctor(hasRole);

        const result = await getAllBatches();
        setBatches(result);
      } catch (error) {
        console.error("Initialization failed:", error);
        setIsDoctor(false);
      }
    };
    init();
  }, []);

  const handleSelectBatch = async (batchId: string) => {
    const details = await getBatchDetails(batchId);
    setSelectedBatch({ ...details, batchId });
    setStatus("");
    setPatient("");
    setFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedBatch || !selectedBatch.batchId || !prescriptionId || !patient || !file) {
      console.log("Validation failed:", {
        selectedBatch,
        prescriptionId,
        patient,
        file,
      });
      setStatus("All fields are required.");
      return;
    }

    if (!isAddress(patient)) {
      setStatus("Invalid patient address.");
      return;
    }

    setLoading(true);
    setStatus("");

    try {
      const ipfsCID = await PinataIPFSService.uploadFile(file);

      const trimmedPrescriptionId = prescriptionId.trim();
      const trimmedBatchId = selectedBatch.batchId.trim();
      const trimmedPatient = patient.trim();
      const trimmedIpfsCID = ipfsCID.trim();

      if (!trimmedPrescriptionId || !trimmedBatchId || !trimmedPatient || !trimmedIpfsCID) {
        setStatus("Some fields could not be trimmed properly. Please try again.");
        setLoading(false);
        return;
      }

      await issuePrescription(
        trimmedPrescriptionId,
        trimmedBatchId,
        trimmedPatient,
        trimmedIpfsCID
      );

      setStatus("Prescription issued and uploaded to IPFS.");
      setPrescriptionId(uuidv4());
      setPatient("");
      setFile(null);
      setSelectedBatch(null);
    } catch (error: any) {
      console.error("Error issuing prescription:", error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (isDoctor === false || isDoctor === null) return null;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Doctor Dashboard
      </Typography>

      <Typography variant="body2" color="text.secondary" mb={3}>
        Connected Wallet: <span style={{ fontFamily: "monospace" }}>{wallet}</span>
      </Typography>

      {!selectedBatch ? (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 3,
            justifyContent: "flex-start"
          }}
        >
          {batches.map((batch) => (
            <Card
              key={batch.batchId}
              sx={{
                width: 300,
                p: 2,
                flexShrink: 0
              }}
            >
              <CardContent>
                <Typography variant="h6">{batch.name}</Typography>
                <Typography variant="body2">Dosage: {batch.dosage}</Typography>
                <Typography variant="body2">Expires: {batch.expirationDate}</Typography>
                <Typography variant="caption">Batch ID: {batch.batchId.slice(0, 6)}...</Typography>
                <Box mt={2}>
                  <Button variant="contained" onClick={() => handleSelectBatch(batch.batchId)}>
                    Prescribe
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <Paper sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h6" gutterBottom>
            Issue Prescription for: {selectedBatch.name} ({selectedBatch.dosage})
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Box display="flex" flexDirection="column" gap={3}>
            <TextField
              label="Drug Name"
              value={selectedBatch.name}
              disabled
              fullWidth
            />
            <TextField
              label="Dosage"
              value={selectedBatch.dosage}
              disabled
              fullWidth
            />
            <TextField
              label="Expiration Date"
              value={selectedBatch.expirationDate}
              disabled
              fullWidth
            />
            <TextField
              label="Patient Address"
              value={patient}
              onChange={(e) => setPatient(e.target.value)}
              placeholder="0x..."
              fullWidth
              required
              error={!!patient && !isAddress(patient)}
              helperText={!!patient && !isAddress(patient) ? "Invalid Ethereum address" : ""}
            />
            <Button variant="outlined" component="label">
              {file ? file.name : "Upload Encrypted Prescription File"}
              <input type="file" hidden onChange={handleFileChange} />
            </Button>
            <Box display="flex" gap={2}>
              <Button variant="contained" onClick={handleSubmit} disabled={loading}>
                {loading ? "Issuing..." : "Issue Prescription"}
              </Button>
              <Button variant="text" onClick={() => setSelectedBatch(null)}>
                Cancel
              </Button>
            </Box>
            {status && (
              <Alert severity={status.includes("success") ? "success" : "error"}>{status}</Alert>
            )}
          </Box>
        </Paper>
      )}
    </Container>
  );
};

export default DoctorDashboard;
