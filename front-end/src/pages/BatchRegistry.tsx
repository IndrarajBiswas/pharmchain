// src/pages/BatchRegistry.tsx
import React, { useState } from 'react';
import { Container, TextField, Button, Typography, Box, CircularProgress } from '@mui/material';
import { uploadFile } from '../services/pinataIPFSService';
import { BrowserProvider, Contract } from 'ethers';
import DrugBatchRegistryData from '../abi/DrugBatchRegistry.json';

const DrugBatchRegistryABI = DrugBatchRegistryData.abi;
const CONTRACT_ADDRESS = '0x6777e03D0a468D7f09913578E23c6a29b60810E9'; // Replace with your deployed address

const BatchRegistry: React.FC = () => {
  const [batchId, setBatchId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [fileUrl, setFileUrl] = useState<string>('');

  // Connect to MetaMask and return a signer
  const connectWallet = async (): Promise<any> => {
    if ((window as any).ethereum) {
      await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new BrowserProvider((window as any).ethereum);
      return provider.getSigner();
    } else {
      alert('MetaMask is not installed!');
    }
  };

  const handleUploadAndRegister = async () => {
    if (!file || !batchId) {
      setStatus('Please provide a valid Batch ID and select a file.');
      return;
    }
    try {
      setLoading(true);
      setStatus('Uploading file to IPFS...');
      const cidResult = await uploadFile(file);
      console.log("CID result:", cidResult);
      const ipfsUrl = `https://${process.env.REACT_APP_GATEWAY_URL}/ipfs/${cidResult}`;
      setFileUrl(ipfsUrl);
      setStatus(`File uploaded to IPFS. CID: ${cidResult}`);

      // Connect to MetaMask and register the batch on-chain
      const signer = await connectWallet();
      if (!signer) return;
      const contract = new Contract(CONTRACT_ADDRESS, DrugBatchRegistryABI, signer);
      setStatus('Registering batch in the smart contract...');
      const tx = await contract.registerBatch(batchId, cidResult);
      await tx.wait();
      setStatus(`Batch registered successfully! Transaction hash: ${tx.hash}`);

      // Save batch info in localStorage
      const storedBatches = JSON.parse(localStorage.getItem('uploadedBatches') || '[]');
      storedBatches.push({ batchId, cid: cidResult });
      localStorage.setItem('uploadedBatches', JSON.stringify(storedBatches));
      console.log("Saved to localStorage:", storedBatches);
    } catch (error) {
      console.error('Error during upload/registration:', error);
      setStatus('Error uploading file or registering batch.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Box my={5} textAlign="center">
        <Typography variant="h4" gutterBottom>
          Register a New Drug Batch
        </Typography>
        <TextField
          label="Batch ID"
          value={batchId}
          onChange={(e) => setBatchId(e.target.value)}
          fullWidth
          margin="normal"
        />
        <input
          type="file"
          accept="*"
          onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
          style={{ marginTop: '16px', marginBottom: '16px' }}
        />
        <Button variant="contained" color="primary" onClick={handleUploadAndRegister} disabled={loading} sx={{ mt: 2 }}>
          {loading ? <CircularProgress size={24} /> : 'Upload and Register'}
        </Button>
        {status && (
          <Typography variant="body1" color="textSecondary" sx={{ mt: 2 }}>
            {status}
          </Typography>
        )}
        {fileUrl && (
          <Typography variant="body2" sx={{ mt: 2 }}>
            View File: <a href={fileUrl} target="_blank" rel="noopener noreferrer">{fileUrl}</a>
          </Typography>
        )}
      </Box>
    </Container>
  );
};

export default BatchRegistry;
