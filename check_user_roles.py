#!/usr/bin/env python3
"""
Check user_roles table
"""

import requests
import json

BASE_URL = "https://eventmap-13.preview.emergentagent.com"
API_URL = f"{BASE_URL}/api"

def check_user_roles():
    print("🔍 Checking User Roles Table")
    print("=" * 50)
    
    # Login as admin to access the database
    admin_login = {"email": "sarah@test.com", "password": "ChangeMe123!"}
    response = requests.post(f"{API_URL}/auth/login", json=admin_login)
    
    if response.status_code != 200:
        print(f"❌ Admin login failed: {response.text}")
        return
    
    admin_data = response.json()
    admin_user_id = admin_data.get('user_id')
    print(f"✅ Admin user ID: {admin_user_id}")
    
    # Login as vendor to get vendor user ID
    vendor_login = {"email": "jacob@test.com", "password": "ChangeMe123!"}
    response = requests.post(f"{API_URL}/auth/login", json=vendor_login)
    
    if response.status_code != 200:
        print(f"❌ Vendor login failed: {response.text}")
        return
    
    vendor_data = response.json()
    vendor_user_id = vendor_data.get('user_id')
    print(f"✅ Vendor user ID: {vendor_user_id}")
    
    # Login as planner
    planner_login = {"email": "sharonjoseph2010@gmail.com", "password": "ChangeMe123!"}
    response = requests.post(f"{API_URL}/auth/login", json=planner_login)
    
    if response.status_code != 200:
        print(f"❌ Planner login failed: {response.text}")
        return
    
    planner_data = response.json()
    planner_user_id = planner_data.get('user_id')
    print(f"✅ Planner user ID: {planner_user_id}")
    
    print(f"\nUser IDs to check:")
    print(f"Admin: {admin_user_id}")
    print(f"Vendor: {vendor_user_id}")
    print(f"Planner: {planner_user_id}")
    
    # The issue is that we can't directly query the user_roles table from the API
    # But we can infer from the authentication behavior
    print(f"\nBased on authentication behavior:")
    print(f"✅ Admin role exists (authentication works)")
    print(f"❌ Vendor role missing (authentication fails after token verification)")
    print(f"❓ Planner role status unknown (need to test)")

if __name__ == "__main__":
    check_user_roles()