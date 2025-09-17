import qrcode
import json
import hashlib
import random
import os
from typing import Optional

from faker import Faker
from flask import Flask, render_template_string, request
import requests

app = Flask(__name__)

# Gemini API configuration (optional for the demo)
API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY")
GEMINI_API_URL: Optional[str] = None

if API_KEY:
    GEMINI_API_URL = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        "gemini-2.0-flash:generateContent?key="
        + API_KEY
    )

# Initialize Faker for generating fake data
fake = Faker()

# Predefined educational content for demo purposes
DOSAGE_OPTIONS = [
    "250 mg once daily", 
    "500 mg twice daily", 
    "100 mg every 8 hours", 
    "50 mg once daily"
]
SIDE_EFFECTS_OPTIONS = [
    "Nausea", "Headache", "Dizziness", "Dry mouth", "Fatigue"
]
HANDLING_INSTRUCTIONS = "Store at room temperature away from direct sunlight. Keep out of reach of children."

# Simulated carbon footprint values
CARBON_FOOTPRINTS = {
    "shipping": random.uniform(5.0, 50.0),  # in kg CO2
    "manufacturing": random.uniform(20.0, 150.0),  # in kg CO2
}

# Function to generate fake blockchain data for a given drug_id
def generate_fake_blockchain_data(drug_id):
    manufacturer = fake.company()
    packaging = random.choice(["Bottle of 100", "Pack of 50", "Box of 10", "Syringe of 5ml"])
    distribution = fake.city()
    status = random.choice(["In Transit", "Delivered", "Pending", "Shipped", "Out of Stock"])
    batch_number = f"{random.randint(1000000, 9999999)}"
    manufacture_date = fake.date_this_year().strftime("%Y-%m-%d")
    expiry_date = fake.date_this_year().strftime("%Y-%m-%d")

    dosage = random.choice(DOSAGE_OPTIONS)
    side_effects = random.sample(SIDE_EFFECTS_OPTIONS, k=2)
    handling = HANDLING_INSTRUCTIONS

    journey_points = [
        {"name": "Manufacturer", "location": fake.address(), "timestamp": "2025-01-15", "x": 50, "y": 50},
        {"name": "Distribution Center", "location": fake.address(), "timestamp": "2025-01-17", "x": 250, "y": 100},
        {"name": "Pharmacy", "location": fake.address(), "timestamp": "2025-01-20", "x": 450, "y": 200}
    ]

    recall_status = random.choice([True, False])
    packaging_sustainability = random.choice(["Recyclable", "Made from sustainable materials", "Non-recyclable"])

    units_sold = random.randint(100, 10000)
    units_distributed = random.choice(["Pharmacies", "Online", "Both"])

    blockchain_data = {
        "drug_id": drug_id,
        "drug_name": fake.word().capitalize() + "ol",
        "manufacturer": manufacturer,
        "manufacture_date": manufacture_date,
        "expiry_date": expiry_date,
        "packaging": packaging,
        "distribution": distribution,
        "batch_number": batch_number,
        "status": status,
        "dosage": dosage,
        "side_effects": side_effects,
        "handling": handling,
        "carbon_footprint": CARBON_FOOTPRINTS,
        "recall_status": recall_status,
        "packaging_sustainability": packaging_sustainability,
        "units_sold": units_sold,
        "units_distributed": units_distributed,
        "journey_points": journey_points,
        "qr_code_data": f"/trace/{drug_id}",  # Use relative path
        "ratings_and_reviews": []  
    }

    blockchain_data['block_hash'] = hashlib.sha256(json.dumps(blockchain_data, sort_keys=True).encode()).hexdigest()

    return blockchain_data

def generate_qr_code(drug_id):
    blockchain_data = generate_fake_blockchain_data(drug_id)
    # Use relative path for QR code
    qr_data = f"/trace/{drug_id}"
    qr = qrcode.make(qr_data)
    
    if not os.path.exists('static'):
        os.makedirs('static')

    qr_path = f"static/qr_code_{drug_id}.png"
    qr.save(qr_path)
    return qr_path, blockchain_data

# Function to summarize drug information using Gemini API
def summarize_with_gemini(text):
    if not GEMINI_API_URL:
        return "Gemini summarization is disabled. Set the GEMINI_API_KEY environment variable to enable this feature."

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
        return format_summary(generated_summary)
    else:
        return 'Error summarizing data.'

