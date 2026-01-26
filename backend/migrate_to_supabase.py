#!/usr/bin/env python3
"""
Complete Migration Script: MongoDB to Supabase with Supabase Auth
This script:
1. Creates tables in Supabase
2. Migrates existing users to Supabase Auth
3. Migrates vendor data to Supabase
"""

import os
import json
import asyncio
from supabase import create_client, Client
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

# Supabase credentials
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

# MongoDB credentials
MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.getenv('DB_NAME', 'test_database')

async def create_schema(supabase: Client):
    """Create tables in Supabase using the SQL schema"""
    print("\n📋 Creating Supabase schema...")
    
    # Read SQL schema
    with open('/app/backend/supabase_schema.sql', 'r') as f:
        schema_sql = f.read()
    
    try:
        # Execute schema using Supabase RPC or direct SQL execution
        # Note: This requires the schema to be run manually in Supabase SQL Editor
        print("⚠️  Please run the SQL schema in Supabase SQL Editor:")
        print("   1. Go to: https://supabase.com/dashboard/project/kycqtljpvksauzhvmlez/sql")
        print("   2. Copy and execute the contents of /app/backend/supabase_schema.sql")
        print("\nPress Enter after you've executed the schema...")
        input()
        print("✓ Schema setup acknowledged")
    except Exception as e:
        print(f"⚠️  Note: Schema creation via API not available. Error: {e}")
        print("   Please create tables manually using Supabase dashboard.")

async def migrate_users(supabase: Client, mongo_db):
    """Migrate users from MongoDB to Supabase Auth"""
    print("\n👤 Migrating users to Supabase Auth...")
    
    users = await mongo_db.users.find({}, {"_id": 0}).to_list(1000)
    print(f"Found {len(users)} users in MongoDB")
    
    migrated_count = 0
    error_count = 0
    
    for user in users:
        try:
            email = user['email']
            role = user['role']
            
            # Create user in Supabase Auth using Admin API
            # We'll use a temporary password that users will need to reset
            auth_response = supabase.auth.admin.create_user({
                "email": email,
                "email_confirm": True,
                "password": "TempPassword123!",  # Users will need to reset this
                "user_metadata": {
                    "role": role,
                    "migrated_from_mongodb": True
                }
            })
            
            if auth_response and auth_response.user:
                user_id = auth_response.user.id
                
                # Store role in user_roles table
                role_data = {
                    "user_id": user_id,
                    "role": role
                }
                supabase.table('user_roles').insert(role_data).execute()
                
                print(f"  ✓ Migrated user: {email} (role: {role})")
                migrated_count += 1
            else:
                print(f"  ⚠️  Failed to create user: {email}")
                error_count += 1
                
        except Exception as e:
            error_msg = str(e)
            # Check if user already exists
            if "already been registered" in error_msg or "already exists" in error_msg:
                print(f"  ℹ️  User already exists: {email}")
            else:
                print(f"  ⚠️  Error migrating user {email}: {error_msg}")
            error_count += 1
    
    print(f"\n📊 User Migration Summary:")
    print(f"   Migrated: {migrated_count}")
    print(f"   Errors/Existing: {error_count}")
    
    return migrated_count

async def migrate_vendors(supabase: Client, mongo_db):
    """Migrate vendors from MongoDB to Supabase"""
    print("\n🏢 Migrating vendors to Supabase...")
    
    vendors = await mongo_db.vendors.find({}, {"_id": 0}).to_list(1000)
    print(f"Found {len(vendors)} vendors in MongoDB")
    
    migrated_count = 0
    error_count = 0
    
    # We need to map old user_ids to new Supabase user UUIDs
    # This is complex because we don't have a direct mapping
    # For now, we'll create vendors without user_id association
    # and let vendors reclaim their listings
    
    for vendor in vendors:
        try:
            vendor_data = {
                "business_name": vendor.get('business_name'),
                "category": vendor.get('category'),
                "city": vendor.get('city'),
                "address": vendor.get('address'),
                "phone": vendor.get('phone'),
                "description": vendor.get('description'),
                "external_link": vendor.get('external_link'),
                "latitude": vendor.get('latitude'),
                "longitude": vendor.get('longitude'),
                "is_active": vendor.get('is_active', True),
                "user_id": None  # Will be set to null initially
            }
            
            result = supabase.table('vendors').insert(vendor_data).execute()
            print(f"  ✓ Migrated vendor: {vendor_data['business_name']}")
            migrated_count += 1
            
        except Exception as e:
            print(f"  ⚠️  Error migrating vendor {vendor.get('business_name')}: {str(e)}")
            error_count += 1
    
    print(f"\n📊 Vendor Migration Summary:")
    print(f"   Migrated: {migrated_count}")
    print(f"   Errors: {error_count}")
    
    return migrated_count

async def main():
    print("🚀 Starting complete migration to Supabase with Supabase Auth...")
    print("=" * 60)
    
    # Initialize clients
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    print("✓ Connected to Supabase")
    
    mongo_client = AsyncIOMotorClient(MONGO_URL)
    mongo_db = mongo_client[DB_NAME]
    print("✓ Connected to MongoDB")
    
    # Step 1: Create schema
    await create_schema(supabase)
    
    # Step 2: Migrate users
    users_migrated = await migrate_users(supabase, mongo_db)
    
    # Step 3: Migrate vendors
    vendors_migrated = await migrate_vendors(supabase, mongo_db)
    
    # Close MongoDB connection
    mongo_client.close()
    
    print("\n" + "=" * 60)
    print("✅ Migration completed!")
    print(f"📊 Final Summary:")
    print(f"   Users migrated: {users_migrated}")
    print(f"   Vendors migrated: {vendors_migrated}")
    print("\n⚠️  IMPORTANT NOTES:")
    print("   1. All migrated users have temporary password: TempPassword123!")
    print("   2. Users should use 'Forgot Password' to set a new password")
    print("   3. Vendors are created without user_id association")
    print("   4. Update backend code to use Supabase Auth")

if __name__ == "__main__":
    asyncio.run(main())
