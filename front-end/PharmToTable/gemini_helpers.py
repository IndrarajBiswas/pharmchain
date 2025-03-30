# gemini_helpers.py
import base64
import json
from io import BytesIO
from PIL import Image
from config import model
import google.generativeai as genai

def encode_image(image_path):
    """
    Encode an image file to base64 for Gemini API
    """
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")

async def process_document_image(image_path):
    """
    Extract pharmaceutical data from document image
    
    Args:
        image_path: Path to the document image
        
    Returns:
        dict: Extracted pharmaceutical data
    """
    try:
        # Load and encode the image
        img = Image.open(image_path)
        
        # Create a BytesIO object to hold the image data
        buffer = BytesIO()
        img.save(buffer, format=img.format)
        buffer.seek(0)
        
        # Create prompt for document parsing
        prompt = """
        Extract the following information from this pharmaceutical transfer document:
        - Medication name
        - NDC (National Drug Code)
        - Lot number
        - Expiration date
        - Quantity
        - Source facility
        - Destination facility
        - Transfer date
        - Signatures/Authorities
        
        Format the response as JSON with these exact field names:
        {
          "medicationName": string,
          "ndc": string,
          "lotNumber": string,
          "expirationDate": string,
          "quantity": number,
          "sourceLocation": string,
          "destinationLocation": string,
          "transferDate": string,
          "signatures": list of strings
        }
        """
        
        # Send multimodal request to Gemini
        response = model.generate_content(
            [prompt, {"mime_type": "image/jpeg", "data": buffer.getvalue()}]
        )
        
        # Parse the response
        try:
            # Try to parse as valid JSON
            result = json.loads(response.text)
            return result
        except json.JSONDecodeError:
            # If not valid JSON, extract it from the text
            return {"error": "Invalid JSON response", "raw_text": response.text}
            
    except Exception as e:
        return {"error": str(e)}

async def analyze_ledger_data(ledger_content):
    """
    Analyze pharmaceutical ledger data to identify patterns and anomalies
    
    Args:
        ledger_content: Content of the ledger file
        
    Returns:
        dict: Analysis results
    """
    try:
        prompt = f"""
        Analyze this pharmaceutical supply chain ledger:
        {ledger_content}
        
        Provide:
        1. A summary of all transfers (count, total units, etc.)
        2. Identify any suspicious patterns or anomalies
        3. List any medications with incomplete supply chains
        4. Flag any unusual time gaps between transfers
        5. Provide recommendations for improving traceability
        
        Format your response as JSON with these sections.
        """
        
        response = model.generate_content(prompt)
        
        try:
            result = json.loads(response.text)
            return result
        except json.JSONDecodeError:
            return {"error": "Invalid JSON response", "raw_text": response.text}
            
    except Exception as e:
        return {"error": str(e)}

async def verify_medication(medication_data, blockchain_data):
    """
    Verify medication authenticity based on data and blockchain history
    
    Args:
        medication_data: Data about the medication
        blockchain_data: History from blockchain
        
    Returns:
        dict: Verification results
    """
    try:
        prompt = f"""
        Verify the authenticity of this pharmaceutical product:
        
        Current scan data:
        {json.dumps(medication_data, indent=2)}
        
        Supply chain history from blockchain:
        {json.dumps(blockchain_data, indent=2)}
        
        Analyze:
        1. Is there a complete chain of custody from manufacturer to current point?
        2. Are there any suspicious time gaps or location jumps?
        3. Does the product data match what was recorded at manufacturing?
        4. Calculate an authenticity score based on these factors.
        
        Return JSON with fields: 
        {
          "isAuthentic": boolean,
          "authenticityScore": number (0-1),
          "issues": list of strings,
          "recommendations": list of strings
        }
        """
        
        response = model.generate_content(prompt)
        
        try:
            result = json.loads(response.text)
            return result
        except json.JSONDecodeError:
            return {"error": "Invalid JSON response", "raw_text": response.text}
            
    except Exception as e:
        return {"error": str(e)}

async def generate_journey_visualization(blockchain_data):
    """
    Generate journey visualization data based on blockchain history
    
    Args:
        blockchain_data: History from blockchain
        
    Returns:
        dict: Visualization data
    """
    try:
        prompt = f"""
        Generate a journey map from these pharmaceutical supply chain records:
        {json.dumps(blockchain_data, indent=2)}
        
        For each transfer point, calculate:
        1. Time in transit
        2. Geographic distance traveled
        3. Risk score based on time gaps and unusual location changes
        
        Format the response as a JSON object ready for visualization with:
        {{
          "nodes": [array of locations with coordinates],
          "edges": [connections between locations],
          "timeData": [timestamps for each transfer],
          "riskScores": [risk assessment for each transfer],
          "summary": {{overall statistics}}
        }}
        """
        
        response = model.generate_content(prompt)
        
        try:
            result = json.loads(response.text)
            return result
        except json.JSONDecodeError:
            return {"error": "Invalid JSON response", "raw_text": response.text}
            
    except Exception as e:
        return {"error": str(e)}