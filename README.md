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

2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

3. Install Dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

#### 3. Backend Setup (Flask):

1. Create and activate a virtual environment:
   ```bash
   python3 -m venv venv
   # Windows:
   venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create the database file:
   ```bash
   touch database.db
   ```

4. Initialize the database by running the SQL queries:
   ```bash
   sqlite3 database.db < query_board.sql
   ```

5. Run the backend server:
   ```bash
   flask run
   ```
  
### Running the Full Application:
Once both the frontend and backend are running, you can interact with MicroBank by opening http://localhost:5173 in your browser. The frontend will communicate with the backend to manage loan applications.

### Troubleshooting:
- Frontend Issues: Ensure that you have node_modules installed correctly by running npm install. If you encounter issues, try running npm clean-install.

- Backend Issues: Make sure your virtual environment is activated and that all dependencies are installed by running pip install -r requirements.txt. If you're getting errors related to the database, try running flask db upgrade again.

- CORS Issues: If you're encountering CORS errors when running the frontend and backend separately, ensure that the Flask app allows cross-origin requests. You may need to configure Flask-CORS.