import Web3 from "web3";
import DrugBatchABI from "../abi/DrugBatchRegistry.json";
import { createWalletConnection, fetchActiveWalletAddress } from "./walletProvider";
import { CONTRACT_ADDRESSES } from "../constants/contracts";

// Set the deployed address via config
const CONTRACT_ADDRESS = CONTRACT_ADDRESSES.DrugBatchRegistry;

//Load the DrugBatchRegistry contract instance
function getDrugBatchContract(): any {
  const web3: Web3 = createWalletConnection();
  return new web3.eth.Contract(DrugBatchABI.abi, CONTRACT_ADDRESS);
}

/**
 * Register a new drug batch (requires manufacturer role)
 * @param batchId - Unique string identifier (e.g. UUID or hash)
 * @param ipfsCID - The IPFS CID storing batch metadata
 */
export async function registerDrugBatch(batchId: string, ipfsCID: string): Promise<void> {
  const contract = getDrugBatchContract();
  const manufacturer = await fetchActiveWalletAddress();
  await contract.methods.registerBatch(batchId, ipfsCID).send({ from: manufacturer });
}

/**
 * Retrieve batch metadata by batch ID
 * @param batchId - The batch ID to look up
 * @returns {Promise<{ ipfsCID: string, manufacturer: string, registeredAt: number }>}
 */
export async function getBatchDetails(batchId: string): Promise<{
  ipfsCID: string;
  manufacturer: string;
  registeredAt: number;
}> {
  const contract = getDrugBatchContract();
  const batch = await contract.methods.getBatch(batchId).call();

  return {
    ipfsCID: batch.ipfsCID,
    manufacturer: batch.manufacturer,
    registeredAt: Number(batch.registeredAt),
  };
}
