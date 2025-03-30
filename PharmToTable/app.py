# app.py
import os
import shutil
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import pandas as pd
import tempfile

# Import modules
from gemini_helpers import (
    process_document_image,
    analyze_ledger_data,
    verify_medication,
    generate_journey_visualization
)
from blockchain import (
    get_medication_history,
    record_transfer,
    register_medication,
    verify_on_chain
)

# Create FastAPI app
app = FastAPI(title="Pharmaceutical Authentication API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define models
class MedicationVerifyRequest(BaseModel):
    lotNumber: str
    ndc: str
    scannedData: Optional[dict] = None

class TransferRequest(BaseModel):
    from_address: str
    to_address: str
    lotNumber: str
    ndc: str
    quantity: int
    expirationDate: str
    transferDate: str
    location: str

class RegisterMedicationRequest(BaseModel):
    lotNumber: str
    ndc: str
    medicationName: str
    quantity: int
    manufacturerLocation: str
    manufacturingDate: str
    expirationDate: str

# Create uploads directory if it doesn't exist
os.makedirs("uploads", exist_ok=True)

@app.post("/api/process-document")
async def process_document(file: UploadFile = File(...)):
    """
    Process an uploaded document image to extract pharmaceutical data
    """
    try:
        # Save the uploaded file temporarily
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1])
        try:
            shutil.copyfileobj(file.file, temp_file)
        finally:
            temp_file.close()
            file.file.close()
        
        # Process the document with Gemini
        result = await process_document_image(temp_file.name)
        
        # Delete the temporary file
        os.unlink(temp_file.name)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze-ledger")
async def analyze_ledger(file: UploadFile = File(...)):
    """
    Analyze an uploaded ledger file
    """
    try:
        # Read the file content
        content = await file.read()
        content_str = content.decode("utf-8")
        
        # Process the ledger with Gemini
        result = await analyze_ledger_data(content_str)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/verify-medication")
async def verify_medication_endpoint(request: MedicationVerifyRequest):
    """
    Verify medication authenticity
    """
    try:
        # Get blockchain history
        blockchain_data = await get_medication_history(request.lotNumber)
        
        # First check on-chain verification
        onchain_verification = await verify_on_chain(request.lotNumber)
        
        # Use Gemini for enhanced verification
        gemini_verification = await verify_medication({
            "lotNumber": request.lotNumber,
            "ndc": request.ndc,
            **(request.scannedData or {})
        }, blockchain_data)
        
        # Combine results
        return {
            "blockchainVerification": onchain_verification,
            "enhancedVerification": gemini_verification,
            "isAuthentic": onchain_verification["isAuthentic"] and gemini_verification.get("isAuthentic", False),
            "history": blockchain_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/medication-history/{lot_number}")
async def medication_history(lot_number: str):
    """
    Get medication transfer history
    """
    try:
        history = await get_medication_history(lot_number)
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/record-transfer")
async def record_transfer_endpoint(request: TransferRequest):
    """
    Record a medication transfer on the blockchain
    """
    try:
        # Transform the request to match blockchain function
        transfer_data = {
            "from": request.from_address,
            "to": request.to_address,
            "lotNumber": request.lotNumber,
            "ndc": request.ndc,
            "quantity": request.quantity,
            "expirationDate": request.expirationDate,
            "transferDate": request.transferDate,
            "location": request.location
        }
        
        # Record on blockchain
        result = await record_transfer(transfer_data)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/register-medication")
async def register_medication_endpoint(request: RegisterMedicationRequest):
    """
    Register a new medication on the blockchain
    """
    try:
        # Transform the request to match blockchain function
        medication_data = {
            "lotNumber": request.lotNumber,
            "ndc": request.ndc,
            "medicationName": request.medicationName,
            "quantity": request.quantity,
            "manufacturerLocation": request.manufacturerLocation,
            "manufacturingDate": request.manufacturingDate,
            "expirationDate": request.expirationDate
        }
        
        # Register on blockchain
        result = await register_medication(medication_data)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/journey-map/{lot_number}")
async def journey_map(lot_number: str):
    """
    Generate a visualization map for a medication's journey
    """
    try:
        # Get blockchain history
        blockchain_data = await get_medication_history(lot_number)
        
        # Use Gemini to generate visualization data
        result = await generate_journey_visualization(blockchain_data)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/batch-process")
async def batch_process(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """
    Process a batch file (CSV or Excel) of medications for bulk verification
    """
    try:
        # Save the uploaded file temporarily
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1])
        try:
            shutil.copyfileobj(file.file, temp_file)
        finally:
            temp_file.close()
            file.file.close()
        
        # Read the file based on extension
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext == '.csv':
            df = pd.read_csv(temp_file.name)
        elif file_ext in ['.xlsx', '.xls']:
            df = pd.read_excel(temp_file.name)
        else:
            os.unlink(temp_file.name)
            raise HTTPException(status_code=400, detail="Unsupported file format")
        
        # Check for required columns
        required_columns = ['lotNumber', 'ndc']
        if not all(col in df.columns for col in required_columns):
            os.unlink(temp_file.name)
            raise HTTPException(
                status_code=400, 
                detail=f"Missing required columns. File must contain: {', '.join(required_columns)}"
            )
        
        # Process in background
        background_tasks.add_task(process_batch, df, temp_file.name)
        
        return {"message": "Batch processing started", "total_records": len(df)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def process_batch(df, temp_file):
    """
    Background task to process a batch of medications
    """
    try:
        results = []
        for idx, row in df.iterrows():
            try:
                # Verify each medication
                verification = await verify_medication_endpoint(
                    MedicationVerifyRequest(
                        lotNumber=row['lotNumber'],
                        ndc=row['ndc']
                    )
                )
                results.append({
                    "lotNumber": row['lotNumber'],
                    "ndc": row['ndc'],
                    "isAuthentic": verification["isAuthentic"],
                    "authenticityScore": verification["enhancedVerification"].get("authenticityScore", 0)
                })
            except Exception as e:
                results.append({
                    "lotNumber": row['lotNumber'],
                    "ndc": row['ndc'],
                    "error": str(e)
                })
        
        # Save results to a CSV file
        result_df = pd.DataFrame(results)
        result_df.to_csv('batch_results.csv', index=False)
    finally:
        # Delete the temporary file
        if os.path.exists(temp_file):
            os.unlink(temp_file)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
