import { PinataSDK } from "pinata";

const pinata = new PinataSDK({
    pinataJwt: import.meta.env.VITE_PINATA_JWT || "",
    pinataGateway: import.meta.env.VITE_GATEWAY_URL || "",
  });
/**
 * Upload a file to IPFS via Pinata
 * @param file - The File object to upload
 * @returns The CID string (Content Identifier)
 */
async function uploadFile(file: File): Promise<string> {
  try {
    const result = await pinata.upload.public.file(file);
    return result.cid;
  } catch (error) {
    console.error("Pinata Upload Error:", error);
    throw new Error("Upload to IPFS failed.");
  }
}

/**
 * Convert a CID to a full public gateway URL
 * @param cid - The CID returned from upload
 * @returns Full gateway URL
 */
async function resolveCID(cid: string): Promise<string> {
  try {
    return await pinata.gateways.public.convert(cid);
  } catch (error) {
    console.error("Pinata Gateway Resolution Error:", error);
    throw new Error("Failed to resolve gateway URL.");
  }
}

// 👇 Export the service as an object
export const PinataIPFSService = {
  uploadFile,
  resolveCID,
};
