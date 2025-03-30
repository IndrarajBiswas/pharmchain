# frontend.py
import streamlit as st
import requests
import pandas as pd
import json
import plotly.graph_objects as go
from datetime import datetime
import os

# API endpoint
API_URL = "http://localhost:8000"

# Set page config
st.set_page_config(
    page_title="Pharmaceutical Authentication System",
    page_icon="💊",
    layout="wide"
)

# Sidebar navigation
st.sidebar.title("Navigation")
page = st.sidebar.radio(
    "Select a page",
    ["Verify Medication", "Process Document", "Medication Journey", "Batch Processing"]
)

# Helper functions
def upload_document(file):
    """Upload a document for processing"""
    files = {"file": file}
    response = requests.post(f"{API_URL}/api/process-document", files=files)
    return response.json()

def verify_medication(lot_number, ndc, scanned_data=None):
    """Verify medication authenticity"""
    payload = {
        "lotNumber": lot_number,
        "ndc": ndc,
        "scannedData": scanned_data
    }
    response = requests.post(f"{API_URL}/api/verify-medication", json=payload)
    return response.json()

def get_medication_history(lot_number):
    """Get medication transfer history"""
    response = requests.get(f"{API_URL}/api/medication-history/{lot_number}")
    return response.json()

def get_journey_map(lot_number):
    """Get medication journey visualization data"""
    response = requests.get(f"{API_URL}/api/journey-map/{lot_number}")
    return response.json()

def process_batch(file):
    """Process a batch file of medications"""
    files = {"file": file}
    response = requests.post(f"{API_URL}/api/batch-process", files=files)
    return response.json()

