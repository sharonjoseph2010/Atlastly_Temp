#!/usr/bin/env python3
"""
Comprehensive backend API testing for Event Services Discovery Platform
Tests all authentication flows, vendor CRUD operations, admin management, and discovery APIs
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class EventServicesAPITester:
    def __init__(self, base_url="https://eventmap-13.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tokens = {}  # Store tokens for different user types
        self.user_ids = {}  # Store user IDs
        self.vendor_id = None  # Store created vendor ID
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        
        # Test data
        self.test_timestamp = datetime.now().strftime('%H%M%S')
        self.test_users = {
            'planner': {
                'email': f'planner_{self.test_timestamp}@test.com',
                'password': 'TestPass123!'
            },
            'vendor': {
                'email': f'vendor_{self.test_timestamp}@test.com', 
                'password': 'TestPass123!'
            },
            'admin': {
                'email': f'admin_{self.test_timestamp}@test.com',
                'password': 'TestPass123!'
            }
        }
        
        self.vendor_profile_data = {
            "business_name": "Test Event Catering",
            "category": "Catering",
            "city": "Delhi",
            "address": "123 Test Street, Connaught Place",
            "phone": "+91-9876543210",
            "description": "Premium catering services for all types of events",
            "external_link": "https://testeventcatering.com",
            "latitude": 28.6139,
            "longitude": 77.2090
        }

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, 
                 data: Optional[Dict] = None, headers: Optional[Dict] = None) -> tuple:
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   {method} {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                self.failed_tests.append({
                    'name': name,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'response': response.text[:200]
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                'name': name,
                'error': str(e)
            })
            return False, {}

    def test_root_endpoint(self):
        """Test API root endpoint"""
        return self.run_test("API Root", "GET", "", 200)

    def test_categories_endpoint(self):
        """Test categories endpoint"""
        success, response = self.run_test("Get Categories", "GET", "categories", 200)
        if success and 'categories' in response:
            categories = response['categories']
            expected_categories = [
                "Venue", "Religious Venue", "Catering", "Decor", "Photography",
                "Makeup", "Attire Rentals", "Car Rentals", "Accessories", "Jewellery"
            ]
            if all(cat in categories for cat in expected_categories):
                print(f"   ✅ All expected categories found: {len(categories)} total")
                return True
            else:
                print(f"   ❌ Missing categories. Found: {categories}")
                return False
        return success

    def test_user_signup(self, role: str):
        """Test user signup for specific role"""
        user_data = self.test_users[role]
        signup_data = {
            "email": user_data['email'],
            "password": user_data['password'],
            "role": role
        }
        
        success, response = self.run_test(
            f"{role.title()} Signup", 
            "POST", 
            "auth/signup", 
            200, 
            signup_data
        )
        
        if success and 'token' in response:
            self.tokens[role] = response['token']
            self.user_ids[role] = response['user_id']
            print(f"   ✅ Token stored for {role}")
            return True
        return False

    def test_user_login(self, role: str):
        """Test user login for specific role"""
        user_data = self.test_users[role]
        login_data = {
            "email": user_data['email'],
            "password": user_data['password']
        }
        
        success, response = self.run_test(
            f"{role.title()} Login", 
            "POST", 
            "auth/login", 
            200, 
            login_data
        )
        
        if success and 'token' in response:
            # Verify we get the same token/user_id as signup
            if role in self.tokens:
                print(f"   ✅ Login successful for existing {role}")
            return True
        return False

    def test_invalid_login(self):
        """Test login with invalid credentials"""
        invalid_data = {
            "email": "nonexistent@test.com",
            "password": "wrongpassword"
        }
        
        return self.run_test(
            "Invalid Login", 
            "POST", 
            "auth/login", 
            401, 
            invalid_data
        )[0]

    def test_duplicate_signup(self):
        """Test signup with existing email"""
        duplicate_data = {
            "email": self.test_users['planner']['email'],
            "password": "AnotherPass123!",
            "role": "planner"
        }
        
        return self.run_test(
            "Duplicate Email Signup", 
            "POST", 
            "auth/signup", 
            400, 
            duplicate_data
        )[0]

    def test_create_vendor_profile(self):
        """Test vendor profile creation"""
        if 'vendor' not in self.tokens:
            print("❌ No vendor token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.tokens["vendor"]}'}
        success, response = self.run_test(
            "Create Vendor Profile",
            "POST",
            "vendor/profile",
            200,
            self.vendor_profile_data,
            headers
        )
        
        if success and 'vendor_id' in response:
            self.vendor_id = response['vendor_id']
            print(f"   ✅ Vendor profile created with ID: {self.vendor_id}")
            return True
        return False

    def test_get_vendor_profile(self):
        """Test getting vendor profile"""
        if 'vendor' not in self.tokens:
            print("❌ No vendor token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.tokens["vendor"]}'}
        success, response = self.run_test(
            "Get Vendor Profile",
            "GET",
            "vendor/profile",
            200,
            None,
            headers
        )
        
        if success and response.get('business_name') == self.vendor_profile_data['business_name']:
            print(f"   ✅ Profile data matches")
            return True
        return False

    def test_update_vendor_profile(self):
        """Test updating vendor profile"""
        if 'vendor' not in self.tokens:
            print("❌ No vendor token available")
            return False
            
        update_data = {
            "business_name": "Updated Test Event Catering",
            "description": "Updated premium catering services",
            "is_active": False
        }
        
        headers = {'Authorization': f'Bearer {self.tokens["vendor"]}'}
        success, response = self.run_test(
            "Update Vendor Profile",
            "PUT",
            "vendor/profile",
            200,
            update_data,
            headers
        )
        
        if success and response.get('business_name') == update_data['business_name']:
            print(f"   ✅ Profile updated successfully")
            return True
        return False

    def test_unauthorized_vendor_access(self):
        """Test vendor endpoints without proper authorization"""
        # Test with planner token
        if 'planner' not in self.tokens:
            return False
            
        headers = {'Authorization': f'Bearer {self.tokens["planner"]}'}
        return self.run_test(
            "Unauthorized Vendor Access",
            "GET",
            "vendor/profile",
            403,
            None,
            headers
        )[0]

    def test_discovery_endpoints(self):
        """Test public discovery endpoints"""
        # Test get all vendors
        success1, response1 = self.run_test(
            "Get All Vendors",
            "GET",
            "vendors",
            200
        )
        
        # Test category filtering
        success2, response2 = self.run_test(
            "Get Vendors by Category",
            "GET",
            "vendors?category=Catering",
            200
        )
        
        # Test invalid category
        success3, response3 = self.run_test(
            "Invalid Category Filter",
            "GET",
            "vendors?category=InvalidCategory",
            400
        )
        
        return success1 and success2 and success3

    def test_admin_endpoints(self):
        """Test admin management endpoints"""
        if 'admin' not in self.tokens:
            print("❌ No admin token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.tokens["admin"]}'}
        
        # Get all vendors (admin view)
        success1, response1 = self.run_test(
            "Admin Get All Vendors",
            "GET",
            "admin/vendors",
            200,
            None,
            headers
        )
        
        if not self.vendor_id:
            print("❌ No vendor ID available for admin tests")
            return success1
            
        # Update vendor status
        update_data = {"is_active": True}
        success2, response2 = self.run_test(
            "Admin Update Vendor",
            "PUT",
            f"admin/vendors/{self.vendor_id}",
            200,
            update_data,
            headers
        )
        
        # Test unauthorized admin access
        planner_headers = {'Authorization': f'Bearer {self.tokens["planner"]}'}
        success3, response3 = self.run_test(
            "Unauthorized Admin Access",
            "GET",
            "admin/vendors",
            403,
            None,
            planner_headers
        )
        
        return success1 and success2 and success3

    def test_admin_delete_vendor(self):
        """Test admin delete vendor (run last)"""
        if 'admin' not in self.tokens or not self.vendor_id:
            print("❌ No admin token or vendor ID available")
            return False
            
        headers = {'Authorization': f'Bearer {self.tokens["admin"]}'}
        return self.run_test(
            "Admin Delete Vendor",
            "DELETE",
            f"admin/vendors/{self.vendor_id}",
            200,
            None,
            headers
        )[0]

    def test_protected_routes(self):
        """Test protected routes without authentication"""
        endpoints = [
            ("vendor/profile", "GET"),
            ("vendor/profile", "POST"),
            ("admin/vendors", "GET")
        ]
        
        all_success = True
        for endpoint, method in endpoints:
            success = self.run_test(
                f"Unauth {method} {endpoint}",
                method,
                endpoint,
                401,
                self.vendor_profile_data if method == "POST" else None
            )[0]
            all_success = all_success and success
            
        return all_success

    def run_all_tests(self):
        """Run comprehensive test suite"""
        print("🚀 Starting Event Services Discovery Platform API Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Basic API tests
        print("\n📋 BASIC API TESTS")
        self.test_root_endpoint()
        self.test_categories_endpoint()
        
        # Authentication tests
        print("\n🔐 AUTHENTICATION TESTS")
        self.test_user_signup('planner')
        self.test_user_signup('vendor') 
        self.test_user_signup('admin')
        self.test_user_login('planner')
        self.test_user_login('vendor')
        self.test_user_login('admin')
        self.test_invalid_login()
        self.test_duplicate_signup()
        
        # Vendor CRUD tests
        print("\n🏪 VENDOR CRUD TESTS")
        self.test_create_vendor_profile()
        self.test_get_vendor_profile()
        self.test_update_vendor_profile()
        self.test_unauthorized_vendor_access()
        
        # Discovery tests
        print("\n🔍 DISCOVERY API TESTS")
        self.test_discovery_endpoints()
        
        # Admin tests
        print("\n👑 ADMIN MANAGEMENT TESTS")
        self.test_admin_endpoints()
        
        # Security tests
        print("\n🔒 SECURITY TESTS")
        self.test_protected_routes()
        
        # Cleanup (delete vendor)
        print("\n🧹 CLEANUP TESTS")
        self.test_admin_delete_vendor()
        
        # Print results
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS")
        print(f"✅ Tests passed: {self.tests_passed}/{self.tests_run}")
        print(f"❌ Tests failed: {len(self.failed_tests)}")
        
        if self.failed_tests:
            print("\n🚨 FAILED TESTS:")
            for i, test in enumerate(self.failed_tests, 1):
                print(f"{i}. {test['name']}")
                if 'error' in test:
                    print(f"   Error: {test['error']}")
                else:
                    print(f"   Expected: {test['expected']}, Got: {test['actual']}")
                    if 'response' in test:
                        print(f"   Response: {test['response']}")
        
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"\n🎯 Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = EventServicesAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())