
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
from fastapi import HTTPException
import os
from dotenv import load_dotenv

load_dotenv()

client = None
database = None


async def connect_to_mongo():
    """Initialize the shared MongoDB connection."""
    global client, database

    try:
        mongodb_uri = os.getenv("MONGODB_URI")
        database_name = os.getenv("DATABASE_NAME", "ecotrack")

        if not mongodb_uri:
            raise RuntimeError("MONGODB_URI environment variable is not set")

        client = AsyncIOMotorClient(
            mongodb_uri,
            serverSelectionTimeoutMS=5000,
        )

        await client.admin.command("ping")
        database = client[database_name]

        print("Connected to MongoDB successfully!")

    except Exception:
        if client:
            client.close()

        client = None
        database = None
        raise


async def close_mongo_connection():
    """Close the shared MongoDB connection."""
    global client, database

    if client:
        client.close()

    client = None
    database = None


def get_database():
    """Return the initialized MongoDB database."""
    if database is None:
        raise HTTPException(
            status_code=503,
            detail="Database connection not available",
        )

    return database
