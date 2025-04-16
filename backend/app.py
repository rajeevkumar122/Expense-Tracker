from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import bcrypt
import jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv
from db_utils_mongo import (
    get_all_transactions,
    add_transaction,
    delete_transaction,
    get_transaction,
    update_transaction
)
from config.mongodb import get_collection

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# JWT secret
SECRET_KEY = os.getenv("JWT_SECRET", "super-secret-key")

# JWT creation
def create_token(user_id):
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(days=1)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

# JWT verification
def verify_token(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload.get('user_id')
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, KeyError):
        return None

# Middleware to extract user_id from JWT
def get_authenticated_user():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    token = auth_header.split(' ')[1]
    return verify_token(token)

# Register
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    if not data or not all(k in data for k in ['username', 'email', 'password']):
        return jsonify({"message": "Missing required fields"}), 400

    username, email, password = data['username'], data['email'], data['password']

    if len(password) < 8:
        return jsonify({"message": "Password must be at least 8 characters"}), 400

    users = get_collection('users')
    if users.find_one({"email": email}):
        return jsonify({"message": "User already exists"}), 409

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    user = {
        "username": username,
        "email": email,
        "password": hashed_password,
        "created_at": datetime.utcnow()
    }
    
    result = users.insert_one(user)
    user_id = str(result.inserted_id)
    
    token = create_token(user_id)
    return jsonify({
        "message": "User registered successfully",
        "token": token,
        "user": {
            "id": user_id,
            "username": username,
            "email": email
        }
    }), 201

# Login
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    if not data or not all(k in data for k in ['email', 'password']):
        return jsonify({"message": "Missing email or password"}), 400

    email, password = data['email'], data['password']
    users = get_collection('users')
    user = users.find_one({"email": email})
    
    if not user:
        return jsonify({"message": "User not found"}), 404

    if bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
        user_id = str(user['_id'])
        token = create_token(user_id)
        return jsonify({
            "message": "Login successful",
            "token": token,
            "user": {
                "id": user_id,
                "username": user['username'],
                "email": user['email']
            }
        }), 200
    else:
        return jsonify({"message": "Invalid password"}), 401

# Get Transactions
@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    user_id = get_authenticated_user()
    if not user_id:
        return jsonify({"message": "Unauthorized"}), 401

    try:
        transactions = get_all_transactions(user_id)
        return jsonify({"transactions": transactions, "success": True}), 200
    except Exception as e:
        return jsonify({"message": str(e), "success": False}), 500

# Add a transaction
@app.route('/api/transactions', methods=['POST'])
def add_new_transaction():
    user_id = get_authenticated_user()
    if not user_id:
        return jsonify({"message": "Unauthorized"}), 401

    data = request.json
    text, amount = data.get("text"), data.get("amount")

    if not text or amount is None:
        return jsonify({"message": "Text and amount are required"}), 400

    try:
        transaction_id = add_transaction(text, amount, user_id)
        return jsonify({"message": "Transaction added successfully", "id": transaction_id}), 201
    except Exception as e:
        return jsonify({"message": str(e)}), 500

# Update Transaction
@app.route('/api/transactions/<transaction_id>', methods=['PUT'])
def update_transaction_route(transaction_id):
    user_id = get_authenticated_user()
    if not user_id:
        return jsonify({"message": "Unauthorized"}), 401

    data = request.json
    text, amount = data.get("text"), data.get("amount")

    if not text or amount is None:
        return jsonify({"message": "Text and amount are required"}), 400

    try:
        if update_transaction(transaction_id, text, amount, user_id):
            transaction = get_transaction(transaction_id, user_id)
            if transaction:
                transaction['id'] = str(transaction['_id'])
                del transaction['_id']
                return jsonify({"message": "Transaction updated", "transaction": transaction}), 200
        return jsonify({"message": "Transaction not found"}), 404
    except Exception as e:
        return jsonify({"message": str(e)}), 500

# Delete Transaction
@app.route('/api/transactions/<transaction_id>', methods=['DELETE'])
def delete_transaction_route(transaction_id):
    user_id = get_authenticated_user()
    if not user_id:
        return jsonify({"message": "Unauthorized"}), 401

    try:
        if delete_transaction(transaction_id, user_id):
            return jsonify({"message": "Transaction deleted"}), 200
        return jsonify({"message": "Transaction not found"}), 404
    except Exception as e:
        return jsonify({"message": str(e)}), 500

# Health check
@app.route('/api/test', methods=['GET'])
def test():
    return jsonify({"message": "API is working fine!"}), 200

# Run app
if __name__ == '__main__':
    app.run(debug=True, port=5000)
