#!/usr/bin/env python3
"""
Data Migration: MongoDB to Supabase with Supabase Auth
Migrates users to Supabase Auth and vendors to Supabase tables
"""

import asyncio
from supabase import create_client
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.getenv('DB_NAME', 'test_database')

async def migrate_users(supabase, mongo_db):
    """Migrate users from MongoDB to Supabase Auth"""
    print("\n" + "="*70)
    print("👤 MIGRATING USERS TO SUPABASE AUTH")
    print("="*70)
    
    users = await mongo_db.users.find({}, {"_id": 0}).to_list(1000)
    print(f"\n📊 Found {len(users)} users in MongoDB")
    
    migrated = 0
    skipped = 0
    errors = 0
    
    for user in users:
        email = user['email']
        role = user['role']
        
        try:
            # Create user in Supabase Auth
            # Using a default password - users will need to reset via "Forgot Password"
            auth_response = supabase.auth.admin.create_user({
                "email": email,
                "email_confirm": True,
                "password": "ChangeMe123!",  # Temporary password
                "user_metadata": {
                    "role": role,
                    "migrated": True
                }
            })
            
            if auth_response and auth_response.user:
                user_id = auth_response.user.id
                
                # Store role in user_roles table
                supabase.table('user_roles').insert({
                    "user_id": user_id,
                    "role": role
                }).execute()
                
                print(f"  ✅ {email} ({role})")
                migrated += 1
            else:
                print(f"  ⚠️  Failed: {email}")
                errors += 1
                
        except Exception as e:
            error_msg = str(e)
            if "already been registered" in error_msg or "already exists" in error_msg:
                print(f"  ℹ️  Already exists: {email}")
                skipped += 1
            else:
                print(f"  ❌ Error {email}: {error_msg[:80]}")
                errors += 1
    
    print(f"\n📊 User Migration Summary:")
    print(f"  ✅ Migrated: {migrated}")
    print(f"  ℹ️  Skipped (already exist): {skipped}")
    print(f"  ❌ Errors: {errors}")
    
    return migrated

async def migrate_vendors(supabase, mongo_db):
    """Migrate vendors from MongoDB to Supabase"""
    print("\n" + "="*70)
    print("🏢 MIGRATING VENDORS TO SUPABASE")
    print("="*70)
    
    vendors = await mongo_db.vendors.find({}, {"_id": 0}).to_list(1000)
    print(f"\n📊 Found {len(vendors)} vendors in MongoDB")
    
    migrated = 0
    errors = 0
    
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
                "user_id": None  # Will be NULL initially
            }
            
            supabase.table('vendors').insert(vendor_data).execute()
            print(f"  ✅ {vendor_data['business_name']} ({vendor_data['city']})")
            migrated += 1
            
        except Exception as e:
            print(f"  ❌ Error {vendor.get('business_name')}: {str(e)[:80]}")
            errors += 1
    
    print(f"\n📊 Vendor Migration Summary:")
    print(f"  ✅ Migrated: {migrated}")
    print(f"  ❌ Errors: {errors}")
    
    return migrated

async def main():
    print("\n" + "="*70)
    print("🚀 ATLASTLY DATA MIGRATION: MongoDB → Supabase")
    print("="*70)
    
    # Initialize clients
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    print("\n✅ Connected to Supabase")
    
    mongo_client = AsyncIOMotorClient(MONGO_URL)
    mongo_db = mongo_client[DB_NAME]
    print("✅ Connected to MongoDB")
    
    # Migrate users
    users_migrated = await migrate_users(supabase, mongo_db)
    
    # Migrate vendors
    vendors_migrated = await migrate_vendors(supabase, mongo_db)
    
    # Close MongoDB
    mongo_client.close()
    
    print("\n" + "="*70)
    print("🎉 MIGRATION COMPLETED!")
    print("="*70)
    print(f"\n📊 Final Summary:")
    print(f"  👤 Users: {users_migrated}")
    print(f"  🏢 Vendors: {vendors_migrated}")
    
    print("\n⚠️  IMPORTANT NOTES:")
    print("  1. All users have temporary password: 'ChangeMe123!'")
    print("  2. Users should use 'Forgot Password' to set new password")
    print("  3. Vendors created without user_id (will be NULL)")
    print("  4. Next step: Refactor backend to use Supabase")

if __name__ == "__main__":
    asyncio.run(main())