# Verify Medication page
if page == "Verify Medication":
    st.title("Medication Verification")
    
    # Input method selection
    input_method = st.radio(
        "Select input method",
        ["Manual Entry", "Scan Document"]
    )
    
    if input_method == "Manual Entry":
        # Manual entry form
        with st.form("verification_form"):
            lot_number = st.text_input("Lot Number", placeholder="e.g. BX729A44")
            ndc = st.text_input("NDC Code", placeholder="e.g. 12345-678-90")
            submit_button = st.form_submit_button("Verify Medication")
            
            if submit_button:
                if not lot_number or not ndc:
                    st.error("Please enter both Lot Number and NDC Code")
                else:
                    with st.spinner("Verifying medication..."):
                        try:
                            result = verify_medication(lot_number, ndc)
                            
                            # Display verification results
                            if result.get("isAuthentic"):
                                st.success("✅ Authentic Medication Verified")
                            else:
                                st.error("❌ Potential Counterfeit Medication")
                            
                            # Display results in tabs
                            tab1, tab2 = st.tabs(["Verification Details", "Blockchain History"])
                            
                            with tab1:
                                # Enhanced verification details
                                enhanced = result.get("enhancedVerification", {})
                                st.subheader("Verification Details")
                                
                                # Create two columns
                                col1, col2 = st.columns(2)
                                
                                with col1:
                                    st.metric("Authenticity Score", f"{enhanced.get('authenticityScore', 0) * 100:.1f}%")
                                    st.write("**Lot Number:**", lot_number)
                                    st.write("**NDC Code:**", ndc)
                                
                                with col2:
                                    blockchain_verify = result.get("blockchainVerification", {})
                                    st.write("**Manufacturer:**", blockchain_verify.get("manufacturer", "Unknown"))
                                    st.write("**Registration Date:**", blockchain_verify.get("registrationTime", "Unknown"))
                                    st.write("**Transfer Count:**", blockchain_verify.get("transferCount", 0))
                                
                                # Issues and recommendations
                                if enhanced.get("issues"):
                                    st.subheader("Issues")
                                    for issue in enhanced.get("issues", []):
                                        st.warning(issue)
                                
                                if enhanced.get("recommendations"):
                                    st.subheader("Recommendations")
                                    for rec in enhanced.get("recommendations", []):
                                        st.info(rec)
                            
                            with tab2:
                                # Show blockchain history
                                history = result.get("history", [])
                                if history:
                                    st.subheader(f"Transfer History ({len(history)} transfers)")
                                    
                                    # Convert to DataFrame for display
                                    df = pd.DataFrame(history)
                                    if not df.empty:
                                        # Format timestamp
                                        if "timestamp" in df.columns:
                                            df["timestamp"] = pd.to_datetime(df["timestamp"])
                                            df["formatted_date"] = df["timestamp"].dt.strftime("%Y-%m-%d %H:%M")
                                        
                                        st.dataframe(df[["from", "to", "location", "formatted_date", "verified"]])
                                else:
                                    st.info("No blockchain history found for this medication")
                        except Exception as e:
                            st.error(f"Error verifying medication: {str(e)}")
    else:
        # Scan document form
        st.subheader("Upload Document")
        uploaded_file = st.file_uploader("Upload transfer document, receipt, or packaging image", type=["jpg", "jpeg", "png", "pdf"])
        
        if uploaded_file is not None:
            with st.spinner("Processing document..."):
                try:
                    # Save the uploaded file temporarily
                    with open("temp_upload.jpg", "wb") as f:
                        f.write(uploaded_file.getbuffer())
                    
                    # Process the document
                    document_data = upload_document(uploaded_file)
                    
                    # Display extracted information
                    st.subheader("Extracted Information")
                    
                    # Create columns for better layout
                    col1, col2 = st.columns(2)
                    
                    # Display information in columns
                    with col1:
                        st.write("**Medication Name:**", document_data.get("medicationName", "Not found"))
                        st.write("**Lot Number:**", document_data.get("lotNumber", "Not found"))
                        st.write("**NDC Code:**", document_data.get("ndc", "Not found"))
                        st.write("**Quantity:**", document_data.get("quantity", "Not found"))
                    
                    with col2:
                        st.write("**Source:**", document_data.get("sourceLocation", "Not found"))
                        st.write("**Destination:**", document_data.get("destinationLocation", "Not found"))
                        st.write("**Transfer Date:**", document_data.get("transferDate", "Not found"))
                        st.write("**Expiration Date:**", document_data.get("expirationDate", "Not found"))
                    
                    # Verify button
                    if st.button("Verify This Medication"):
                        lot_number = document_data.get("lotNumber")
                        ndc = document_data.get("ndc")
                        
                        if lot_number and ndc:
                            with st.spinner("Verifying medication..."):
                                result = verify_medication(lot_number, ndc, document_data)
                                
                                # Display verification results
                                if result.get("isAuthentic"):
                                    st.success("✅ Authentic Medication Verified")
                                else:
                                    st.error("❌ Potential Counterfeit Medication")
                                
                                # Display detailed results
                                with st.expander("View Verification Details", expanded=True):
                                    # Enhanced verification details
                                    enhanced = result.get("enhancedVerification", {})
                                    
                                    col1, col2 = st.columns(2)
                                    
                                    with col1:
                                        st.metric("Authenticity Score", f"{enhanced.get('authenticityScore', 0) * 100:.1f}%")
                                    
                                    with col2:
                                        blockchain_verify = result.get("blockchainVerification", {})
                                        st.write("**Transfers:**", blockchain_verify.get("transferCount", 0))
                                    
                                    # Issues and recommendations
                                    if enhanced.get("issues"):
                                        st.subheader("Issues")
                                        for issue in enhanced.get("issues", []):
                                            st.warning(issue)
                                    
                                    if enhanced.get("recommendations"):
                                        st.subheader("Recommendations")
                                        for rec in enhanced.get("recommendations", []):
                                            st.info(rec)
                        else:
                            st.error("Could not extract lot number or NDC from document")
                except Exception as e:
                    st.error(f"Error processing document: {str(e)}")

