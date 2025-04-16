from pymongo import MongoClient, ASCENDING
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# MongoDB connection string
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
DB_NAME = os.getenv('DB_NAME', 'expense_tracker')

def init_db():
    """Initialize MongoDB database with required collections and indexes"""
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]

    # Create users collection with email index
    users = db.users
    users.create_index([('email', ASCENDING)], unique=True)

    # Create transactions collection with user_id and created_at indexes
    transactions = db.transactions
    transactions.create_index([('user_id', ASCENDING)])
    transactions.create_index([('created_at', ASCENDING)])

    print(f"MongoDB database '{DB_NAME}' initialized successfully")

if __name__ == '__main__':
    init_db()