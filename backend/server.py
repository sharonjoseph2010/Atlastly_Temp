from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict, field_validator
from typing import List, Optional, Literal
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

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
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication")
        return {"user_id": user_id, "role": role}
    except JWTError:
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
    
    vendor_id: str
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
    
    vendor_id: str
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
    return {"message": "Event Services Discovery API"}

@api_router.get("/categories")
async def get_categories():
    return {"categories": SERVICE_CATEGORIES}

# ============= Auth Routes =============
@api_router.post("/auth/signup", response_model=AuthResponse)
async def signup(request: SignupRequest):
    # Check if user exists
    existing_user = await db.users.find_one({"email": request.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_data = {
        "user_id": f"{request.role}_{request.email.split('@')[0]}_{datetime.now(timezone.utc).timestamp()}",
        "email": request.email,
        "password": hash_password(request.password),
        "role": request.role,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_data)
    
    # Generate token
    token = create_access_token({"sub": user_data["user_id"], "role": user_data["role"]})
    
    return AuthResponse(
        token=token,
        role=user_data["role"],
        user_id=user_data["user_id"],
        message="Signup successful"
    )

@api_router.post("/auth/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    # Find user
    user = await db.users.find_one({"email": request.email}, {"_id": 0})
    if not user or not verify_password(request.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Generate token
    token = create_access_token({"sub": user["user_id"], "role": user["role"]})
    
    return AuthResponse(
        token=token,
        role=user["role"],
        user_id=user["user_id"],
        message="Login successful"
    )

# ============= Vendor Routes =============
@api_router.post("/vendor/profile", response_model=VendorProfile)
async def create_vendor_profile(profile: VendorProfileCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "vendor":
        raise HTTPException(status_code=403, detail="Only vendors can create profiles")
    
    # Check if vendor already has a profile
    existing = await db.vendors.find_one({"vendor_id": current_user["user_id"]}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists")
    
    vendor_data = {
        "vendor_id": current_user["user_id"],
        **profile.model_dump(),
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.vendors.insert_one(vendor_data)
    return VendorProfile(**vendor_data)

@api_router.get("/vendor/profile", response_model=VendorProfile)
async def get_vendor_profile(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "vendor":
        raise HTTPException(status_code=403, detail="Only vendors can access this")
    
    vendor = await db.vendors.find_one({"vendor_id": current_user["user_id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return VendorProfile(**vendor)

@api_router.put("/vendor/profile", response_model=VendorProfile)
async def update_vendor_profile(update: VendorProfileUpdate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "vendor":
        raise HTTPException(status_code=403, detail="Only vendors can update profiles")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    if "category" in update_data and update_data["category"] not in SERVICE_CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid category")
    
    result = await db.vendors.find_one_and_update(
        {"vendor_id": current_user["user_id"]},
        {"$set": update_data},
        return_document=True,
        projection={"_id": 0}
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return VendorProfile(**result)

# ============= Discovery Routes =============
@api_router.get("/vendors", response_model=List[VendorPublic])
async def get_vendors(category: Optional[str] = None):
    query = {"is_active": True}
    if category:
        if category not in SERVICE_CATEGORIES:
            raise HTTPException(status_code=400, detail="Invalid category")
        query["category"] = category
    
    vendors = await db.vendors.find(query, {"_id": 0}).to_list(1000)
    return [VendorPublic(**v) for v in vendors]

@api_router.get("/vendors/{vendor_id}", response_model=VendorPublic)
async def get_vendor_detail(vendor_id: str):
    vendor = await db.vendors.find_one({"vendor_id": vendor_id, "is_active": True}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    return VendorPublic(**vendor)

# ============= Admin Routes =============
@api_router.get("/admin/vendors", response_model=List[VendorProfile])
async def admin_get_all_vendors(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    vendors = await db.vendors.find({}, {"_id": 0}).to_list(1000)
    return [VendorProfile(**v) for v in vendors]

@api_router.put("/admin/vendors/{vendor_id}", response_model=VendorProfile)
async def admin_update_vendor(vendor_id: str, update: AdminVendorUpdate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.vendors.find_one_and_update(
        {"vendor_id": vendor_id},
        {"$set": update_data},
        return_document=True,
        projection={"_id": 0}
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    return VendorProfile(**result)

@api_router.delete("/admin/vendors/{vendor_id}")
async def admin_delete_vendor(vendor_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.vendors.delete_one({"vendor_id": vendor_id})
    if result.deleted_count == 0:
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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()