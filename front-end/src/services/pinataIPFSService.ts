// src/services/pinataIPFSService.ts
import axios from 'axios';

console.log('✅ REACT_APP_PINATA_JWT:', process.env.REACT_APP_PINATA_JWT);
console.log('✅ REACT_APP_GATEWAY_URL:', process.env.REACT_APP_GATEWAY_URL);

const PINATA_JWT = process.env.REACT_APP_PINATA_JWT;

async function uploadFile(file: File): Promise<string> {
  try {
    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
    const formData = new FormData();
    formData.append('file', file);
    const headers = {
      Authorization: `Bearer ${PINATA_JWT}`,
    };
    const res = await axios.post<{ IpfsHash: string }>(url, formData, { headers });
    console.log('File uploaded:', res.data);
    return res.data.IpfsHash;
  } catch (error) {
    console.error('Pinata Upload Error:', error);
    throw new Error('Failed to upload file to IPFS.');
  }
}

export { uploadFile };
