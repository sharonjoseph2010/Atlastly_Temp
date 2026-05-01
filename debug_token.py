#!/usr/bin/env python3
"""
Debug token validation issue
"""

import requests
import json
import jwt

BASE_URL = "https://atlastly-restore.preview.emergentagent.com"
API_URL = f"{BASE_URL}/api"

def debug_token():
    print("🔍 Debugging Token Validation")
    print("=" * 50)
    
    # Login as vendor
    vendor_login = {
        "email": "jacob@test.com",
        "password": "ChangeMe123!"
    }
    
    response = requests.post(f"{API_URL}/auth/login", json=vendor_login)
    if response.status_code == 200:
        data = response.json()
        token = data.get('token')
        print(f"✅ Login successful")
        print(f"Token length: {len(token)}")
        print(f"Token starts with: {token[:50]}...")
        
        # Try to decode token (without verification to see structure)
        try:
            decoded = jwt.decode(token, options={"verify_signature": False})
            print(f"Token payload: {json.dumps(decoded, indent=2)}")
        except Exception as e:
            print(f"Token decode error: {e}")
        
        # Test different header formats
        headers_variants = [
            {'Authorization': f'Bearer {token}'},
            {'Authorization': f'bearer {token}'},
            {'authorization': f'Bearer {token}'},
        ]
        
        for i, headers in enumerate(headers_variants, 1):
            print(f"\n{i}. Testing headers: {headers}")
            response = requests.get(f"{API_URL}/vendor/profile", headers=headers)
            print(f"   Status: {response.status_code}")
            print(f"   Response: {response.text[:100]}")
        
        # Test with admin token for comparison
        print(f"\n4. Testing admin token for comparison...")
        admin_login = {"email": "sarah@test.com", "password": "ChangeMe123!"}
        admin_response = requests.post(f"{API_URL}/auth/login", json=admin_login)
        
        if admin_response.status_code == 200:
            admin_data = admin_response.json()
            admin_token = admin_data.get('token')
            admin_headers = {'Authorization': f'Bearer {admin_token}'}
            
            admin_test = requests.get(f"{API_URL}/admin/vendors", headers=admin_headers)
            print(f"   Admin endpoint status: {admin_test.status_code}")
            
            if admin_test.status_code == 200:
                print(f"   ✅ Admin token works fine")
            else:
                print(f"   ❌ Admin token also fails: {admin_test.text[:100]}")

if __name__ == "__main__":
    debug_token()