import Web3 from "web3";
import ZKCredentialABI from "../abi/ZKCredentialIssuer.json";
import { createWalletConnection, fetchActiveWalletAddress } from "./walletProvider";
import { CONTRACT_ADDRESSES } from "../constants/contracts";

// Deployed contract address
const CONTRACT_ADDRESS = CONTRACT_ADDRESSES.ZKCredentialIssuer;

/**
 * Load the ZKCredentialIssuer contract instance
 */
function getZKCredentialContract(): any {
  const web3: Web3 = createWalletConnection();
  return new web3.eth.Contract(ZKCredentialABI.abi, CONTRACT_ADDRESS);
}

/**
 * Issue a new credential hash on-chain
 * Only callable by authorized issuers (doctor/manufacturer/pharmacy)
 * 
 * @param credentialHash - keccak256 or other off-chain credential hash
 * @param schema - Credential schema identifier (e.g. "KYCAgeCredential")
 * @param subject - Wallet address receiving the credential
 */
export async function issueCredential(
  credentialHash: string,
  schema: string,
  subject: string
): Promise<void> {
  const contract = getZKCredentialContract();
  const issuer = await fetchActiveWalletAddress();
  await contract.methods.issueCredentialHash(credentialHash, schema, subject).send({ from: issuer });
}

/**
 * Verify if a credential hash was previously issued
 * 
 * @param credentialHash - The credential hash to check
 * @returns true if it exists, false otherwise
 */
export async function verifyCredential(credentialHash: string): Promise<boolean> {
  const contract = getZKCredentialContract();
  return await contract.methods.verifyCredentialHash(credentialHash).call();
}

/**
 * Fetch metadata about an issued credential
 * 
 * @param credentialHash - The credential hash
 * @returns Object containing subject, issuer, schema, and issuedAt timestamp
 */
export async function getCredentialMetadata(credentialHash: string): Promise<{
  subject: string;
  issuer: string;
  schema: string;
  issuedAt: number;
}> {
  const contract = getZKCredentialContract();
  const result = await contract.methods.issuedCredentials(credentialHash).call();

  return {
    subject: result.subject,
    issuer: result.issuer,
    schema: result.schema,
    issuedAt: Number(result.issuedAt),
  };
}
