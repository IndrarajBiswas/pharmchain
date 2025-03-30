import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { registerDrugBatch } from "../services/drugBatchService";
import { PinataIPFSService } from "../services/pinataIPFSService";
import { fetchActiveWalletAddress } from "../services/walletProvider";
import { checkManufacturerRole } from "../services/roleAccessService";

import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";

const DrugBatchForm = () => {
  const [file, setFile] = useState<File | null>(null);
  const [batchId, setBatchId] = useState<string>(uuidv4());
  const [name, setName] = useState<string>("");
  const [dosage, setDosage] = useState<string>("");
  const [expirationDate, setExpirationDate] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [wallet, setWallet] = useState<string>("");
  const [isManufacturer, setIsManufacturer] = useState<boolean | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const account = await fetchActiveWalletAddress();
        setWallet(account);
        const hasRole = await checkManufacturerRole();
        setIsManufacturer(hasRole);
      } catch (error) {
        console.error("Wallet or role check failed:", error);
        setIsManufacturer(false);
      }
    };

    init();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file || !name || !dosage || !expirationDate || !description) {
      setStatus("Please fill all fields and upload a file.");
      return;
    }

    setLoading(true);
    setStatus("");

    try {
      const ipfsCID = await PinataIPFSService.uploadFile(file);
      await registerDrugBatch(batchId, name, dosage, expirationDate, description, ipfsCID);
      setStatus("Drug batch successfully registered and uploaded to IPFS.");
      setBatchId(uuidv4());
      setFile(null);
      setName("");
      setDosage("");
      setExpirationDate("");
      setDescription("");
    } catch (error: any) {
      console.error("Error:", error);
      setStatus(`Registration failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (isManufacturer === false || isManufacturer === null) return null;

  return (
    <Box sx={{ width: "100%", py: 4, backgroundColor: "#f9fafb" }}>
      <Container maxWidth="md">
        <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h5" fontWeight="bold" textAlign="center" gutterBottom>
            Register Drug Batch
          </Typography>

          <Typography variant="body2" color="text.secondary" textAlign="center" mb={2}>
            Connected Wallet: <span style={{ fontFamily: "monospace" }}>{wallet}</span>
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Box display="flex" flexDirection="column" gap={3}>
            <TextField label="Drug Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />

            <TextField label="Dosage" value={dosage} onChange={(e) => setDosage(e.target.value)} fullWidth />

            <TextField
              label="Expiration Date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              placeholder="YYYY-MM-DD"
              fullWidth
            />

            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
            />

            <Button variant="outlined" component="label" sx={{ textTransform: "none" }}>
              {file ? file.name : "Upload Batch Metadata (JSON, PDF, etc.)"}
              <input type="file" hidden onChange={handleFileChange} />
            </Button>

            <TextField
              label="Batch ID"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              fullWidth
            />

            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading || !file}
              sx={{ textTransform: "none" }}
            >
              {loading ? "Registering Batch..." : "Register Batch"}
            </Button>

            {status && (
              <Alert severity={status.includes("successfully") ? "success" : "error"}>{status}</Alert>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default DrugBatchForm;
