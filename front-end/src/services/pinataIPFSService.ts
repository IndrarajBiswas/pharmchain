import { PinataSDK } from "pinata";

let pinata: PinataSDK;

function initPinata() {
  if (!pinata) {
    const jwt = process.env.REACT_APP_PINATA_JWT;
    const gateway = process.env.REACT_APP_GATEWAY_URL;

    console.log("Initializing Pinata SDK...");
    console.log("JWT Provided:", Boolean(jwt));
    console.log("Using Gateway:", gateway);

    if (!jwt || !gateway) {
      console.error(
        "Pinata initialization failed: Missing JWT or Gateway URL.\n" +
        "Please check your .env configuration and ensure these values are set:\n" +
        "- REACT_APP_PINATA_JWT\n" +
        "- REACT_APP_GATEWAY_URL"
      );
      throw new Error("Missing environment variables for Pinata.");
    }

    pinata = new PinataSDK({
      pinataJwt: jwt,
      pinataGateway: gateway,
    });

    console.log("Pinata SDK initialized successfully.");
  }

  return pinata;
}

/**
 * Upload a file to IPFS via Pinata
 */
async function uploadFile(file: File): Promise<string> {
  try {
    const sdk = initPinata();
    console.log(`Uploading file "${file.name}" to IPFS via Pinata...`);
    const result = await sdk.upload.public.file(file);
    console.log(`File "${file.name}" uploaded successfully.`);
    console.log("IPFS CID:", result.cid);
    return result.cid;
  } catch (error: any) {
    console.error(
      `Failed to upload file "${file?.name}" to IPFS.\n` +
      "Reason:", error?.message || error
    );
    throw new Error("IPFS upload via Pinata failed. See console for details.");
  }
}

/**
 * Resolve CID to full URL using Pinata gateway
 */
async function resolveCID(cid: string): Promise<string> {
  try {
    const sdk = initPinata();
    console.log(`🔗 Resolving CID "${cid}" via Pinata Gateway...`);
    const url = await sdk.gateways.public.convert(cid);
    console.log("Resolved Gateway URL:", url);
    return url;
  } catch (error: any) {
    console.error(
      `Failed to resolve CID "${cid}" using Pinata Gateway.\n` +
      "Reason:", error?.message || error
    );
    throw new Error("IPFS URL resolution failed. See console for details.");
  }
}

export const PinataIPFSService = {
  uploadFile,
  resolveCID,
};
