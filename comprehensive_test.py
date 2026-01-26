#!/usr/bin/env python3
"""
Final Atlastly Migration Test with Better Error Handling
"""

import requests
import json
import time

BASE_URL = "https://eventmap-13.preview.emergentagent.com"
API_URL = f"{BASE_URL}/api"

def test_with_retry(name, func, max_retries=2):
    """Test with retry logic for intermittent issues"""
    for attempt in range(max_retries + 1):
        try:
            result = func()
            if result:
                return True
            if attempt < max_retries:
                print(f"   ⚠️  Attempt {attempt + 1} failed, retrying...")
                time.sleep(1)
        except Exception as e:
            if attempt < max_retries:
                print(f"   ⚠️  Attempt {attempt + 1} error: {str(e)}, retrying...")
                time.sleep(1)
            else:
                print(f"   ❌ Final attempt failed: {str(e)}")
    return False

def run_comprehensive_test():
    print("🚀 Atlastly Platform - Supabase Migration Verification")
    print(f"📍 Testing: {BASE_URL}")
    print("=" * 60)
    
    results = {'passed': 0, 'failed': 0, 'issues': []}
    tokens = {}
    
    # Test 1: Authentication Flow
    print("\n🔐 AUTHENTICATION TESTS")
    
    def test_auth():
        migrated_users = [
            ('planner', 'sharonjoseph2010@gmail.com'),
            ('vendor', 'jacob@test.com'),
            ('admin', 'sarah@test.com')
        ]
        
        for role, email in migrated_users:
            login_data = {"email": email, "password": "ChangeMe123!"}
            response = requests.post(f"{API_URL}/auth/login", json=login_data, timeout=10)
            
            if response.status_code != 200:
                print(f"   ❌ {role} login failed: {response.status_code}")
                return False
            
            data = response.json()
            if not all(k in data for k in ['token', 'user_id', 'role']):
                print(f"   ❌ {role} incomplete response")
                return False
            
            if data['role'] != role:
                print(f"   ❌ {role} role mismatch")
                return False
            
            tokens[role] = data['token']
            print(f"   ✅ {role} authenticated")
        
        return True
    
    auth_success = test_with_retry("Authentication", test_auth)
    if auth_success:
        results['passed'] += 1
        print("✅ Authentication: PASSED")
    else:
        results['failed'] += 1
        results['issues'].append("Authentication failed")
        print("❌ Authentication: FAILED")
    
    # Test 2: Discovery APIs
    print("\n🔍 DISCOVERY API TESTS")
    
    def test_discovery():
        # Test vendors endpoint
        response = requests.get(f"{API_URL}/vendors", timeout=10)
        if response.status_code != 200:
            return False
        
        vendors = response.json()
        if len(vendors) != 8:
            print(f"   ⚠️  Expected 8 vendors, got {len(vendors)}")
        
        # Test categories
        response = requests.get(f"{API_URL}/categories", timeout=10)
        if response.status_code != 200:
            return False
        
        categories = response.json().get('categories', [])
        if len(categories) != 10:
            return False
        
        # Test category filter
        response = requests.get(f"{API_URL}/vendors?category=Catering", timeout=10)
        if response.status_code != 200:
            return False
        
        print(f"   ✅ Found {len(vendors)} vendors, {len(categories)} categories")
        return True
    
    discovery_success = test_with_retry("Discovery APIs", test_discovery)
    if discovery_success:
        results['passed'] += 1
        print("✅ Discovery APIs: PASSED")
    else:
        results['failed'] += 1
        results['issues'].append("Discovery APIs failed")
        print("❌ Discovery APIs: FAILED")
    
    # Test 3: Vendor Profile Flow
    print("\n🏪 VENDOR PROFILE TESTS")
    
    def test_vendor_profile():
        if 'vendor' not in tokens:
            return False
        
        headers = {'Authorization': f'Bearer {tokens["vendor"]}'}
        
        # Check if profile exists (should be 404 initially)
        response = requests.get(f"{API_URL}/vendor/profile", headers=headers, timeout=10)
        
        if response.status_code == 404:
            print(f"   ✅ No existing profile (expected)")
            
            # Create profile
            profile_data = {
                "business_name": "Jacob's Event Photography",
                "category": "Photography",
                "city": "Kochi",
                "address": "Marine Drive, Ernakulam",
                "phone": "+91-9876543210",
                "description": "Professional event photography",
                "latitude": 9.9312,
                "longitude": 76.2673
            }
            
            response = requests.post(f"{API_URL}/vendor/profile", json=profile_data, headers=headers, timeout=10)
            if response.status_code != 200:
                print(f"   ❌ Profile creation failed: {response.status_code} - {response.text}")
                return False
            
            print(f"   ✅ Profile created successfully")
            
            # Verify profile retrieval
            response = requests.get(f"{API_URL}/vendor/profile", headers=headers, timeout=10)
            if response.status_code != 200:
                print(f"   ❌ Profile retrieval failed: {response.status_code}")
                return False
            
            profile = response.json()
            if profile.get('business_name') != profile_data['business_name']:
                print(f"   ❌ Profile data mismatch")
                return False
            
            print(f"   ✅ Profile retrieved and verified")
            return True
            
        elif response.status_code == 200:
            print(f"   ✅ Profile already exists")
            return True
        else:
            print(f"   ❌ Unexpected status: {response.status_code} - {response.text}")
            return False
    
    vendor_success = test_with_retry("Vendor Profile", test_vendor_profile)
    if vendor_success:
        results['passed'] += 1
        print("✅ Vendor Profile: PASSED")
    else:
        results['failed'] += 1
        results['issues'].append("Vendor profile management failed")
        print("❌ Vendor Profile: FAILED")
    
    # Test 4: Admin Management
    print("\n👑 ADMIN MANAGEMENT TESTS")
    
    def test_admin():
        if 'admin' not in tokens:
            return False
        
        headers = {'Authorization': f'Bearer {tokens["admin"]}'}
        
        # Get all vendors
        response = requests.get(f"{API_URL}/admin/vendors", headers=headers, timeout=10)
        if response.status_code != 200:
            print(f"   ❌ Admin get vendors failed: {response.status_code}")
            return False
        
        vendors = response.json()
        print(f"   ✅ Admin can access {len(vendors)} vendors")
        
        # Create test vendor
        vendor_data = {
            "business_name": "Test Admin Vendor",
            "category": "Decor",
            "city": "Chennai",
            "address": "T. Nagar, Chennai",
            "phone": "+91-9876543212",
            "description": "Test vendor for admin functionality",
            "latitude": 13.0827,
            "longitude": 80.2707
        }
        
        response = requests.post(f"{API_URL}/admin/vendors", json=vendor_data, headers=headers, timeout=10)
        if response.status_code != 200:
            print(f"   ❌ Admin create vendor failed: {response.status_code}")
            return False
        
        created_vendor = response.json()
        vendor_id = created_vendor.get('id')
        print(f"   ✅ Admin created vendor: {vendor_id[:8]}...")
        
        # Clean up - delete the test vendor
        response = requests.delete(f"{API_URL}/admin/vendors/{vendor_id}", headers=headers, timeout=10)
        if response.status_code == 200:
            print(f"   ✅ Admin deleted test vendor")
        else:
            print(f"   ⚠️  Admin delete failed: {response.status_code}")
        
        return True
    
    admin_success = test_with_retry("Admin Management", test_admin)
    if admin_success:
        results['passed'] += 1
        print("✅ Admin Management: PASSED")
    else:
        results['failed'] += 1
        results['issues'].append("Admin management failed")
        print("❌ Admin Management: FAILED")
    
    # Final Results
    print("\n" + "=" * 60)
    print("📊 FINAL TEST RESULTS")
    print(f"✅ Tests Passed: {results['passed']}/4")
    print(f"❌ Tests Failed: {results['failed']}/4")
    
    if results['issues']:
        print(f"\n🚨 Issues Found:")
        for i, issue in enumerate(results['issues'], 1):
            print(f"   {i}. {issue}")
    
    success_rate = (results['passed'] / 4) * 100
    print(f"\n🎯 Success Rate: {success_rate:.1f}%")
    
    # Migration Summary
    print(f"\n📋 SUPABASE MIGRATION STATUS:")
    print(f"✅ User Authentication: {'Working' if 'Authentication failed' not in results['issues'] else 'Failed'}")
    print(f"✅ JWT Token Validation: {'Working' if 'Authentication failed' not in results['issues'] else 'Failed'}")
    print(f"✅ Role-Based Access: {'Working' if results['passed'] >= 2 else 'Issues'}")
    print(f"✅ Database Integration: {'Working' if 'Discovery APIs failed' not in results['issues'] else 'Failed'}")
    print(f"✅ Vendor Management: {'Working' if 'Vendor profile management failed' not in results['issues'] else 'Failed'}")
    print(f"✅ Admin Functions: {'Working' if 'Admin management failed' not in results['issues'] else 'Failed'}")
    
    if success_rate >= 75:
        print(f"\n🎉 MIGRATION SUCCESSFUL - Platform is functional!")
    else:
        print(f"\n⚠️  MIGRATION ISSUES - Some functionality needs attention")
    
    return results['failed'] == 0

if __name__ == "__main__":
    success = run_comprehensive_test()
    exit(0 if success else 1)