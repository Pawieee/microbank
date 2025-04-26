import json
import random
from datetime import datetime, timedelta

# Function to generate random data
def generate_data(id):
    first_names = ["Emily", "Michael", "Sarah", "David", "Jessica", "Robert", "Jennifer", "Thomas", "Lisa", "William"]
    last_names = ["Brown", "Johnson", "Williams", "Jones", "Miller", "Davis", "Garcia", "Rodriguez", "Wilson", "Martinez"]
    
    applicant_name = f"{random.choice(first_names)} {random.choice(last_names)}"
    
    # Generate random dates
    date_applied = datetime.now() - timedelta(days=random.randint(1, 60))
    start_date = date_applied + timedelta(days=random.randint(10, 30))
    
    duration = str(random.randint(1, 12))
    amount = str(random.randint(5000, 20000))
    status = random.choice(["pending", "approved", "rejected"])  # All lowercase
    email = f"{applicant_name.split()[0].lower()}{id}@example.com"
    
    return {
        "id": str(id),
        "applicantName": applicant_name,
        "startDate": start_date.strftime("%Y-%m-%d"),
        "duration": duration,
        "amount": amount,
        "status": status,
        "email": email,
        "term": duration,  # Same as duration in this example
        "dateApplied": date_applied.strftime("%Y-%m-%d")
    }

# Generate 100 entries
data = [generate_data(i+1) for i in range(100)]

# Write to JSON file
with open('C:/Users/Administrator/Downloads/applications.json', 'w') as f:
    json.dump(data, f, indent=2)

print("JSON file generated successfully with 100 entries (all status values in lowercase).")