# Medication Journey page
elif page == "Medication Journey":
    st.title("Medication Journey Tracking")
    
    # Input form
    with st.form("journey_form"):
        lot_number = st.text_input("Lot Number", placeholder="e.g. BX729A44")
        submit_button = st.form_submit_button("Track Medication")
        
        if submit_button:
            if not lot_number:
                st.error("Please enter a Lot Number")
            else:
                with st.spinner("Tracking medication journey..."):
                    try:
                        # Get medication history
                        history = get_medication_history(lot_number)
                        
                        if not history:
                            st.warning("No journey data found for this medication")
                        else:
                            # Get journey map data
                            map_data = get_journey_map(lot_number)
                            
                            # Display journey overview
                            st.subheader("Journey Overview")
                            
                            # Create metrics
                            col1, col2, col3 = st.columns(3)
                            
                            with col1:
                                st.metric("Total Transfers", len(history))
                            
                            with col2:
                                if history:
                                    time_format = "%Y-%m-%dT%H:%M:%S"
                                    start_time = datetime.strptime(history[0]["timestamp"].split(".")[0], time_format)
                                    end_time = datetime.strptime(history[-1]["timestamp"].split(".")[0], time_format)
                                    days_in_transit = (end_time - start_time).days
                                    st.metric("Days in Transit", days_in_transit)
                            
                            with col3:
                                verified_count = sum(1 for transfer in history if transfer.get("verified", False))
                                st.metric("Verified Transfers", f"{verified_count}/{len(history)}")
                            
                            # Display journey map
                            st.subheader("Journey Visualization")
                            
                            # Create a timeline
                            fig = go.Figure()
                            
                            # Add timeline events
                            for i, transfer in enumerate(history):
                                fig.add_trace(go.Scatter(
                                    x=[transfer["timestamp"].split("T")[0]],
                                    y=[i],
                                    mode="markers+text",
                                    marker=dict(
                                        size=20,
                                        color="green" if transfer.get("verified", False) else "orange",
                                        symbol="circle"
                                    ),
                                    text=[f"{transfer['from']} → {transfer['to']}"],
                                    textposition="middle right",
                                    name=f"Transfer {i+1}"
                                ))
                            
                            # Update layout
                            fig.update_layout(
                                title="Medication Transfer Timeline",
                                xaxis_title="Date",
                                yaxis_title="Transfer Steps",
                                showlegend=False,
                                height=400,
                                margin=dict(l=50, r=50, t=50, b=50)
                            )
                            
                            # Show figure
                            st.plotly_chart(fig, use_container_width=True)
                            
                            # Display transfer details in a table
                            st.subheader("Transfer Details")
                            
                            # Convert to DataFrame
                            df = pd.DataFrame(history)
                            df["timestamp"] = pd.to_datetime(df["timestamp"])
                            df["formatted_date"] = df["timestamp"].dt.strftime("%Y-%m-%d %H:%M")
                            
                            # Show as table
                            st.dataframe(
                                df[["from", "to", "location", "formatted_date", "verified"]],
                                use_container_width=True
                            )
                            
                            # Risk assessment
                            if map_data and "riskScores" in map_data:
                                st.subheader("Risk Assessment")
                                
                                # Create risk visualization
                                risk_fig = go.Figure()
                                
                                # Add risk scores
                                risk_scores = map_data["riskScores"]
                                transfer_labels = [f"Transfer {i+1}" for i in range(len(risk_scores))]
                                
                                risk_fig.add_trace(go.Bar(
                                    x=transfer_labels,
                                    y=risk_scores,
                                    marker_color=["green" if score < 0.3 else "orange" if score < 0.7 else "red" for score in risk_scores]
                                ))
                                
                                # Update layout
                                risk_fig.update_layout(
                                    title="Transfer Risk Assessment",
                                    xaxis_title="Transfer Step",
                                    yaxis_title="Risk Score (0-1)",
                                    yaxis=dict(range=[0, 1]),
                                    height=300
                                )
                                
                                # Show figure
                                st.plotly_chart(risk_fig, use_container_width=True)
                    except Exception as e:
                        st.error(f"Error tracking medication: {str(e)}")