def format_summary(summary):
    # Split the summary into digestible chunks
    formatted = ""
    sections = summary.split("\n")

    for section in sections:
        if "Dosage" in section:
            formatted += f"<h3>Dosage:</h3><p>{section.split(':')[1].strip()}</p>"
        elif "Side Effects" in section:
            formatted += f"<h3>Side Effects:</h3><p>{section.split(':')[1].strip()}</p>"
        elif "Handling" in section:
            formatted += f"<h3>Handling:</h3><p>{section.split(':')[1].strip()}</p>"
        elif "Environmental Impact" in section:
            formatted += f"<h3>Environmental Impact:</h3><p>{section.split(':')[1].strip()}</p>"
        elif "Carbon Footprint" in section:
            formatted += f"<h3>Carbon Footprint:</h3><p>{section.split(':')[1].strip()}</p>"
        elif "Recall Status" in section:
            formatted += f"<h3>Recall Status:</h3><p>{section.split(':')[1].strip()}</p>"
        elif "Key Concerns" in section:
            formatted += f"<h3>Key Concerns & Considerations:</h3><p>{section.split(':')[1].strip()}</p>"
        else:
            formatted += f"<p>{section.strip()}</p>"
    return formatted

@app.route('/')
def home():
    drug_ids = ["DGR12345", "MDS98765", "CVR11223"]
    qr_codes_and_data = []
    for drug_id in drug_ids:
        qr_code_path, blockchain_data = generate_qr_code(drug_id)
        qr_codes_and_data.append((qr_code_path, blockchain_data))
    
    return render_template_string("""
        <html>
            <head>
                <title>Drug Traceability Demo</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.0/dist/css/bootstrap.min.css" rel="stylesheet">
                <style>
                    body {
                        font-family: 'Arial', sans-serif;
                        background: #f4f7fc;
                    }
                    .container {
                        background: white;
                        padding: 20px;
                        border-radius: 10px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    h1 {
                        color: #333;
                    }
                    .card {
                        border: none;
                        margin-bottom: 20px;
                    }
                    .card img {
                        border-radius: 8px;
                    }
                    .btn {
                        background-color: #007bff;
                        color: white;
                        border-radius: 5px;
                        padding: 10px 20px;
                    }
                    .btn:hover {
                        background-color: #0056b3;
                    }
                    .row {
                        display: flex;
                        justify-content: space-around;
                    }
                    .product-info {
                        margin-top: 15px;
                    }
                    .rating-btn {
                        background-color: #28a745;
                    }
                    .rating-btn:hover {
                        background-color: #218838;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1 class="text-center my-4">Drug Traceability</h1>
                    <p class="text-center mb-4">Scan any QR code to view traceability details and product education:</p>
                    <div class="row">
                        {% for qr_code_path, blockchain_data in qr_codes_and_data %}
                            <div class="col-md-4">
                                <div class="card">
                                    <img src="{{ url_for('static', filename=qr_code_path.split('/')[-1]) }}" class="card-img-top" alt="QR Code">
                                    <div class="card-body">
                                        <h5 class="card-title">{{ blockchain_data['drug_name'] }}</h5>
                                        <p class="card-text">{{ blockchain_data['manufacturer'] }}</p>
                                        <p class="product-info"><b>Status:</b> {{ blockchain_data['status'] }}</p>
                                        <a href="{{ url_for('trace', drug_id=blockchain_data['drug_id']) }}" class="btn">View Details</a>
                                    </div>
                                </div>
                            </div>
                        {% endfor %}
                    </div>
                </div>
                <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.0/dist/js/bootstrap.bundle.min.js"></script>
            </body>
        </html>
    """, qr_codes_and_data=qr_codes_and_data)

