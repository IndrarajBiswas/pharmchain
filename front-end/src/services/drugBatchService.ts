// drugBatchService.ts
import Web3 from "web3";
import DrugBatchABI from "../abi/DrugBatchRegistry.json";
import { createWalletConnection, fetchActiveWalletAddress } from "./walletProvider";
import { CONTRACT_ADDRESSES } from "../constants/contracts";

const CONTRACT_ADDRESS = CONTRACT_ADDRESSES.DrugBatchRegistry;

function getDrugBatchContract(): any {
  const web3: Web3 = createWalletConnection();
  return new web3.eth.Contract(DrugBatchABI.abi, CONTRACT_ADDRESS);
}

export async function registerDrugBatch(
  batchId: string,
  name: string,
  dosage: string,
  expirationDate: string,
  description: string,
  ipfsCID: string
): Promise<void> {
  const contract = getDrugBatchContract();
  const manufacturer = await fetchActiveWalletAddress();
  await contract.methods
    .registerBatch(batchId, name, dosage, expirationDate, description, ipfsCID)
    .send({ from: manufacturer });
}

export async function getBatchDetails(batchId: string): Promise<{
  name: string;
  dosage: string;
  expirationDate: string;
  description: string;
  ipfsCID: string;
  manufacturer: string;
  registeredAt: number;
}> {
  const contract = getDrugBatchContract();
  const batch = await contract.methods.getBatch(batchId).call();

  return {
    name: batch.name,
    dosage: batch.dosage,
    expirationDate: batch.expirationDate,
    description: batch.description,
    ipfsCID: batch.ipfsCID,
    manufacturer: batch.manufacturer,
    registeredAt: Number(batch.registeredAt),
  };
}

export async function getAllBatches(): Promise<
  {
    batchId: string;
    name: string;
    dosage: string;
    expirationDate: string;
    description: string;
    ipfsCID: string;
    manufacturer: string;
    registeredAt: number;
  }[]
> {
  const contract = getDrugBatchContract();

  const events = await contract.getPastEvents("BatchRegistered", {
    fromBlock: 0,
    toBlock: "latest",
  });

  return events.map((event: any) => ({
    batchId: event.returnValues.batchId,
    name: event.returnValues.name,
    dosage: event.returnValues.dosage,
    expirationDate: event.returnValues.expirationDate,
    description: event.returnValues.description,
    ipfsCID: event.returnValues.ipfsCID,
    manufacturer: event.returnValues.manufacturer,
    registeredAt: Number(event.returnValues.timestamp),
  }));
}
