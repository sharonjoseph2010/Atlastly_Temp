#!/usr/bin/env python3
"""
Detailed vendor authentication debugging
"""

import requests
import json
import time

BASE_URL = "https://eventmap-13.preview.emergentagent.com"
API_URL = f"{BASE_URL}/api"

def debug_vendor_auth():
    print("🔍 Detailed Vendor Authentication Debug")
    print("=" * 50)
    
    # Step 1: Login
    print("1. Logging in as vendor...")
    login_data = {"email": "jacob@test.com", "password": "ChangeMe123!"}
    response = requests.post(f"{API_URL}/auth/login", json=login_data)
    
    print(f"   Login Status: {response.status_code}")
    if response.status_code != 200:
        print(f"   Login failed: {response.text}")
        return
    
    data = response.json()
    token = data.get('token')
    user_id = data.get('user_id')
    role = data.get('role')
    
    print(f"   ✅ Login successful")
    print(f"   User ID: {user_id}")
    print(f"   Role: {role}")
    print(f"   Token length: {len(token)}")
    
    # Step 2: Immediate test
    print(f"\n2. Testing vendor profile access immediately...")
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    
    response = requests.get(f"{API_URL}/vendor/profile", headers=headers)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.text}")
    
    # Step 3: Test admin endpoint with same token (should fail)
    print(f"\n3. Testing admin endpoint with vendor token (should fail)...")
    response = requests.get(f"{API_URL}/admin/vendors", headers=headers)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.text}")
    
    # Step 4: Test with admin token
    print(f"\n4. Testing with admin token for comparison...")
    admin_login = {"email": "sarah@test.com", "password": "ChangeMe123!"}
    admin_response = requests.post(f"{API_URL}/auth/login", json=admin_login)
    
    if admin_response.status_code == 200:
        admin_data = admin_response.json()
        admin_token = admin_data.get('token')
        admin_headers = {'Authorization': f'Bearer {admin_token}', 'Content-Type': 'application/json'}
        
        response = requests.get(f"{API_URL}/admin/vendors", headers=admin_headers)
        print(f"   Admin Status: {response.status_code}")
        if response.status_code == 200:
            print(f"   ✅ Admin token works fine")
        else:
            print(f"   ❌ Admin token failed: {response.text}")
    
    # Step 5: Test vendor token again after delay
    print(f"\n5. Testing vendor token again after 2 second delay...")
    time.sleep(2)
    
    response = requests.get(f"{API_URL}/vendor/profile", headers=headers)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.text}")
    
    # Step 6: Test different vendor endpoint
    print(f"\n6. Testing vendor profile creation...")
    profile_data = {
        "business_name": "Debug Test Vendor",
        "category": "Photography",
        "city": "Test City",
        "address": "Test Address",
        "phone": "+91-1234567890",
        "description": "Test description",
        "latitude": 10.0,
        "longitude": 76.0
    }
    
    response = requests.post(f"{API_URL}/vendor/profile", json=profile_data, headers=headers)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.text}")

if __name__ == "__main__":
    debug_vendor_auth()