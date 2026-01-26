from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict, field_validator
from typing import List, Optional, Literal
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Supabase connection
SUPABASE_URL = os.environ['SUPABASE_URL']
SUPABASE_SERVICE_KEY = os.environ['SUPABASE_SERVICE_KEY']
SUPABASE_ANON_KEY = os.environ['SUPABASE_ANON_KEY']

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Security
security = HTTPBearer()

# Service Categories (Fixed)
SERVICE_CATEGORIES = [
    "Venue",
    "Religious Venue",
    "Catering",
    "Decor",
    "Photography",
    "Makeup",
    "Attire Rentals",
    "Car Rentals",
    "Accessories",
    "Jewellery"
]

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============= Helper Functions =============
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify Supabase JWT token and return user info"""
    try:
        token = credentials.credentials
        
        # Verify token with Supabase
        user_response = supabase.auth.get_user(token)
        
        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid authentication")
        
        user = user_response.user
        user_id = user.id
        
        # Get user role from user_roles table
        role_response = supabase.table('user_roles').select('role').eq('user_id', user_id).single().execute()
        
        if not role_response.data:
            raise HTTPException(status_code=401, detail="User role not found")
        
        role = role_response.data['role']
        
        return {
            "user_id": user_id,
            "email": user.email,
            "role": role
        }
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Auth error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid authentication")

# ============= Models =============
class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    role: Literal["planner", "vendor", "admin"]
    
    @field_validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        return v

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    token: str
    role: str
    user_id: str
    message: str

class VendorProfileCreate(BaseModel):
    business_name: str
    category: str
    city: str
    address: str
    phone: str
    description: str
    external_link: Optional[str] = None
    latitude: float
    longitude: float
    
    @field_validator('category')
    def validate_category(cls, v):
        if v not in SERVICE_CATEGORIES:
            raise ValueError(f'Category must be one of: {", ".join(SERVICE_CATEGORIES)}')
        return v

class VendorProfileUpdate(BaseModel):
    business_name: Optional[str] = None
    category: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    description: Optional[str] = None
    external_link: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_active: Optional[bool] = None

class VendorProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    business_name: str
    category: str
    city: str
    address: str
    phone: str
    description: str
    external_link: Optional[str] = None
    latitude: float
    longitude: float
    is_active: bool = True
    created_at: str

class VendorPublic(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    business_name: str
    category: str
    city: str
    address: str
    phone: str
    description: str
    external_link: Optional[str] = None
    latitude: float
    longitude: float

class AdminVendorUpdate(BaseModel):
    is_active: Optional[bool] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None

# ============= Routes =============

@api_router.get("/")
async def root():
    return {"message": "Event Services Discovery API - Powered by Supabase"}

@api_router.get("/categories")
async def get_categories():
    return {"categories": SERVICE_CATEGORIES}

# ============= Auth Routes =============
@api_router.post("/auth/signup", response_model=AuthResponse)
async def signup(request: SignupRequest):
    try:
        # Create user in Supabase Auth
        auth_response = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password,
            "options": {
                "data": {
                    "role": request.role
                }
            }
        })
        
        if not auth_response.user:
            raise HTTPException(status_code=400, detail="Signup failed")
        
        user_id = auth_response.user.id
        
        # Store role in user_roles table
        supabase.table('user_roles').insert({
            "user_id": user_id,
            "role": request.role
        }).execute()
        
        # Get session token
        if not auth_response.session:
            raise HTTPException(status_code=400, detail="Session creation failed")
        
        token = auth_response.session.access_token
        
        return AuthResponse(
            token=token,
            role=request.role,
            user_id=user_id,
            message="Signup successful"
        )
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        if "already registered" in error_msg or "already exists" in error_msg:
            raise HTTPException(status_code=400, detail="Email already registered")
        logging.error(f"Signup error: {error_msg}")
        raise HTTPException(status_code=400, detail=f"Signup failed: {error_msg}")

@api_router.post("/auth/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    try:
        # Authenticate with Supabase
        auth_response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        
        if not auth_response.user or not auth_response.session:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        user_id = auth_response.user.id
        token = auth_response.session.access_token
        
        # Get user role
        role_response = supabase.table('user_roles').select('role').eq('user_id', user_id).single().execute()
        
        if not role_response.data:
            raise HTTPException(status_code=401, detail="User role not found")
        
        role = role_response.data['role']
        
        return AuthResponse(
            token=token,
            role=role,
            user_id=user_id,
            message="Login successful"
        )
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid credentials")

# ============= Vendor Routes =============
@api_router.post("/vendor/profile", response_model=VendorProfile)
async def create_vendor_profile(profile: VendorProfileCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "vendor":
        raise HTTPException(status_code=403, detail="Only vendors can create profiles")
    
    try:
        # Check if vendor already has a profile
        existing = supabase.table('vendors').select('id').eq('user_id', current_user["user_id"]).execute()
        
        if existing.data:
            raise HTTPException(status_code=400, detail="Profile already exists")
        
        vendor_data = {
            "user_id": current_user["user_id"],
            **profile.model_dump()
        }
        
        result = supabase.table('vendors').insert(vendor_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create profile")
        
        return VendorProfile(**result.data[0])
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Create profile error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create profile")

@api_router.get("/vendor/profile", response_model=VendorProfile)
async def get_vendor_profile(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "vendor":
        raise HTTPException(status_code=403, detail="Only vendors can access this")
    
    result = supabase.table('vendors').select('*').eq('user_id', current_user["user_id"]).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return VendorProfile(**result.data[0])

@api_router.put("/vendor/profile", response_model=VendorProfile)
async def update_vendor_profile(update: VendorProfileUpdate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "vendor":
        raise HTTPException(status_code=403, detail="Only vendors can update profiles")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    if "category" in update_data and update_data["category"] not in SERVICE_CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid category")
    
    result = supabase.table('vendors').update(update_data).eq('user_id', current_user["user_id"]).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return VendorProfile(**result.data[0])

# ============= Discovery Routes =============
@api_router.get("/vendors", response_model=List[VendorPublic])
async def get_vendors(category: Optional[str] = None):
    try:
        query = supabase.table('vendors').select('*').eq('is_active', True)
        
        if category:
            if category not in SERVICE_CATEGORIES:
                raise HTTPException(status_code=400, detail="Invalid category")
            query = query.eq('category', category)
        
        result = query.execute()
        
        return [VendorPublic(**v) for v in result.data]
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Get vendors error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch vendors")

@api_router.get("/vendors/{vendor_id}", response_model=VendorPublic)
async def get_vendor_detail(vendor_id: str):
    result = supabase.table('vendors').select('*').eq('id', vendor_id).eq('is_active', True).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    return VendorPublic(**result.data[0])

# ============= Admin Routes =============
@api_router.get("/admin/vendors", response_model=List[VendorProfile])
async def admin_get_all_vendors(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = supabase.table('vendors').select('*').execute()
    
    return [VendorProfile(**v) for v in result.data]

@api_router.post("/admin/vendors", response_model=VendorProfile)
async def admin_create_vendor(profile: VendorProfileCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    vendor_data = {
        "user_id": None,  # Admin-created vendors don't have a user_id
        **profile.model_dump()
    }
    
    result = supabase.table('vendors').insert(vendor_data).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create vendor")
    
    return VendorProfile(**result.data[0])

@api_router.put("/admin/vendors/{vendor_id}", response_model=VendorProfile)
async def admin_update_vendor(vendor_id: str, update: AdminVendorUpdate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = supabase.table('vendors').update(update_data).eq('id', vendor_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    return VendorProfile(**result.data[0])

@api_router.put("/admin/vendors/{vendor_id}/full", response_model=VendorProfile)
async def admin_full_update_vendor(vendor_id: str, profile: VendorProfileUpdate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_data = {k: v for k, v in profile.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = supabase.table('vendors').update(update_data).eq('id', vendor_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    return VendorProfile(**result.data[0])

@api_router.delete("/admin/vendors/{vendor_id}")
async def admin_delete_vendor(vendor_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = supabase.table('vendors').delete().eq('id', vendor_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    return {"message": "Vendor deleted successfully"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