# Process Document page
elif page == "Process Document":
    st.title("Document Processing")
    
    st.write("""
    Upload transfer documents, shipping manifests, or receipts to extract pharmaceutical data.
    The system will use Gemini AI to identify key information like lot numbers, NDCs, and transfer details.
    """)
    
    uploaded_file = st.file_uploader("Upload document", type=["jpg", "jpeg", "png", "pdf"])
    
    if uploaded_file is not None:
        with st.spinner("Processing document..."):
            try:
                # Process the document
                document_data = upload_document(uploaded_file)
                
                # Display results in a nice format
                st.subheader("Extracted Information")
                
                # Check if there was an error
                if "error" in document_data:
                    st.error(f"Error: {document_data['error']}")
                    if "raw_text" in document_data:
                        with st.expander("Raw Text"):
                            st.text(document_data["raw_text"])
                else:
                    # Create a formatted display of the extracted data
                    col1, col2 = st.columns(2)
                    
                    with col1:
                        st.markdown("##### Product Information")
                        st.write("**Medication Name:**", document_data.get("medicationName", "Not found"))
                        st.write("**NDC Code:**", document_data.get("ndc", "Not found"))
                        st.write("**Lot Number:**", document_data.get("lotNumber", "Not found"))
                        st.write("**Quantity:**", document_data.get("quantity", "Not found"))
                        st.write("**Expiration Date:**", document_data.get("expirationDate", "Not found"))
                    
                    with col2:
                        st.markdown("##### Transfer Information")
                        st.write("**Source Location:**", document_data.get("sourceLocation", "Not found"))
                        st.write("**Destination:**", document_data.get("destinationLocation", "Not found"))
                        st.write("**Transfer Date:**", document_data.get("transferDate", "Not found"))
                        if "signatures" in document_data and document_data["signatures"]:
                            st.write("**Authorized By:**", ", ".join(document_data["signatures"]))
                    
                    # Convert to JSON for export
                    st.subheader("JSON Data")
                    st.json(document_data)
                    
                    # Export options
                    if st.button("Export to CSV"):
                        # Convert to DataFrame and export
                        df = pd.DataFrame([document_data])
                        df.to_csv("extracted_data.csv", index=False)
                        st.success("Data exported to extracted_data.csv")
            except Exception as e:
                st.error(f"Error processing document: {str(e)}")

# Batch Processing page
elif page == "Batch Processing":
    st.title("Batch Verification")
    
    st.write("""
    Upload a CSV or Excel file with medication details for batch verification.
    The file should contain columns for 'lotNumber' and 'ndc' at minimum.
    """)
    
    # Upload form
    uploaded_file = st.file_uploader("Upload batch file", type=["csv", "xlsx", "xls"])
    
    if uploaded_file is not None:
        # Display file preview
        try:
            if uploaded_file.name.endswith('.csv'):
                df = pd.read_csv(uploaded_file)
            else:
                df = pd.read_excel(uploaded_file)
            
            st.subheader("File Preview")
            st.dataframe(df.head())
            
            # Check required columns
            required_columns = ['lotNumber', 'ndc']
            missing_columns = [col for col in required_columns if col not in df.columns]
            
            if missing_columns:
                st.error(f"Missing required columns: {', '.join(missing_columns)}")
            else:
                st.write(f"Total records: {len(df)}")
                
                # Process button
                if st.button("Process Batch"):
                    with st.spinner(f"Processing {len(df)} records..."):
                        try:
                            # Send for batch processing
                            result = process_batch(uploaded_file)
                            
                            # Display result
                            st.success(f"Batch processing started: {result.get('message')}")
                            st.info(f"Total records: {result.get('total_records')}")
                            st.warning("Processing will continue in the background. Results will be saved to batch_results.csv when complete.")
                        except Exception as e:
                            st.error(f"Error processing batch: {str(e)}")
        except Exception as e:
            st.error(f"Error reading file: {str(e)}")

# Add footer
st.sidebar.markdown("---")
st.sidebar.info(
    "This application uses Gemini API to verify pharmaceutical authenticity "
    "and track medications through the supply chain."
)