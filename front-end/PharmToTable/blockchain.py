# blockchain.py
import json
from datetime import datetime
from web3 import Web3
from eth_account import Account
from config import BLOCKCHAIN_PROVIDER_URL, CONTRACT_ADDRESS, PRIVATE_KEY

# Connect to blockchain
w3 = Web3(Web3.HTTPProvider(BLOCKCHAIN_PROVIDER_URL))

# Load contract ABI
with open('contracts/PharmaceuticalTracker.json', 'r') as f:
    contract_json = json.load(f)
    contract_abi = contract_json['abi']

# Create contract instance
contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=contract_abi)

# Account setup for transactions (if private key provided)
if PRIVATE_KEY:
    account = Account.from_key(PRIVATE_KEY)
    account_address = account.address
else:
    account = None
    account_address = None

async def get_medication_history(lot_number):
    """
    Fetch medication transfer history from blockchain
    
    Args:
        lot_number: Lot number to query
        
    Returns:
        list: List of transfer events
    """
    try:
        # Create filter for Transfer events with the lot number
        transfer_filter = contract.events.Transfer.create_filter(
            fromBlock=0,
            argument_filters={'lotNumber': lot_number}
        )
        
        # Get all events
        events = transfer_filter.get_all_entries()
        
        # Format the events
        formatted_events = []
        for event in events:
            args = event['args']
            formatted_events.append({
                'from': args['from'],
                'to': args['to'],
                'lotNumber': args['lotNumber'],
                'location': args['location'],
                'timestamp': datetime.fromtimestamp(args['timestamp']).isoformat(),
                'verified': args['verified'],
                'transactionHash': event['transactionHash'].hex(),
                'blockNumber': event['blockNumber']
            })
            
        return formatted_events
    except Exception as e:
        raise Exception(f"Error fetching medication history: {str(e)}")

async def record_transfer(transfer_data):
    """
    Record a medication transfer on the blockchain
    
    Args:
        transfer_data: Data about the transfer
        
    Returns:
        dict: Transaction receipt details
    """
    if not PRIVATE_KEY:
        raise Exception("Private key not configured for blockchain transactions")
    
    try:
        # Prepare transaction
        tx = contract.functions.recordTransfer(
            transfer_data['from'],
            transfer_data['to'],
            transfer_data['lotNumber'],
            transfer_data['ndc'],
            transfer_data['quantity'],
            transfer_data['expirationDate'],
            int(datetime.fromisoformat(transfer_data['transferDate']).timestamp())
        ).build_transaction({
            'from': account_address,
            'nonce': w3.eth.get_transaction_count(account_address),
            'gas': 2000000,
            'gasPrice': w3.eth.gas_price
        })
        
        # Sign and send transaction
        signed_tx = w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        
        # Wait for transaction receipt
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        
        return {
            'success': receipt.status == 1,
            'transactionHash': receipt.transactionHash.hex(),
            'blockNumber': receipt.blockNumber,
            'gasUsed': receipt.gasUsed
        }
    except Exception as e:
        raise Exception(f"Error recording transfer on blockchain: {str(e)}")

async def register_medication(medication_data):
    """
    Register a new medication on the blockchain
    
    Args:
        medication_data: Data about the medication
        
    Returns:
        dict: Transaction receipt details
    """
    if not PRIVATE_KEY:
        raise Exception("Private key not configured for blockchain transactions")
    
    try:
        # Convert dates to timestamps
        expiration_timestamp = int(datetime.fromisoformat(medication_data['expirationDate']).timestamp())
        manufacturing_timestamp = int(datetime.fromisoformat(medication_data['manufacturingDate']).timestamp())
        
        # Prepare transaction
        tx = contract.functions.registerMedication(
            medication_data['lotNumber'],
            medication_data['ndc'],
            medication_data['quantity'],
            expiration_timestamp,
            manufacturing_timestamp,
            medication_data['manufacturerLocation']
        ).build_transaction({
            'from': account_address,
            'nonce': w3.eth.get_transaction_count(account_address),
            'gas': 2000000,
            'gasPrice': w3.eth.gas_price
        })
        
        # Sign and send transaction
        signed_tx = w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        
        # Wait for transaction receipt
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        
        return {
            'success': receipt.status == 1,
            'transactionHash': receipt.transactionHash.hex(),
            'blockNumber': receipt.blockNumber,
            'gasUsed': receipt.gasUsed
        }
    except Exception as e:
        raise Exception(f"Error registering medication on blockchain: {str(e)}")

async def verify_on_chain(lot_number):
    """
    Verify a medication's authenticity directly on the blockchain
    
    Args:
        lot_number: Lot number to verify
        
    Returns:
        dict: Verification result
    """
    try:
        # Call the view function
        result = contract.functions.verifyMedication(lot_number).call()
        
        return {
            'isAuthentic': result[0],  # Assuming result is a tuple with isAuthentic as first element
            'manufacturer': result[1],
            'registrationTime': datetime.fromtimestamp(result[2]).isoformat(),
            'transferCount': result[3]
        }
    except Exception as e:
        raise Exception(f"Error verifying medication on blockchain: {str(e)}")
