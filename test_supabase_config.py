#!/usr/bin/env python3
"""
Test Supabase client configuration
"""

import requests
import json
import os
from supabase import create_client

# Load environment variables
SUPABASE_URL = "https://kycqtljpvksauzhvmlez.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5Y3F0bGpwdmtzYXV6aHZtbGV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTMyNDM1MCwiZXhwIjoyMDg0OTAwMzUwfQ.NbmuQbk3fmQAt41evFKe49efms5hlqCAqxuGG_KnbrA"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5Y3F0bGpwdmtzYXV6aHZtbGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzMjQzNTAsImV4cCI6MjA4NDkwMDM1MH0.Bqs_HxEqPqAX0Tc_Z5O3WRW0wAL8bpqBiBqpZ0_rqIk"

def test_supabase_auth():
    print("🔍 Testing Supabase Client Configuration")
    print("=" * 50)
    
    # Test with service key client (like backend)
    service_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    # Get a user token first
    BASE_URL = "https://atlastly-restore.preview.emergentagent.com"
    API_URL = f"{BASE_URL}/api"
    
    vendor_login = {
        "email": "jacob@test.com",
        "password": "ChangeMe123!"
    }
    
    response = requests.post(f"{API_URL}/auth/login", json=vendor_login)
    if response.status_code != 200:
        print(f"❌ Login failed: {response.text}")
        return
    
    data = response.json()
    token = data.get('token')
    user_id = data.get('user_id')
    
    print(f"✅ Got token for user: {user_id}")
    
    # Test token verification with service client
    try:
        user_response = service_client.auth.get_user(token)
        if user_response and user_response.user:
            print(f"✅ Service client can verify token")
            print(f"   User ID: {user_response.user.id}")
            print(f"   Email: {user_response.user.email}")
            
            # Test role lookup
            role_response = service_client.table('user_roles').select('role').eq('user_id', user_id).single().execute()
            if role_response.data:
                print(f"✅ Role found: {role_response.data['role']}")
            else:
                print(f"❌ No role found for user")
        else:
            print(f"❌ Service client cannot verify token")
    except Exception as e:
        print(f"❌ Service client error: {str(e)}")
    
    # Test with anon client
    try:
        anon_client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        user_response = anon_client.auth.get_user(token)
        if user_response and user_response.user:
            print(f"✅ Anon client can verify token")
        else:
            print(f"❌ Anon client cannot verify token")
    except Exception as e:
        print(f"❌ Anon client error: {str(e)}")

if __name__ == "__main__":
    test_supabase_auth()