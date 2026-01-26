#!/usr/bin/env python3
"""
Check all vendors and their details
"""

import requests
import json

BASE_URL = "https://eventmap-13.preview.emergentagent.com"
API_URL = f"{BASE_URL}/api"

def check_vendors():
    print("🔍 Checking All Vendors")
    print("=" * 50)
    
    # Login as admin
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
            print(f"Total vendors: {len(vendors)}")
            print("\nVendor Details:")
            for i, vendor in enumerate(vendors, 1):
                print(f"{i}. {vendor.get('business_name')}")
                print(f"   ID: {vendor.get('id')}")
                print(f"   User ID: {vendor.get('user_id')}")
                print(f"   Category: {vendor.get('category')}")
                print(f"   City: {vendor.get('city')}")
                print(f"   Active: {vendor.get('is_active')}")
                print()

if __name__ == "__main__":
    check_vendors()