@app.route('/trace/<drug_id>', methods=['GET', 'POST'])
def trace(drug_id):
    blockchain_data = generate_fake_blockchain_data(drug_id)

    ai_summary = ""
    if request.method == 'POST' and 'summarize' in request.form:
        # Prepare detailed information to send to Gemini API
        detailed_info = (
            f"Drug Name: {blockchain_data['drug_name']}\n"
            f"Dosage: {blockchain_data['dosage']}\n"
            f"Side Effects: {', '.join(blockchain_data['side_effects'])}\n"
            f"Handling: {blockchain_data['handling']}\n"
            f"Carbon Footprint: Manufacturing: {blockchain_data['carbon_footprint']['manufacturing']} kg, "
            f"Shipping: {blockchain_data['carbon_footprint']['shipping']} kg\n"
            f"Recall Status: {'Recalled' if blockchain_data['recall_status'] else 'Not Recalled'}\n"
            f"Packaging Sustainability: {blockchain_data['packaging_sustainability']}"
        )
        
        ai_summary = summarize_with_gemini(detailed_info)

    # Generate SVG for the product journey roadmap
    journey_points = blockchain_data["journey_points"]
    
    points_svg = ""
    lines_svg = ""
    for i, point in enumerate(journey_points):
        points_svg += f'<circle cx="{point["x"]}" cy="{point["y"]}" r="10" fill="blue" />'
        points_svg += f'<text x="{point["x"] + 15}" y="{point["y"]}" font-size="12" fill="black">{point["name"]}</text>'
        points_svg += f'<text x="{point["x"] + 15}" y="{point["y"] + 15}" font-size="10" fill="black">{point["location"]}</text>'
        points_svg += f'<text x="{point["x"] + 15}" y="{point["y"] + 30}" font-size="10" fill="black">Timestamp: {point["timestamp"]}</text>'
        
        if i > 0:
            prev_point = journey_points[i - 1]
            lines_svg += f'<line x1="{prev_point["x"]}" y1="{prev_point["y"]}" x2="{point["x"]}" y2="{point["y"]}" stroke="black" stroke-width="2" />'

    return render_template_string("""
        <html>
            <head>
                <title>Traceability Details for {{ blockchain_data['drug_id'] }}</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.0/dist/css/bootstrap.min.css" rel="stylesheet">
                <style>
                    body {
                        background: #f4f7fc;
                    }
                    .container {
                        background: white;
                        padding: 20px;
                        border-radius: 10px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    h1 {
                        color: #333;
                    }
                    .card {
                        border: none;
                        margin-bottom: 20px;
                    }
                    .product-info {
                        margin-top: 15px;
                    }
                    .rating-btn {
                        background-color: #28a745;
                    }
                    .rating-btn:hover {
                        background-color: #218838;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Traceability Information for Drug: {{ blockchain_data['drug_id'] }}</h1>
                    <h3>AI Summary</h3>
                    <p>{{ ai_summary | safe }}</p>  <!-- Display AI Summary -->
                    <p><b>Drug Name:</b> {{ blockchain_data['drug_name'] }}</p>
                    <p><b>Manufacturer:</b> {{ blockchain_data['manufacturer'] }}</p>
                    <p><b>Manufacture Date:</b> {{ blockchain_data['manufacture_date'] }}</p>
                    <p><b>Expiry Date:</b> {{ blockchain_data['expiry_date'] }}</p>
                    <p><b>Batch Number:</b> {{ blockchain_data['batch_number'] }}</p>
                    <p><b>Carbon Footprint (Manufacturing):</b> {{ blockchain_data['carbon_footprint']['manufacturing'] }} kg CO2</p>
                    <p><b>Carbon Footprint (Shipping):</b> {{ blockchain_data['carbon_footprint']['shipping'] }} kg CO2</p>
                    <p><b>Recall Status:</b> {{ 'Recalled' if blockchain_data['recall_status'] else 'Not Recalled' }}</p>
                    <p><b>Packaging Sustainability:</b> {{ blockchain_data['packaging_sustainability'] }}</p>

                    <h3>Product Education</h3>
                    <p><b>Dosage:</b> {{ blockchain_data['dosage'] }}</p>
                    <p><b>Possible Side Effects:</b> {{ blockchain_data['side_effects'] | join(', ') }}</p>
                    <p><b>Handling Practices:</b> {{ blockchain_data['handling'] }}</p>

                    <h3>Ratings and Reviews</h3>
                    <form method="POST">
                        <label for="rating">Rating (1-5):</label><br>
                        <input type="text" name="rating" required><br>
                        <label for="review">Review:</label><br>
                        <textarea name="review" required></textarea><br>
                        <input type="submit" class="rating-btn" value="Submit Review">
                    </form>

                    <h3>Submitted Reviews</h3>
                    {% for review in blockchain_data['ratings_and_reviews'] %}
                        <p><b>Rating:</b> {{ review['rating'] }}</p>
                        <p><b>Review:</b> {{ review['review'] }}</p>
                        <hr>
                    {% endfor %}

                    <h2>Product Journey Roadmap</h2>
                    <svg width="800" height="300" style="border:1px solid black;">
                        {{ points_svg | safe }}
                        {{ lines_svg | safe }}
                    </svg>
                </div>
            </body>
        </html>
    """, blockchain_data=blockchain_data, ai_summary=ai_summary, points_svg=points_svg, lines_svg=lines_svg)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
