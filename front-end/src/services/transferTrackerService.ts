import Web3 from "web3";
import TransferTrackerABI from "../abi/TransferTracker.json";
import { createWalletConnection, fetchActiveWalletAddress } from "./walletProvider";
import { CONTRACT_ADDRESSES } from "../constants/contracts";

// Deployed TransferTracker contract address
const CONTRACT_ADDRESS = CONTRACT_ADDRESSES.TransferTracker;

/**
 * Load the TransferTracker contract instance
 */
function getTransferTrackerContract(): any {
  const web3: Web3 = createWalletConnection();
  return new web3.eth.Contract(TransferTrackerABI.abi, CONTRACT_ADDRESS);
}

/**
 * Log a transfer of a drug batch
 * Caller must be either Manufacturer → Wholesaler OR Wholesaler → Pharmacy
 * 
 * @param batchId - Unique string identifier of the drug batch
 * @param recipient - Address of the receiver (wholesaler or pharmacy)
 * @param ipfsCID - Encrypted shipping metadata CID (IPFS)
 */
export async function logBatchTransfer(
  batchId: string,
  recipient: string,
  ipfsCID: string
): Promise<void> {
  const contract = getTransferTrackerContract();
  const sender = await fetchActiveWalletAddress();
  await contract.methods.logTransfer(batchId, recipient, ipfsCID).send({ from: sender });
}

/**
 * Get the number of transfers recorded for a given batch
 * 
 * @param batchId - The batch identifier
 * @returns total number of transfers
 */
export async function getTransferCount(batchId: string): Promise<number> {
  const contract = getTransferTrackerContract();
  const count = await contract.methods.getTransferCount(batchId).call();
  return Number(count);
}

/**
 * Fetch the complete transfer history for a batch
 * 
 * @param batchId - The batch identifier
 * @returns Array of transfer objects: from, to, timestamp, ipfsCID
 */
export async function getTransferHistory(batchId: string): Promise<
  {
    from: string;
    to: string;
    timestamp: number;
    ipfsCID: string;
  }[]
> {
  const contract = getTransferTrackerContract();
  const result = await contract.methods.getTransferHistory(batchId).call();

  return result.map((transfer: any) => ({
    from: transfer.from,
    to: transfer.to,
    timestamp: Number(transfer.timestamp),
    ipfsCID: transfer.ipfsCID,
  }));
}
