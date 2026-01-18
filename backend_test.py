#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Craven Cooling FSM System
Tests all CRUD operations, authentication, and core workflows
"""

import requests
import sys
import json
from datetime import datetime, timedelta
import uuid

class CravenCoolingAPITester:
    def __init__(self, base_url="http://localhost:8001/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_data = {}
        
        # Test data storage
        self.created_ids = {
            'users': [],
            'customers': [],
            'sites': [],
            'assets': [],
            'jobs': [],
            'quotes': [],
            'invoices': [],
            'parts': []
        }

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        return success

    def make_request(self, method, endpoint, data=None, expected_status=200):
        """Make HTTP request with proper headers"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            
            success = response.status_code == expected_status
            return success, response.json() if success else {}, response.status_code
        except Exception as e:
            return False, {}, str(e)

    def test_health_check(self):
        """Test API health endpoint"""
        success, data, status = self.make_request('GET', 'health')
        return self.log_test("Health Check", success and data.get('status') == 'healthy')

    def test_user_registration(self):
        """Test user registration"""
        test_email = f"test_{uuid.uuid4().hex[:8]}@craven.com"
        user_data = {
            "email": test_email,
            "password": "TestPass123!",
            "name": "Test User",
            "role": "admin"
        }
        
        success, data, status = self.make_request('POST', 'auth/register', user_data, 200)
        if success and data.get('token'):
            self.token = data['token']
            self.user_id = data['user']['id']
            self.created_ids['users'].append(self.user_id)
            return self.log_test("User Registration", True)
        return self.log_test("User Registration", False, f"Status: {status}")

    def test_user_login(self):
        """Test user login with existing user"""
        # Create a test user first
        test_email = f"login_test_{uuid.uuid4().hex[:8]}@craven.com"
        reg_data = {
            "email": test_email,
            "password": "LoginTest123!",
            "name": "Login Test User",
            "role": "engineer"
        }
        
        # Register user
        success, reg_response, _ = self.make_request('POST', 'auth/register', reg_data, 200)
        if not success:
            return self.log_test("User Login", False, "Failed to create test user")
        
        # Now test login
        login_data = {
            "email": test_email,
            "password": "LoginTest123!"
        }
        
        success, data, status = self.make_request('POST', 'auth/login', login_data, 200)
        if success and data.get('token'):
            return self.log_test("User Login", True)
        return self.log_test("User Login", False, f"Status: {status}")

    def test_get_current_user(self):
        """Test getting current user info"""
        success, data, status = self.make_request('GET', 'auth/me')
        return self.log_test("Get Current User", success and data.get('id') == self.user_id)

    def test_customer_crud(self):
        """Test Customer CRUD operations"""
        # Create Customer
        customer_data = {
            "company_name": "Test Company Ltd",
            "billing_address": "123 Test Street, London, SW1A 1AA",
            "phone": "020 1234 5678",
            "email": "test@testcompany.com",
            "notes": "Test customer for API testing"
        }
        
        success, data, status = self.make_request('POST', 'customers', customer_data, 200)
        if not success:
            return self.log_test("Customer CRUD", False, f"Create failed: {status}")
        
        customer_id = data.get('id')
        self.created_ids['customers'].append(customer_id)
        
        # Read Customer
        success, data, status = self.make_request('GET', f'customers/{customer_id}')
        if not success or data.get('company_name') != customer_data['company_name']:
            return self.log_test("Customer CRUD", False, "Read failed")
        
        # Update Customer
        update_data = {**customer_data, "company_name": "Updated Test Company Ltd"}
        success, data, status = self.make_request('PUT', f'customers/{customer_id}', update_data)
        if not success or data.get('company_name') != update_data['company_name']:
            return self.log_test("Customer CRUD", False, "Update failed")
        
        # List Customers
        success, data, status = self.make_request('GET', 'customers')
        if not success or not isinstance(data, list):
            return self.log_test("Customer CRUD", False, "List failed")
        
        return self.log_test("Customer CRUD", True)

    def test_site_crud(self):
        """Test Site CRUD operations"""
        if not self.created_ids['customers']:
            return self.log_test("Site CRUD", False, "No customer available")
        
        customer_id = self.created_ids['customers'][0]
        site_data = {
            "customer_id": customer_id,
            "name": "Main Office",
            "address": "456 Business Park, London, EC1A 1BB",
            "access_notes": "Key box by main entrance",
            "key_location": "Code 1234",
            "opening_hours": "Mon-Fri 9am-6pm",
            "contact_name": "Site Manager",
            "contact_phone": "020 9876 5432"
        }
        
        success, data, status = self.make_request('POST', 'sites', site_data, 200)
        if not success:
            return self.log_test("Site CRUD", False, f"Create failed: {status}")
        
        site_id = data.get('id')
        self.created_ids['sites'].append(site_id)
        
        # Test read and update
        success, data, status = self.make_request('GET', f'sites/{site_id}')
        if not success:
            return self.log_test("Site CRUD", False, "Read failed")
        
        return self.log_test("Site CRUD", True)

    def test_asset_crud(self):
        """Test Asset CRUD operations"""
        if not self.created_ids['sites']:
            return self.log_test("Asset CRUD", False, "No site available")
        
        site_id = self.created_ids['sites'][0]
        asset_data = {
            "site_id": site_id,
            "name": "Walk-in Freezer #1",
            "make": "Tefcold",
            "model": "GS365",
            "serial_number": f"SN{uuid.uuid4().hex[:8].upper()}",
            "install_date": "2023-01-15",
            "warranty_expiry": "2025-01-15",
            "refrigerant_type": "R404A",
            "refrigerant_charge": "2.5",
            "pm_interval_months": 6,
            "notes": "Main freezer unit"
        }
        
        success, data, status = self.make_request('POST', 'assets', asset_data, 200)
        if not success:
            return self.log_test("Asset CRUD", False, f"Create failed: {status}")
        
        asset_id = data.get('id')
        self.created_ids['assets'].append(asset_id)
        
        # Test PM due list
        success, data, status = self.make_request('GET', 'assets/pm-due')
        if not success:
            return self.log_test("Asset CRUD", False, "PM due list failed")
        
        return self.log_test("Asset CRUD", True)

    def test_job_management(self):
        """Test Job creation and management"""
        if not self.created_ids['customers'] or not self.created_ids['sites']:
            return self.log_test("Job Management", False, "Missing customer or site")
        
        customer_id = self.created_ids['customers'][0]
        site_id = self.created_ids['sites'][0]
        asset_ids = self.created_ids['assets'][:1] if self.created_ids['assets'] else []
        
        job_data = {
            "customer_id": customer_id,
            "site_id": site_id,
            "asset_ids": asset_ids,
            "job_type": "breakdown",
            "priority": "high",
            "description": "Freezer not cooling properly - urgent repair needed",
            "scheduled_date": (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d"),
            "scheduled_time": "09:00",
            "estimated_duration": 120,
            "sla_hours": 4
        }
        
        success, data, status = self.make_request('POST', 'jobs', job_data, 200)
        if not success:
            return self.log_test("Job Management", False, f"Create failed: {status}")
        
        job_id = data.get('id')
        self.created_ids['jobs'].append(job_id)
        
        # Test job status update
        update_data = {"status": "in_progress"}
        success, data, status = self.make_request('PUT', f'jobs/{job_id}', update_data)
        if not success:
            return self.log_test("Job Management", False, "Status update failed")
        
        # Test job listing with filters
        success, data, status = self.make_request('GET', 'jobs?status=in_progress')
        if not success:
            return self.log_test("Job Management", False, "Filtered list failed")
        
        return self.log_test("Job Management", True)

    def test_quote_creation(self):
        """Test Quote creation and PDF generation"""
        if not self.created_ids['customers'] or not self.created_ids['sites']:
            return self.log_test("Quote Creation", False, "Missing customer or site")
        
        customer_id = self.created_ids['customers'][0]
        site_id = self.created_ids['sites'][0]
        
        quote_data = {
            "customer_id": customer_id,
            "site_id": site_id,
            "lines": [
                {
                    "description": "Freezer repair - compressor replacement",
                    "quantity": 1,
                    "unit_price": 450.00,
                    "type": "labour"
                },
                {
                    "description": "Compressor unit",
                    "quantity": 1,
                    "unit_price": 280.00,
                    "type": "parts"
                }
            ],
            "notes": "Quote for freezer repair work",
            "valid_days": 30
        }
        
        success, data, status = self.make_request('POST', 'quotes', quote_data, 200)
        if not success:
            return self.log_test("Quote Creation", False, f"Create failed: {status}")
        
        quote_id = data.get('id')
        self.created_ids['quotes'].append(quote_id)
        
        # Test quote status update
        success, data, status = self.make_request('PUT', f'quotes/{quote_id}/status?status=sent')
        if not success:
            return self.log_test("Quote Creation", False, "Status update failed")
        
        return self.log_test("Quote Creation", True)

    def test_invoice_creation(self):
        """Test Invoice creation"""
        if not self.created_ids['customers'] or not self.created_ids['sites']:
            return self.log_test("Invoice Creation", False, "Missing customer or site")
        
        customer_id = self.created_ids['customers'][0]
        site_id = self.created_ids['sites'][0]
        
        invoice_data = {
            "customer_id": customer_id,
            "site_id": site_id,
            "lines": [
                {
                    "description": "Emergency callout - freezer repair",
                    "quantity": 1,
                    "unit_price": 85.00,
                    "type": "callout"
                },
                {
                    "description": "Labour - 2 hours",
                    "quantity": 2,
                    "unit_price": 65.00,
                    "type": "labour"
                }
            ],
            "notes": "Emergency repair completed",
            "due_days": 30
        }
        
        success, data, status = self.make_request('POST', 'invoices', invoice_data, 200)
        if not success:
            return self.log_test("Invoice Creation", False, f"Create failed: {status}")
        
        invoice_id = data.get('id')
        self.created_ids['invoices'].append(invoice_id)
        
        return self.log_test("Invoice Creation", True)

    def test_parts_management(self):
        """Test Parts CRUD operations"""
        part_data = {
            "name": "Compressor - Danfoss SC18G",
            "part_number": "SC18G-104G8",
            "description": "Hermetic compressor for commercial refrigeration",
            "unit_price": 285.50,
            "stock_quantity": 5,
            "min_stock_level": 2
        }
        
        success, data, status = self.make_request('POST', 'parts', part_data, 200)
        if not success:
            return self.log_test("Parts Management", False, f"Create failed: {status}")
        
        part_id = data.get('id')
        self.created_ids['parts'].append(part_id)
        
        # Test parts listing
        success, data, status = self.make_request('GET', 'parts')
        if not success or not isinstance(data, list):
            return self.log_test("Parts Management", False, "List failed")
        
        return self.log_test("Parts Management", True)

    def test_dashboard_stats(self):
        """Test dashboard statistics endpoint"""
        success, data, status = self.make_request('GET', 'dashboard/stats')
        if not success:
            return self.log_test("Dashboard Stats", False, f"Request failed: {status}")
        
        required_fields = ['total_jobs', 'pending_jobs', 'completed_this_week', 'outstanding_amount']
        for field in required_fields:
            if field not in data:
                return self.log_test("Dashboard Stats", False, f"Missing field: {field}")
        
        return self.log_test("Dashboard Stats", True)

    def test_reports(self):
        """Test reporting endpoints"""
        # Test jobs by status report
        success, data, status = self.make_request('GET', 'reports/jobs-by-status')
        if not success:
            return self.log_test("Reports", False, "Jobs by status failed")
        
        # Test jobs by engineer report
        success, data, status = self.make_request('GET', 'reports/jobs-by-engineer')
        if not success:
            return self.log_test("Reports", False, "Jobs by engineer failed")
        
        return self.log_test("Reports", True)

    def test_user_management(self):
        """Test user management endpoints"""
        # Test get all users
        success, data, status = self.make_request('GET', 'users')
        if not success or not isinstance(data, list):
            return self.log_test("User Management", False, "Get users failed")
        
        # Test get engineers
        success, data, status = self.make_request('GET', 'users/engineers')
        if not success or not isinstance(data, list):
            return self.log_test("User Management", False, "Get engineers failed")
        
        return self.log_test("User Management", True)

    def test_pm_automation(self):
        """Test PM Automation endpoints"""
        # Test PM status
        success, data, status = self.make_request('GET', 'pm/status')
        if not success:
            return self.log_test("PM Automation", False, f"PM status failed: {status}")
        
        required_fields = ['overdue', 'due_this_week', 'due_this_month']
        for field in required_fields:
            if field not in data:
                return self.log_test("PM Automation", False, f"Missing field: {field}")
        
        # Test generate PM jobs
        success, data, status = self.make_request('POST', 'pm/generate-jobs')
        if not success:
            return self.log_test("PM Automation", False, f"Generate PM jobs failed: {status}")
        
        if 'jobs_created' not in data:
            return self.log_test("PM Automation", False, "Missing jobs_created field")
        
        return self.log_test("PM Automation", True)

    def test_customer_portal(self):
        """Test Customer Portal endpoints"""
        if not self.created_ids['customers']:
            return self.log_test("Customer Portal", False, "No customer available")
        
        customer_id = self.created_ids['customers'][0]
        
        # Test create portal access
        portal_data = {
            "customer_id": customer_id,
            "email": f"portal_test_{uuid.uuid4().hex[:8]}@customer.com",
            "contact_name": "Portal Test User"
        }
        
        success, data, status = self.make_request('POST', 'portal/create-access', portal_data)
        if not success:
            return self.log_test("Customer Portal", False, f"Create access failed: {status}")
        
        if 'access_code' not in data:
            return self.log_test("Customer Portal", False, "Missing access_code field")
        
        access_code = data['access_code']
        
        # Test portal login
        login_data = {
            "email": portal_data["email"],
            "access_code": access_code
        }
        
        success, login_response, status = self.make_request('POST', 'portal/login', login_data)
        if not success:
            return self.log_test("Customer Portal", False, f"Portal login failed: {status}")
        
        if 'token' not in login_response:
            return self.log_test("Customer Portal", False, "Missing token in login response")
        
        # Test portal access list
        success, data, status = self.make_request('GET', 'portal/access-list')
        if not success or not isinstance(data, list):
            return self.log_test("Customer Portal", False, "Access list failed")
        
        return self.log_test("Customer Portal", True)

    def test_job_photos(self):
        """Test Job Photos endpoints"""
        if not self.created_ids['jobs']:
            return self.log_test("Job Photos", False, "No job available")
        
        job_id = self.created_ids['jobs'][0]
        
        # Test get job photos (should be empty initially)
        success, data, status = self.make_request('GET', f'jobs/{job_id}/photos')
        if not success or not isinstance(data, list):
            return self.log_test("Job Photos", False, "Get photos failed")
        
        return self.log_test("Job Photos", True)

    def cleanup_test_data(self):
        """Clean up created test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete in reverse order of dependencies
        for invoice_id in self.created_ids['invoices']:
            self.make_request('DELETE', f'invoices/{invoice_id}')
        
        for quote_id in self.created_ids['quotes']:
            self.make_request('DELETE', f'quotes/{quote_id}')
        
        for job_id in self.created_ids['jobs']:
            self.make_request('DELETE', f'jobs/{job_id}')
        
        for part_id in self.created_ids['parts']:
            self.make_request('DELETE', f'parts/{part_id}')
        
        for asset_id in self.created_ids['assets']:
            self.make_request('DELETE', f'assets/{asset_id}')
        
        for site_id in self.created_ids['sites']:
            self.make_request('DELETE', f'sites/{site_id}')
        
        for customer_id in self.created_ids['customers']:
            self.make_request('DELETE', f'customers/{customer_id}')

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Craven Cooling FSM Backend API Tests")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Core tests
        tests = [
            self.test_health_check,
            self.test_user_registration,
            self.test_user_login,
            self.test_get_current_user,
            self.test_customer_crud,
            self.test_site_crud,
            self.test_asset_crud,
            self.test_job_management,
            self.test_quote_creation,
            self.test_invoice_creation,
            self.test_parts_management,
            self.test_dashboard_stats,
            self.test_reports,
            self.test_user_management,
            self.test_pm_automation,
            self.test_customer_portal,
            self.test_job_photos,
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                self.log_test(test.__name__, False, str(e))
        
        # Cleanup
        self.cleanup_test_data()
        
        # Results
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print(f"❌ {self.tests_run - self.tests_passed} tests failed")
            return 1

def main():
    tester = CravenCoolingAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())
