from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
import os
from dotenv import load_dotenv

load_dotenv()

class Database:
    client: AsyncIOMotorClient = None
    database = None

# Global database instance
db = Database()

async def connect_to_mongo():
    """Create database connection"""
    try:
        mongodb_uri = os.getenv("MONGODB_URI")
        if not mongodb_uri:
            raise ValueError("MONGODB_URI environment variable is not set")
        
        db.client = AsyncIOMotorClient(mongodb_uri)
        db.database = db.client.ecotrack
        
        # Test the connection
        await db.client.admin.command('ping')
        print("✅ Connected to MongoDB successfully!")
        
    except ConnectionFailure as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        raise
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        raise

async def close_mongo_connection():
    """Close database connection"""
    if db.client:
        db.client.close()
        print("🔌 Disconnected from MongoDB")

def get_database():
    """Get database instance"""
    return db.database