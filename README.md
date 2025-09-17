# PharmChain

PharmChain is a full-stack exploration of how blockchain, zero-knowledge proofs, and AI-assisted analysis can reinforce trust in pharmaceutical supply chains. The repository combines Solidity smart contracts, a FastAPI service that augments blockchain records with Gemini-powered insights, multiple user-facing clients, and demo utilities for rapid experimentation.

> **Why this repo?** Use PharmChain to prototype end-to-end drug provenance workflows, from registering batches on-chain to issuing prescriptions, proving credentials, and surfacing traceability data through web and data-science friendly interfaces.

## Highlights

- **Modular smart-contract suite** for manufacturers, wholesalers, pharmacies, and doctors with strict role-based access control.
- **Transfer and prescription tracking** plus optional zero-knowledge credential hashing for privacy-preserving compliance checks.
- **AI-enhanced verification workflows** that inspect uploaded documents, ledgers, and blockchain activity using Gemini models.
- **Multiple user experiences** including a React dApp, a Streamlit analyst console, and a lightweight consumer-facing Flask demo with QR codes.
- **Ready-to-run scripts** for compiling Circom circuits, deploying contracts with Hardhat, and experimenting with zk-SNARK proofs.

## Repository layout

| Path | Description |
| --- | --- |
| `contracts/` | Solidity contracts for roles, batch registration, transfers, prescriptions, and credential hashes plus shared interfaces. |
| `scripts/deploy.js` | Hardhat deployment script that bootstraps the entire contract suite. |
| `PharmToTable/` | FastAPI backend, Gemini helper utilities, and Streamlit dashboard for operational teams. |
| `front-end/` | React + TypeScript dApp that connects to the deployed contracts, handles IPFS uploads, and manages user dashboards. |
| `consumer/` | Flask demo that fabricates traceability data, generates QR codes, and (optionally) summarizes data with Gemini. |
| `docs/` | Extended documentation including architecture notes, smart contract references, and development tips. |
| `scripts/` | Circom/snarkjs utilities for zero-knowledge experimentation. |

## Quick start

> **Prerequisites:** Node.js ≥ 18, npm, Python ≥ 3.10, and (optionally) a local Ethereum node such as Hardhat or Ganache. Install [pnpm](https://pnpm.io) if you prefer a faster Node package manager.

### 1. Clone and install dependencies

```bash
npm install          # Installs Hardhat, snarkjs, and solidity tooling
cd PharmToTable && pip install -r requirements.txt
cd ../consumer && pip install -r requirements.txt
cd ../front-end && npm install
```

### 2. Configure environment variables

Copy `.env.example` files and populate them with real values before running any service:

```bash
cp .env.example .env                            # Back-end and scripts
cp front-end/.env.example front-end/.env        # React dApp
```

At minimum you will need:

- `GEMINI_API_KEY` for Gemini-based features (FastAPI and consumer demo).
- `BLOCKCHAIN_PROVIDER_URL`, `CONTRACT_ADDRESS`, and `PRIVATE_KEY` for on-chain writes.
- `REACT_APP_PINATA_JWT` and `REACT_APP_GATEWAY_URL` for IPFS uploads from the dApp.

See the [environment reference](docs/development.md#environment-variables) for the full list.

### 3. Compile and deploy the contracts

```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network ganache   # or your preferred network
```

Record the deployed addresses and update `front-end/src/constants/contracts.ts` plus any server configuration that depends on them.

### 4. Run the FastAPI service

```bash
cd PharmToTable
uvicorn app:app --reload
```

The API exposes endpoints for document processing, ledger analysis, medication verification, journey visualization, and batch uploads. Refer to [`docs/development.md`](docs/development.md#fastapi-service) for endpoint summaries and payload examples.

### 5. Launch the Streamlit analyst console (optional)

```bash
cd PharmToTable
streamlit run frontend.py
```

This UI lets analysts verify medications, inspect blockchain history, and orchestrate batch jobs powered by the FastAPI endpoints.

### 6. Explore the React dApp

```bash
cd front-end
npm start
```

Connect with MetaMask or another wallet pointing at your test network. Role management, batch registration, transfers, prescriptions, and credential issuance are surfaced through dedicated dashboards.

### 7. Try the consumer QR-code demo (optional)

```bash
cd consumer
export FLASK_APP=main.py
flask run --port 8080
```

Visit `http://localhost:8080` to see fabricated traceability data. Summaries will include AI-generated content if `GEMINI_API_KEY` is set; otherwise a helpful message is displayed.

## Documentation

- [Architecture overview](docs/architecture.md)
- [Smart contract reference](docs/smart_contracts.md)
- [Development playbook](docs/development.md)

Each document includes cross-links, diagrams-in-words, and callouts for environment management and security considerations.

## Security & secrets

- **Never commit API keys or private keys.** Use the provided `.env.example` files and environment variables.
- The consumer demo intentionally fabricates data; do not rely on it for production signals.
- Audit and update Hardhat network credentials (`hardhat.config.js`) before deploying to real networks.

## Contributing

1. Fork the repository and create a topic branch.
2. Keep linting, type checking, and Hardhat compilation clean.
3. Open a pull request with context about the problem being solved. Screenshots or call traces are welcome.

See [`docs/development.md`](docs/development.md#quality-checks) for useful commands.

## License

This project is published under the ISC license (see `package.json`). Individual files may carry additional SPDX identifiers where appropriate.

