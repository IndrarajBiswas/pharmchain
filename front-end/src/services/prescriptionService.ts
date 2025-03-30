import Web3 from "web3";
import PrescriptionABI from "../abi/PrescriptionRegistry.json";
import { createWalletConnection, fetchActiveWalletAddress } from "./walletProvider";
import { CONTRACT_ADDRESSES } from "../constants/contracts";

// Deployed PrescriptionRegistry address
const CONTRACT_ADDRESS = CONTRACT_ADDRESSES.PrescriptionRegistry;

/**
 * Load the PrescriptionRegistry contract instance
 */
function getPrescriptionContract(): any {
  const web3: Web3 = createWalletConnection();
  return new web3.eth.Contract(PrescriptionABI.abi, CONTRACT_ADDRESS);
}

/**
 * Issue a new prescription (requires Doctor role)
 *
 * @param prescriptionId - Unique ID (e.g. UUID or hash)
 * @param batchId - The drug batch ID
 * @param patient - Address of the patient
 * @param ipfsCID - Encrypted prescription data (stored on IPFS)
 */
export async function issuePrescription(
  prescriptionId: string,
  batchId: string,
  patient: string,
  ipfsCID: string
): Promise<void> {
  const contract = getPrescriptionContract();
  const doctor = await fetchActiveWalletAddress();
  await contract.methods
    .issuePrescription(prescriptionId, batchId, patient, ipfsCID)
    .send({ from: doctor });
}

/**
 * Fulfill a prescription (requires Pharmacy role)
 *
 * @param prescriptionId - ID of the prescription to fulfill
 */
export async function fulfillPrescription(prescriptionId: string): Promise<void> {
  const contract = getPrescriptionContract();
  const pharmacy = await fetchActiveWalletAddress();
  await contract.methods.fulfillPrescription(prescriptionId).send({ from: pharmacy });
}

/**
 * Fetch full details of a prescription
 *
 * @param prescriptionId - ID of the prescription to retrieve
 * @returns Prescription details
 */
export async function getPrescriptionDetails(prescriptionId: string): Promise<{
  prescriptionId: string;
  batchId: string;
  patient: string;
  ipfsCID: string;
  issuedBy: string;
  issuedAt: number;
  fulfilled: boolean;
  fulfilledBy: string;
  fulfilledAt: number;
}> {
  const contract = getPrescriptionContract();
  const result = await contract.methods.getPrescription(prescriptionId).call();

  return {
    prescriptionId: result.prescriptionId,
    batchId: result.batchId,
    patient: result.patient,
    ipfsCID: result.ipfsCID,
    issuedBy: result.issuedBy,
    issuedAt: Number(result.issuedAt),
    fulfilled: result.fulfilled,
    fulfilledBy: result.fulfilledBy,
    fulfilledAt: Number(result.fulfilledAt),
  };
}
