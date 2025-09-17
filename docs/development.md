# Development playbook

This guide consolidates setup steps, environment variables, and useful commands for working on PharmChain.

## Environment variables

Create a `.env` file at the repository root (see `.env.example`) with the following keys:

| Variable | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | Required for Gemini API calls (`PharmToTable` services and `consumer` demo). |
| `BLOCKCHAIN_PROVIDER_URL` | HTTP endpoint for your Ethereum node (Hardhat, Ganache, Infura, etc.). |
| `CONTRACT_ADDRESS` | Address of the deployed contract that `PharmToTable/blockchain.py` interacts with. |
| `PRIVATE_KEY` | Private key for signing blockchain transactions when registering medications or logging transfers. |

Additional component-specific variables:

- **React dApp (`front-end`)**: copy `front-end/.env.example` and configure `REACT_APP_PINATA_JWT`, `REACT_APP_GATEWAY_URL`, and any RPC URLs required by your wallet provider.
- **Hardhat**: customise `hardhat.config.js` to point at your preferred networks and funded accounts.

## Installing dependencies

```bash
# Solidity toolchain
npm install

# FastAPI service & Streamlit console
cd PharmToTable
pip install -r requirements.txt

# Consumer Flask demo
cd ../consumer
pip install -r requirements.txt

# React dApp
cd ../front-end
npm install
```

Python projects assume a virtual environment; use `python -m venv .venv && source .venv/bin/activate` before installing.

## Running the services

### Hardhat node (optional)

```bash
npx hardhat node
```

Use `npx hardhat run scripts/deploy.js --network localhost` to deploy into the in-memory chain.

### FastAPI

```bash
cd PharmToTable
uvicorn app:app --reload
```

Endpoints are documented inline in `app.py`. Use `http://localhost:8000/docs` for Swagger UI once the server is running.

### Streamlit console

```bash
cd PharmToTable
streamlit run frontend.py
```

### Consumer demo

```bash
cd consumer
export FLASK_APP=main.py
flask run --port 8080
```

Summaries will only include AI output when `GEMINI_API_KEY` is present.

### React dApp

```bash
cd front-end
npm start
```

The development server runs on `http://localhost:3000` and expects browser wallets to be connected to the same network as your deployed contracts.

## Quality checks

Recommended commands before opening a pull request:

```bash
# Solidity
npx hardhat compile
npx hardhat test

# Python (from repository root)
ruff check PharmToTable consumer
pytest PharmToTable/tests  # if/when tests are added

# React
cd front-end
npm run lint
npm test
```

Adjust tooling as linters/tests are introduced. Keep `npm audit` and dependency updates in mind for long-lived deployments.

## Troubleshooting tips

- **Missing Gemini key**: Both FastAPI and the consumer demo gracefully return explanatory messages if `GEMINI_API_KEY` is absent. Set the variable to restore summarisation features.
- **Contract ABI mismatch**: Regenerate ABIs after modifying Solidity (`npx hardhat compile`) and make sure `PharmToTable/contracts/*.json` and `front-end/src/abi` are refreshed.
- **Ganache vs. Hardhat**: Update `hardhat.config.js` if you prefer a different local chain, and double-check `CONTRACT_ADDRESS` across services.
- **Pinata setup**: Obtain a Pinata JWT and gateway URL, then populate `front-end/.env`. Without these values, IPFS uploads from the React dApp will fail fast with a descriptive error.

