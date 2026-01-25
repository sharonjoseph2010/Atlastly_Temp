#!/usr/bin/env python3
"""
Migration script: MongoDB to Supabase
Migrates users and vendors data from MongoDB to Supabase PostgreSQL
"""

import os
import json
from supabase import create_client, Client
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
from datetime import datetime

# Supabase credentials
SUPABASE_URL = "https://kycqtljpvksauzhvmlez.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5Y3F0bGpwdmtzYXV6aHZtbGV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTMyNDM1MCwiZXhwIjoyMDg0OTAwMzUwfQ.NbmuQbk3fmQAt41evFKe49efms5hlqCAqxuGG_KnbrA"

# MongoDB credentials
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "test_database"

async def migrate():
    print("🚀 Starting migration from MongoDB to Supabase...")
    
    # Initialize Supabase client
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✓ Connected to Supabase")
    
    # Initialize MongoDB client
    mongo_client = AsyncIOMotorClient(MONGO_URL)
    db = mongo_client[DB_NAME]
    print("✓ Connected to MongoDB")
    
    # Step 1: Create tables in Supabase
    print("\n📋 Creating tables in Supabase...")
    
    # Note: Tables should be created via Supabase SQL Editor with proper schema
    # We'll check if data exists and create if needed
    
    # Step 2: Migrate users
    print("\n👤 Migrating users...")
    users = await db.users.find({}, {"_id": 0}).to_list(1000)
    print(f"Found {len(users)} users in MongoDB")
    
    if users:
        # Insert users into Supabase
        for user in users:
            try:
                result = supabase.table('users').insert(user).execute()
                print(f"  ✓ Migrated user: {user['email']}")
            except Exception as e:
                print(f"  ⚠ Error migrating user {user['email']}: {str(e)}")
    
    # Step 3: Migrate vendors
    print("\n🏢 Migrating vendors...")
    vendors = await db.vendors.find({}, {"_id": 0}).to_list(1000)
    print(f"Found {len(vendors)} vendors in MongoDB")
    
    if vendors:
        # Insert vendors into Supabase
        for vendor in vendors:
            try:
                result = supabase.table('vendors').insert(vendor).execute()
                print(f"  ✓ Migrated vendor: {vendor['business_name']}")
            except Exception as e:
                print(f"  ⚠ Error migrating vendor {vendor['business_name']}: {str(e)}")
    
    mongo_client.close()
    
    print("\n✅ Migration completed!")
    print(f"📊 Summary:")
    print(f"   Users: {len(users)}")
    print(f"   Vendors: {len(vendors)}")

if __name__ == "__main__":
    asyncio.run(migrate())
