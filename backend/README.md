# Expense Tracker Backend

This is the Python Flask backend for the Expense Tracker application. It provides RESTful API endpoints for user authentication and transaction management.

## Prerequisites

- Python 3.8 or higher
- MySQL 5.7 or higher

## Setup Instructions

1. Create a virtual environment:
   ```
   python -m venv venv
   ```

2. Activate the virtual environment:
   - Windows:
     ```
     venv\Scripts\activate
     ```
   - macOS/Linux:
     ```
     source venv/bin/activate
     ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Configure your MySQL connection:
   - Edit the `.env` file with your MySQL credentials
   - Make sure your MySQL server is running

5. Create the database schema:
   ```
   python create_db.py
   ```

6. Start the server:
   ```
   python app.py
   ```

The server will start on http://localhost:5000

## API Endpoints

### Authentication

- **POST /api/register** - Register a new user
  - Request body: `{ "username": "string", "email": "string", "password": "string" }`
  - Response: JWT token

- **POST /api/login** - Login existing user
  - Request body: `{ "email": "string", "password": "string" }`
  - Response: JWT token and user data

### Transactions

All transaction endpoints require authentication with a JWT token in the Authorization header.

- **GET /api/transactions** - Get all transactions for the logged-in user
  - Response: Array of transactions

- **POST /api/transactions** - Add a new transaction
  - Request body: `{ "text": "string", "amount": number }`
  - Response: Created transaction

- **DELETE /api/transactions/:id** - Delete a transaction
  - Response: Success message with deleted transaction ID 