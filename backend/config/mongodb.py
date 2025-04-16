from pymongo import MongoClient
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# MongoDB connection string
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
DB_NAME = os.getenv('DB_NAME', 'expense_tracker')

def get_db():
    """Get MongoDB database connection"""
    client = MongoClient(MONGO_URI)
    return client[DB_NAME]

def get_collection(collection_name):
    """Get MongoDB collection"""
    db = get_db()
    return db[collection_name]