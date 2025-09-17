# PharmChain React dApp

This package delivers a wallet-connected dashboard for managing pharmaceutical supply-chain workflows on top of the PharmChain smart contracts.

## Features

- Role-aware navigation for admins, manufacturers, wholesalers, pharmacies, and doctors.
- Batch registration and IPFS-backed document storage using Pinata.
- Transfer logging, prescription management, and credential issuance flows that map directly to the Solidity contracts.
- Ethers.js provider utilities (`src/services/*`) that encapsulate contract calls and simplify error handling.

## Getting started

```bash
cd front-end
npm install
cp .env.example .env      # update with your Pinata + RPC credentials
npm start
```

The development server runs on [http://localhost:3000](http://localhost:3000). Connect a wallet (MetaMask) that points at the same network as your deployed contracts and ensure the addresses in `src/constants/contracts.ts` match the latest deployment.

## Project structure

| Path | Purpose |
| --- | --- |
| `src/components/` | Dashboard modules (role manager, batch forms, doctor/pharmacy views). |
| `src/services/` | Thin wrappers around ethers.js, Pinata SDK, and other side effects. |
| `src/abi/` | Contract ABIs generated from Hardhat builds. Regenerate after recompiling contracts. |
| `src/constants/contracts.ts` | Central list of deployed contract addresses. Update after each deployment. |

## Scripts

| Command | Description |
| --- | --- |
| `npm start` | Run the development server with hot reloading. |
| `npm test` | Execute unit tests generated via Create React App. |
| `npm run build` | Produce an optimised production bundle in `build/`. |
| `npm run lint` | (Configure ESLint) Validate coding style before committing. |

## Environment variables

Create React App exposes variables prefixed with `REACT_APP_`. Common configuration values:

- `REACT_APP_PINATA_JWT`: JWT token for Pinata uploads.
- `REACT_APP_GATEWAY_URL`: Pinata gateway for resolving CIDs.
- `REACT_APP_DEFAULT_NETWORK`: Hex chain ID expected by the UI (e.g. `0x539` for Hardhat).
- `REACT_APP_RPC_URL`: Optional RPC endpoint if you need to override the provider connection logic.

Restart the dev server after changing environment variables.

## Updating ABIs

After modifying any Solidity contract, run `npx hardhat compile` at the repository root and copy the generated JSON ABIs into `src/abi`. Keep the contract address map in sync to avoid signature mismatches.

