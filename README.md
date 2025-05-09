# MicroBank - A Microloan System

### Overview:
MicroBank is a modern, web-based microloan management system designed to streamline loan applications, automate loan validation, and send notifications to users. It offers both a frontend built with React and a backend powered by Flask, ensuring seamless communication between users and the bank. The system enables staff to manage loan records, validate applications, and send updates to applicants.

### Objective:
The main objective of MicroBank is to simplify the process of managing microloans, from application submission to notification and approval/rejection. It automates the loan validation process and offers a transparent loan management experience for both staff and users.

### Tech Stack:

- **Frontend:**
  - React
  - Vite
  - ShadCN UI 
  - Tailwind CSS

- **Backend:**
  - Flask
  - SQLAlchemy (for SQLite)

- **Other Technologies:**
  - SQLite (as the database)
  - Resend (for transactional email notifications)

### System Description:
MicroBank provides users with an easy-to-use interface for submitting loan applications. Staff members can view applications, validate them based on automated checks, and approve or reject loans. Automated email notifications are sent to users, informing them of the status of their loan application. The system ensures that all operations are streamlined and that all parties (users and staff) stay informed throughout the loan process.

### Installation Guide:

#### 1. Prerequisites:

- Ensure you have **Node.js** (v16 or later) and **npm** installed for the frontend.
- Ensure you have **Python** (v3.8 or later) and **pip** installed for the backend.
- SQLite is used as the database for the backend. No additional setup is required for the database as it will be automatically created.

#### 2. Frontend Setup (React + Vite):

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/microbank.git
   cd microbank
   ```

2. Install Dependencies:
   Once inside the project folder, install the frontend dependencies using npm: