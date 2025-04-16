from bson import ObjectId
from datetime import datetime
from config.mongodb import get_collection

def get_all_transactions(user_id):
    """Get all transactions for a specific user"""
    if not user_id:
        raise ValueError("user_id is required")
    
    transactions = get_collection('transactions')
    cursor = transactions.find({'user_id': user_id}).sort('created_at', -1)
    
    # Convert ObjectId to string before returning
    transactions_list = []
    for transaction in cursor:
        transaction['id'] = str(transaction['_id'])
        del transaction['_id']
        transactions_list.append(transaction)
    return transactions_list

def get_transaction(transaction_id, user_id):
    """Get a single transaction by ID for a specific user"""
    if not user_id:
        raise ValueError("user_id is required")
    
    transactions = get_collection('transactions')
    return transactions.find_one({'_id': ObjectId(transaction_id), 'user_id': user_id})

def add_transaction(text, amount, user_id):
    """Add a new transaction for a specific user"""
    if not user_id:
        raise ValueError("user_id is required")
    if not text or text.strip() == "":
        raise ValueError("text is required")
    try:
        amount = float(amount)
    except (TypeError, ValueError):
        raise ValueError("amount must be a valid number")
    
    transactions = get_collection('transactions')
    transaction = {
        'text': text.strip(),
        'amount': amount,
        'user_id': user_id,
        'created_at': datetime.utcnow()
    }
    try:
        result = transactions.insert_one(transaction)
        return str(result.inserted_id)
    except Exception as e:
        raise ValueError(f"Failed to add transaction: {str(e)}")

def update_transaction(transaction_id, text, amount, user_id):
    """Update an existing transaction for a specific user"""
    if not user_id:
        raise ValueError("user_id is required")
    
    transactions = get_collection('transactions')
    result = transactions.update_one(
        {'_id': ObjectId(transaction_id), 'user_id': user_id},
        {'$set': {'text': text, 'amount': float(amount)}}
    )
    return result.modified_count > 0

def delete_transaction(transaction_id, user_id):
    """Delete a transaction for a specific user"""
    if not user_id:
        raise ValueError("user_id is required")
    
    transactions = get_collection('transactions')
    result = transactions.delete_one({'_id': ObjectId(transaction_id), 'user_id': user_id})
    return result.deleted_count > 0

def get_total_income(user_id):
    """Get sum of all positive transactions (income) for a specific user"""
    transactions = get_collection('transactions')
    pipeline = [
        {'$match': {'user_id': user_id, 'amount': {'$gt': 0}}},
        {'$group': {'_id': None, 'total': {'$sum': '$amount'}}}
    ]
    result = list(transactions.aggregate(pipeline))
    return float(result[0]['total'] if result else 0)

def get_total_expenses(user_id):
    """Get sum of all negative transactions (expenses) for a specific user"""
    transactions = get_collection('transactions')
    pipeline = [
        {'$match': {'user_id': user_id, 'amount': {'$lt': 0}}},
        {'$group': {'_id': None, 'total': {'$sum': {'$abs': '$amount'}}}}
    ]
    result = list(transactions.aggregate(pipeline))
    return float(result[0]['total'] if result else 0)

def get_current_balance(user_id):
    """Get current balance (income - expenses) for a specific user"""
    transactions = get_collection('transactions')
    pipeline = [
        {'$match': {'user_id': user_id}},
        {'$group': {'_id': None, 'balance': {'$sum': '$amount'}}}
    ]
    result = list(transactions.aggregate(pipeline))
    return float(result[0]['balance'] if result else 0)

def get_recent_transactions(user_id, limit=5):
    """Get most recent transactions for a specific user"""
    transactions = get_collection('transactions')
    cursor = transactions.find({'user_id': user_id}).sort('created_at', -1).limit(limit)
    
    # Convert ObjectId to string before returning
    transactions_list = []
    for transaction in cursor:
        transaction['id'] = str(transaction['_id'])
        del transaction['_id']
        transactions_list.append(transaction)
    return transactions_list