import Web3 from "web3";
import RoleAccessABI from "../abi/RoleAccessControl.json";
import { createWalletConnection, fetchActiveWalletAddress } from "./walletProvider";
import { CONTRACT_ADDRESSES } from "../constants/contracts";

const CONTRACT_ADDRESS = CONTRACT_ADDRESSES.RoleAccessControl;

/**
 * Load the RoleAccessControl contract instance using Web3.
 */
function getRoleAccessContract(): any {
  const web3: Web3 = createWalletConnection();
  return new web3.eth.Contract(RoleAccessABI.abi, CONTRACT_ADDRESS);
}

/**
 * Check if the current user has the DOCTOR_ROLE.
 */
export async function checkDoctorRole(): Promise<boolean> {
  const contract = getRoleAccessContract();
  const user = await fetchActiveWalletAddress();
  return await contract.methods.isDoctor(user).call();
}

/**
 * Check if the current user has the MANUFACTURER_ROLE.
 */
export async function checkManufacturerRole(): Promise<boolean> {
  const contract = getRoleAccessContract();
  const user = await fetchActiveWalletAddress();
  return await contract.methods.isManufacturer(user).call();
}

/**
 * Check if the current user has the WHOLESALER_ROLE.
 */
export async function checkWholesalerRole(): Promise<boolean> {
  const contract = getRoleAccessContract();
  const user = await fetchActiveWalletAddress();
  return await contract.methods.isWholesaler(user).call();
}

/**
 * Check if the current user has the PHARMACY_ROLE.
 */
export async function checkPharmacyRole(): Promise<boolean> {
  const contract = getRoleAccessContract();
  const user = await fetchActiveWalletAddress();
  return await contract.methods.isPharmacy(user).call();
}

/**
 * Assign the DOCTOR_ROLE to another address.
 */
export async function assignDoctorRole(target: string): Promise<void> {
  const contract = getRoleAccessContract();
  const admin = await fetchActiveWalletAddress();
  await contract.methods.registerDoctor(target).send({ from: admin });
}

/**
 * Assign the MANUFACTURER_ROLE to another address.
 */
export async function assignManufacturerRole(target: string): Promise<void> {
  const contract = getRoleAccessContract();
  const admin = await fetchActiveWalletAddress();
  await contract.methods.registerManufacturer(target).send({ from: admin });
}

/**
 * Assign the WHOLESALER_ROLE to another address.
 */
export async function assignWholesalerRole(target: string): Promise<void> {
  const contract = getRoleAccessContract();
  const admin = await fetchActiveWalletAddress();
  await contract.methods.registerWholesaler(target).send({ from: admin });
}

/**
 * Assign the PHARMACY_ROLE to another address.
 */
export async function assignPharmacyRole(target: string): Promise<void> {
  const contract = getRoleAccessContract();
  const admin = await fetchActiveWalletAddress();
  await contract.methods.registerPharmacy(target).send({ from: admin });
}
