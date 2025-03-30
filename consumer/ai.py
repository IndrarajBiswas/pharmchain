import requests
from flask import Flask, render_template_string, request

app = Flask(__name__)

# Your Gemini API key
API_KEY = 'AIzaSyBhUKYFqXoZT2VuFkFlm9ChtN6KKDhD-9w'
GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + API_KEY

# Example detailed drug information
drug_info = {
    'drug_name': 'PainRelief',
    'dosage': '250 mg once daily',
    'side_effects': 'Nausea, dizziness',
    'handling': 'Store in a cool dry place, away from sunlight.',
    'carbon_footprint': {'manufacturing': 50, 'shipping': 10},
    'recall_status': False,
    'packaging_sustainability': 'Recyclable',
}

# Function to summarize drug information using Gemini API
def summarize_with_gemini(text):
    headers = {
        'Content-Type': 'application/json',
    }
    payload = {
        'contents': [{
            'parts': [{'text': text}]
        }]
    }
    response = requests.post(GEMINI_API_URL, headers=headers, json=payload)

    if response.status_code == 200:
        response_data = response.json()
        # Extract the generated summary
        generated_summary = response_data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
        # Further format the generated summary for readability
        formatted_summary = format_summary(generated_summary)
        return formatted_summary
    else:
        return 'Error summarizing data.'

def format_summary(summary):
    # Basic formatting logic to clean up and make it readable
    formatted = f"<h2>AI Summary: {drug_info['drug_name']} Drug Information</h2>"

    # Dosage
    formatted += f"<h3>Dosage:</h3><p>{drug_info['dosage']}</p>"

    # Side Effects
    formatted += f"<h3>Common Side Effects:</h3><ul>"
    side_effects = drug_info['side_effects'].split(", ")
    for effect in side_effects:
        formatted += f"<li>{effect}</li>"
    formatted += "</ul>"
    formatted += f"<p><em>Note:</em> If side effects are severe or persistent, contact your doctor.</p>"

    # Handling Instructions
    formatted += f"<h3>Storage and Handling:</h3><ul><li>{drug_info['handling']}</li></ul>"

    # Carbon Footprint
    formatted += f"<h3>Carbon Footprint:</h3><ul>"
    formatted += f"<li>Manufacturing: {drug_info['carbon_footprint']['manufacturing']} kg CO2e</li>"
    formatted += f"<li>Shipping: {drug_info['carbon_footprint']['shipping']} kg CO2e</li>"
    formatted += "</ul>"
    formatted += f"<p><em>Note:</em> CO2e is a measure of carbon impact. You may want to add context like 'per dose' or 'per bottle' for clarity.</p>"

    # Packaging Sustainability
    formatted += f"<h3>Packaging Sustainability:</h3><p>{drug_info['packaging_sustainability']}</p>"

    # Adding AI Suggestions
    formatted += f"<h3>Suggestions for a More Comprehensive Summary:</h3><p>{summary}</p>"

    return formatted

@app.route('/')
def home():
    return "Welcome to the Drug Traceability System. Please visit /trace/DGR12345 to view drug details."

@app.route('/trace/<drug_id>', methods=['GET', 'POST'])
def trace(drug_id):
    summary = ''
    if request.method == 'POST':
        if 'summarize' in request.form:
            # Prepare the detailed information to send to the API for summarization
            detailed_info = (
                f"Drug Name: {drug_info['drug_name']}\n"
                f"Dosage: {drug_info['dosage']}\n"
                f"Side Effects: {drug_info['side_effects']}\n"
                f"Handling: {drug_info['handling']}\n"
                f"Carbon Footprint: Manufacturing: {drug_info['carbon_footprint']['manufacturing']} kg, "
                f"Shipping: {drug_info['carbon_footprint']['shipping']} kg\n"
                f"Recall Status: {'Recalled' if drug_info['recall_status'] else 'Not Recalled'}\n"
                f"Packaging Sustainability: {drug_info['packaging_sustainability']}"
            )
            # Get the summarized information from Gemini
            summary = summarize_with_gemini(detailed_info)

    return render_template_string("""
        <html>
            <body>
                <h1>{{ drug_info['drug_name'] }} Details</h1>
                <p><b>Dosage:</b> {{ drug_info['dosage'] }}</p>
                <p><b>Side Effects:</b> {{ drug_info['side_effects'] }}</p>
                <p><b>Handling:</b> {{ drug_info['handling'] }}</p>
                <p><b>Carbon Footprint:</b> Manufacturing: {{ drug_info['carbon_footprint']['manufacturing'] }} kg, Shipping: {{ drug_info['carbon_footprint']['shipping'] }} kg</p>
                <p><b>Recall Status:</b> {{ 'Recalled' if drug_info['recall_status'] else 'Not Recalled' }}</p>
                <p><b>Packaging Sustainability:</b> {{ drug_info['packaging_sustainability'] }}</p>
                
                <h3>Summary of Drug Information</h3>
                <p>{{ summary | safe }}</p>
                
                <form method="POST">
                    <button type="submit" name="summarize">Summarize Drug Information</button>
                </form>
            </body>
        </html>
    """, drug_info=drug_info, summary=summary)

if __name__ == '__main__':
    app.run(debug=True)
