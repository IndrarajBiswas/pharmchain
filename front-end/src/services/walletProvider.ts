import Web3 from "web3";

declare global {
  interface Window {
    ethereum?: any;
  }
}

let _web3: Web3 | null = null;

/**
 * Establish a new Web3 connection with the user's browser wallet.
 * Automatically requests access to accounts if not already connected.
 */
export function createWalletConnection(): Web3 {
  if (!_web3) {
    if (!window.ethereum) {
      throw new Error("MetaMask not found. Please install MetaMask to continue.");
    }

    try {
      window.ethereum.request({ method: "eth_requestAccounts" });
      _web3 = new Web3(window.ethereum);
    } catch (err) {
      console.error("Wallet connection failed:", err);
      throw new Error("Could not connect to wallet.");
    }
  }

  return _web3;
}

/**
 * Get the currently selected wallet address.
 */
export async function fetchActiveWalletAddress(): Promise<string> {
  const web3 = createWalletConnection();
  const accounts = await web3.eth.getAccounts();
  if (!accounts.length) {
    throw new Error("No wallet account found. Please connect MetaMask.");
  }
  return accounts[0];
}

/**
 * Get the current Web3 instance (or create it if not already initialized).
 */
export function useWeb3Instance(): Web3 {
  return createWalletConnection();
}
