#!/usr/bin/env python3
"""
Debug authentication issues with migrated users
"""

import requests
import json

BASE_URL = "https://atlastly-restore.preview.emergentagent.com"
API_URL = f"{BASE_URL}/api"

def test_auth_debug():
    print("🔍 Debugging Authentication Issues")
    print("=" * 50)
    
    # Test migrated vendor login
    vendor_login = {
        "email": "jacob@test.com",
        "password": "ChangeMe123!"
    }
    
    print("\n1. Testing vendor login...")
    response = requests.post(f"{API_URL}/auth/login", json=vendor_login)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Login successful")
        print(f"User ID: {data.get('user_id')}")
        print(f"Role: {data.get('role')}")
        token = data.get('token')
        
        # Test vendor profile access with detailed debugging
        print(f"\n2. Testing vendor profile access...")
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        profile_response = requests.get(f"{API_URL}/vendor/profile", headers=headers)
        print(f"Profile Status: {profile_response.status_code}")
        print(f"Profile Response: {profile_response.text}")
        
        # Test if vendor has a profile by checking admin endpoint
        print(f"\n3. Testing admin login to check vendor data...")
        admin_login = {
            "email": "sarah@test.com", 
            "password": "ChangeMe123!"
        }
        
        admin_response = requests.post(f"{API_URL}/auth/login", json=admin_login)
        if admin_response.status_code == 200:
            admin_data = admin_response.json()
            admin_token = admin_data.get('token')
            admin_headers = {'Authorization': f'Bearer {admin_token}'}
            
            vendors_response = requests.get(f"{API_URL}/admin/vendors", headers=admin_headers)
            if vendors_response.status_code == 200:
                vendors = vendors_response.json()
                print(f"Total vendors found: {len(vendors)}")
                
                # Look for vendor with user_id matching our logged in vendor
                vendor_user_id = data.get('user_id')
                matching_vendor = None
                for vendor in vendors:
                    if vendor.get('user_id') == vendor_user_id:
                        matching_vendor = vendor
                        break
                
                if matching_vendor:
                    print(f"✅ Found matching vendor profile:")
                    print(f"   Business Name: {matching_vendor.get('business_name')}")
                    print(f"   Category: {matching_vendor.get('category')}")
                    print(f"   User ID: {matching_vendor.get('user_id')}")
                else:
                    print(f"❌ No vendor profile found for user_id: {vendor_user_id}")
                    print("Available vendors:")
                    for i, vendor in enumerate(vendors[:3]):  # Show first 3
                        print(f"   {i+1}. {vendor.get('business_name')} (user_id: {vendor.get('user_id')})")
    else:
        print(f"❌ Login failed: {response.text}")

if __name__ == "__main__":
    test_auth_debug()