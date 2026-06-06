import os
import csv
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CSV_FILE = "enquiries.csv"

# Ensure CSV exists with headers
if not os.path.exists(CSV_FILE):
    with open(CSV_FILE, mode='w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(["Date", "Type", "Name", "Mobile", "Email", "Destination", "Rooms_Persons", "Message", "SpecialReq"])

class EnquiryRequest(BaseModel):
    form_type: str  # "hotel" or "contact"
    name: str = ""
    mobile: str = ""
    email: str = ""
    destination: str = ""
    rooms_persons: str = ""
    message: str = ""
    special_req: str = ""

@app.get("/api/config")
def get_config():
    return {
        "emailjs_service_id": os.getenv("EMAILJS_SERVICE_ID", "YOUR_SERVICE_ID"),
        "emailjs_template_id": os.getenv("EMAILJS_TEMPLATE_ID", "YOUR_TEMPLATE_ID"),
        "emailjs_public_key": os.getenv("EMAILJS_PUBLIC_KEY", "YOUR_PUBLIC_KEY")
    }

@app.post("/api/enquiry")
def submit_enquiry(data: EnquiryRequest):
    date_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")


    
    # Save to CSV
    try:
        with open(CSV_FILE, mode='a', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow([
                date_str,
                data.form_type,
                data.name,
                data.mobile,
                data.email,
                data.destination,
                data.rooms_persons,
                data.message,
                data.special_req
            ])
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to save enquiry")
    return {"status": "success", "message": "Enquiry received successfully"}

@app.get("/api/enquiries")
def get_enquiries():
    enquiries = []
    if os.path.exists(CSV_FILE):
        with open(CSV_FILE, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                enquiries.append(row)
    return {"status": "success", "data": list(reversed(enquiries))}

"""
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Inquiry(BaseModel):
    name: str
    mobile: str
    email: str
    message: str

@app.post("/api/contact")
async def submit_inquiry(inquiry: Inquiry):
    # Save to database or Google Sheet
    # Send email notification
    return {"status": "success", "message": "Inquiry received"}
"""
