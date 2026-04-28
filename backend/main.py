import os
import csv
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
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

def send_email(data: EnquiryRequest):
    sender_email = os.getenv("SMTP_EMAIL")
    sender_password = os.getenv("SMTP_PASSWORD")
    recipient_email = "shreymulani41@gmail.com"

    if not sender_email or not sender_password:
        print("Warning: SMTP_EMAIL or SMTP_PASSWORD not set in .env. Email not sent.")
        return

    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = recipient_email
    msg['Subject'] = f"New {data.form_type.capitalize()} Enquiry from {data.name}"

    body = f"""
    New Enquiry Received:

    Form Type: {data.form_type}
    Name: {data.name}
    Mobile: {data.mobile}
    Email: {data.email}
    Destination: {data.destination}
    Rooms/Persons: {data.rooms_persons}
    Message: {data.message}
    Special Requirement: {data.special_req}
    """
    msg.attach(MIMEText(body, 'plain'))

    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        print("Email sent successfully!")
    except Exception as e:
        print(f"Failed to send email: {e}")

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

    # Send Email
    send_email(data)

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
