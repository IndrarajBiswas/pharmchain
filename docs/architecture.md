# Architecture overview

PharmChain spans on-chain logic, AI-assisted services, and multiple user experiences. The diagram below captures the major moving parts and the relationships between them.

```
┌──────────────────────┐        ┌──────────────────────────┐
│  React dApp (front-end) ─────▶│  Solidity contracts      │
│  Streamlit console     │◀─────│  (Hardhat deployments)   │
└──────────▲────────────┘        └──────────┬──────────────┘
           │                                 │
           │ REST/JSON                       │ events/calls
           │                                 ▼
┌──────────┴────────────┐        ┌──────────────────────────┐
│ FastAPI service        │◀──────│ Ethereum-compatible node │
│ (PharmToTable/app.py)  │──────▶│ (Hardhat, Ganache, etc.) │
└──────────▲────────────┘        └──────────────────────────┘
           │
           │ gRPC/HTTP to Gemini, IPFS SDK, analytics
           ▼
┌────────────────────────┐
│ Gemini APIs & external │
│ services (Pinata, etc.)│
└────────────────────────┘
```

## Core domains

### On-chain governance and traceability

- **RoleAccessControl** enforces who may register drug batches, handle transfers, issue prescriptions, or mint zero-knowledge credential hashes.
- **DrugBatchRegistry** captures rich metadata (name, dosage, description, IPFS CID, etc.) for each batch registered by a manufacturer.
- **TransferTracker** records transfers from manufacturers → wholesalers → pharmacies and emits events for downstream analytics.
- **PrescriptionRegistry** links a doctor-approved prescription ID to a batch and tracks when pharmacies fulfil it.
- **ZKCredentialIssuer** stores hashes of off-chain credentials that can be proven with zk-SNARKs without revealing sensitive data.

All contracts are deployed via `scripts/deploy.js`, which wires addresses together and prints a summary for client configuration.

### Off-chain services (PharmToTable)

`PharmToTable/app.py` exposes a FastAPI service that acts as the connective tissue between blockchain records and AI assistance:

- `/api/process-document` uploads package or transfer imagery and uses Gemini to extract structured fields.
- `/api/analyze-ledger` ingests CSV/Excel ledgers and asks Gemini to summarise anomalies and risk factors.
- `/api/verify-medication` cross-checks scanned data against blockchain history and returns a blended authenticity score.
- `/api/journey-map/{lot}` produces journey visualisation scaffolding for the Streamlit UI.
- `/api/batch-process` triggers large CSV verifications asynchronously.

`gemini_helpers.py` contains the prompt engineering and parsing logic for each AI-powered workflow, while `blockchain.py` wraps Web3 calls against the deployed contracts.

### User experiences

- **React dApp (`front-end/`)**: wallet-connected dashboards for admins, manufacturers, pharmacies, and doctors. Uses the services in `src/services` to interact directly with contracts and IPFS.
- **Streamlit analyst console (`PharmToTable/frontend.py`)**: a rapid-prototyping interface over the FastAPI endpoints that analysts can use without handling wallets.
- **Consumer demo (`consumer/`)**: a Flask app that fabricates QR-coded traceability records and can optionally call Gemini for educational summaries.

## Data flow highlights

1. **Batch registration**: A manufacturer registers a batch in `DrugBatchRegistry`. The transaction emits `BatchRegistered`, which can be consumed by analytics dashboards. IPFS CIDs reference packaging or COAs stored off-chain.
2. **Transfer logging**: Wholesalers and pharmacies call `TransferTracker.logTransfer`. The contract validates role pairings (manufacturer → wholesaler → pharmacy) and persists the transfer history for auditors.
3. **Prescription lifecycle**: Doctors issue prescriptions tied to batches. Pharmacies mark fulfilment, enabling end-to-end visibility between medical orders and inventory.
4. **AI verification**: Off-chain scans or ledgers are uploaded to FastAPI. Gemini produces structured data or insights, which are merged with blockchain history before returning to the caller.
5. **Zero-knowledge credentials**: Authorised entities hash credentials off-chain, submit the hash via `ZKCredentialIssuer`, and later prove possession without revealing raw data.

## Operational considerations

- **Secrets management**: `PharmToTable/config.py` requires `GEMINI_API_KEY` and blockchain credentials; never hard-code secrets in source files.
- **Extensibility**: The interfaces in `contracts/interfaces/` are intentionally lean to allow contracts to evolve while keeping type safety for cross-contract calls.
- **Event-driven integrations**: Consider consuming Hardhat node logs or using services like The Graph to build reactive dashboards.
- **Testing**: Use Hardhat's `npx hardhat test` to add coverage for role gating and business rules. Python services can be covered with `pytest`.

Consult [`docs/smart_contracts.md`](smart_contracts.md) for function-level breakdowns and [`docs/development.md`](development.md) for environment setup.

