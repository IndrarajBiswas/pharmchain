# Smart contract reference

This document summarises the Solidity contracts in `contracts/` and how they collaborate to enforce pharmaceutical supply-chain rules.

## RoleAccessControl.sol

`RoleAccessControl` inherits from OpenZeppelin's `AccessControl` and seeds the deployer as the default admin. It defines the following role identifiers:

- `MANUFACTURER_ROLE`
- `WHOLESALER_ROLE`
- `PHARMACY_ROLE`
- `DOCTOR_ROLE`
- `ADMIN_ROLE` (alias of `DEFAULT_ADMIN_ROLE`)

### Admin functions

| Function | Description |
| --- | --- |
| `registerManufacturer(address account)` | Grants the manufacturer role. |
| `registerWholesaler(address account)` | Grants the wholesaler role. |
| `registerPharmacy(address account)` | Grants the pharmacy role. |
| `registerDoctor(address account)` | Grants the doctor role. |

Each helper wraps `grantRole` and can only be called by an account with `ADMIN_ROLE`. Introspection helpers (`isManufacturer`, `isWholesaler`, `isPharmacy`, `isDoctor`) expose role membership to other contracts.

## DrugBatchRegistry.sol

Stores immutable batch metadata keyed by the keccak hash of a human-readable batch ID.

- `registerBatch(...)` requires the sender to hold `MANUFACTURER_ROLE`, prevents duplicate batch IDs, and emits `BatchRegistered` with the raw string ID.
- `getBatch(batchId)` returns the full metadata tuple `(name, dosage, expirationDate, description, ipfsCID, manufacturer, registeredAt)` and reverts if the batch has not been registered.
- `getAllBatchIds()` exposes a list of stored hashes for off-chain indexing.

Use `ipfsCID` to reference packaging images or lab certificates stored off-chain.

## TransferTracker.sol

Tracks authorised transfers along the supply chain.

- Constructor parameters are the addresses of `RoleAccessControl` and `DrugBatchRegistry`.
- `logTransfer(batchId, to, ipfsCID)` verifies:
  - `msg.sender` and `to` form a valid role pairing (manufacturer → wholesaler or wholesaler → pharmacy).
  - The batch exists in `DrugBatchRegistry`.
  - An `ipfsCID` is supplied for encrypted shipping metadata.
- Transfers are appended to `batchTransfers[batchHash]` and emitted via `TransferLogged` along with an aggregated count event.
- `getTransferHistory(batchId)` and `getTransferCount(batchId)` return stored history for auditors.

## PrescriptionRegistry.sol

Ties doctor-issued prescriptions to registered drug batches.

- `issuePrescription(prescriptionId, batchId, patient, ipfsCID)` can only be invoked by a doctor. It ensures uniqueness per `prescriptionId`, validates the batch exists, and emits `PrescriptionIssued`.
- `fulfillPrescription(prescriptionId)` is restricted to pharmacies. It flips the fulfilment flags and emits `PrescriptionFulfilled`.
- `getPrescription(prescriptionId)` returns the stored struct for UI consumption.

## ZKCredentialIssuer.sol

Records hashed credentials that can later be proven off-chain via zk-SNARKs.

- `issueCredentialHash(credentialHash, schema, subject)` is available to doctors, manufacturers, and pharmacies. It stores metadata including the issuer and timestamp, then emits `CredentialIssued`.
- `verifyCredentialHash(credentialHash)` lets consumers confirm whether a hash has been registered.

## Interfaces

- `IRoleAccessControl` exposes `isDoctor`, `isManufacturer`, `isPharmacy`, and `isWholesaler` so that dependent contracts can check permissions without knowing the implementation details.
- `IDrugBatchRegistry` mirrors the full `getBatch` signature to ensure destructuring yields the same tuple order in cross-contract calls.
- `IVerifier` (used by zk circuits) is provided for future zero-knowledge integrations.

## Events and indexing tips

| Contract | Event | Purpose |
| --- | --- | --- |
| `DrugBatchRegistry` | `BatchRegistered` | Index new batches, build product catalogues. |
| `TransferTracker` | `TransferLogged`, `TransferCountUpdated` | Feed logistics dashboards and anomaly detection. |
| `PrescriptionRegistry` | `PrescriptionIssued`, `PrescriptionFulfilled` | Link medical orders to fulfilment and detect fraud. |
| `ZKCredentialIssuer` | `CredentialIssued` | Track credential provenance without leaking PII. |

Consume these events with The Graph, Hardhat listeners, or server-side workers to keep off-chain databases in sync.

## Deployment workflow

1. Deploy `RoleAccessControl` with an admin address.
2. Deploy `DrugBatchRegistry`, `ZKCredentialIssuer`, `TransferTracker`, and `PrescriptionRegistry`, passing the access-control address (and batch registry where required).
3. Register initial accounts with the appropriate roles via `RoleAccessControl`.
4. Update client configuration (`front-end/src/constants/contracts.ts`, environment variables) with the deployed addresses.

See [`scripts/deploy.js`](../scripts/deploy.js) for an automated deployment sequence.

