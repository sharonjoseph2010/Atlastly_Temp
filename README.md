# Atlastly

**What your event needs, right here**

An accessible, map-based platform where event planners discover nearby service providers, and vendors list themselves to be discovered — without intermediaries.

## Core Principle

**We are only the platform.**
- Vendors list themselves
- Users discover them by location  
- No bookings, payments, negotiations, or reviews
- We enable access, not control

## Features

### For Event Planners
- Search for service providers by location
- Interactive map-based discovery
- Filter by service category
- View vendor details and contact information
- No registration required to browse (coming soon)

### For Vendors
- Free business listing
- Pin exact location on map
- Manage profile and description
- Toggle visibility on/off
- Single category selection

### For Admins
- View all vendors
- Activate/deactivate vendors
- Edit vendor information
- Remove spam entries

## Service Categories

- Venue
- Religious Venue
- Catering
- Decor
- Photography
- Makeup
- Attire Rentals
- Car Rentals
- Accessories
- Jewellery

## Tech Stack

- **Frontend**: React 19, Tailwind CSS, Google Maps API
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Authentication**: JWT with bcrypt password hashing

## Setup Instructions

### Prerequisites

- Python 3.11+
- Node.js 18+ with Yarn
- MongoDB running on localhost:27017
- Google Maps API key (optional for MVP testing)

### Backend Setup

1. Navigate to backend directory:
```bash
cd /app/backend
```

2. Environment is already configured in `.env`:
```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
CORS_ORIGINS="*"
SECRET_KEY="event-discovery-secret-key-change-in-production"
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Backend runs automatically via supervisor on port 8001

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd /app/frontend
```

2. Add your Google Maps API key to `.env`:
```
REACT_APP_BACKEND_URL=https://eventfinder-47.preview.emergentagent.com
WDS_SOCKET_PORT=443
ENABLE_HEALTH_CHECK=false
REACT_APP_GOOGLE_MAPS_API_KEY=your_api_key_here
```

3. Install dependencies:
```bash
yarn install
```

4. Frontend runs automatically via supervisor on port 3000

### Getting a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable "Maps JavaScript API"
4. Create credentials (API key)
5. Restrict the key to your domain (optional but recommended)
6. Add the key to `/app/frontend/.env` as `REACT_APP_GOOGLE_MAPS_API_KEY`
7. Restart frontend: `sudo supervisorctl restart frontend`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account (planner/vendor/admin)
- `POST /api/auth/login` - Login

### Vendor Management (Protected)
- `POST /api/vendor/profile` - Create vendor profile
- `GET /api/vendor/profile` - Get own profile
- `PUT /api/vendor/profile` - Update profile

### Discovery (Public)
- `GET /api/vendors` - Get all active vendors
- `GET /api/vendors/{id}` - Get specific vendor
- `GET /api/categories` - Get service categories

### Admin (Protected)
- `GET /api/admin/vendors` - Get all vendors
- `PUT /api/admin/vendors/{id}` - Update vendor
- `DELETE /api/admin/vendors/{id}` - Delete vendor

## Design Philosophy

### Accessibility First

This platform is designed for **everyone**:
- All income groups
- All education levels  
- All age groups
- First-time internet users
- Users on low-end phones
- Users with visual or cognitive impairments

### Design Guidelines

✓ **High contrast colors**: Navy (#001F3F) and Yellow (#FFDC00)  
✓ **Large readable fonts**: Public Sans, minimum 16px  
✓ **Simple layouts**: Clear hierarchy, generous spacing  
✓ **Minimal cognitive load**: One primary action per screen  
✓ **Clear labels**: No icon-only actions  
✓ **No hidden UI**: Everything is visible and obvious  
✓ **Keyboard navigable**: Full keyboard support  
✓ **Screen reader friendly**: Semantic HTML and ARIA labels  

## User Roles

Roles are chosen at signup and **cannot be changed**:

1. **Planner** - Discovers services on map
2. **Vendor** - Lists business with location
3. **Admin** - Manages vendor listings

## Testing

### Manual Testing

Test the complete user flows:

1. **Landing Page**: Visit homepage, see role selection
2. **Planner Flow**: 
   - Sign up as planner
   - View map dashboard
   - Filter by category
   - Click vendor pins to see details
3. **Vendor Flow**:
   - Sign up as vendor  
   - Create business profile
   - Pin location on map
   - Toggle visibility
4. **Admin Flow**:
   - Sign up as admin
   - View all vendors
   - Activate/deactivate vendors
   - Delete spam entries

### Backend API Testing

```bash
# Get API URL
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)

# Test signup
curl -X POST "$API_URL/api/auth/signup" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "vendor@example.com",
    "password": "test123",
    "role": "vendor"
  }'

# Test discovery
curl "$API_URL/api/vendors"

# Test categories
curl "$API_URL/api/categories"
```

## Project Structure

```
/app/
├── backend/
│   ├── server.py              # FastAPI application
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Backend configuration
├── frontend/
│   ├── src/
│   │   ├── pages/            # React pages
│   │   ├── contexts/         # Auth context
│   │   ├── utils/            # API utilities
│   │   ├── App.js            # Main app component
│   │   ├── App.css           # Global styles
│   │   └── index.css         # Tailwind + custom CSS
│   ├── package.json          # Node dependencies
│   ├── tailwind.config.js    # Tailwind configuration
│   └── .env                  # Frontend configuration
└── design_guidelines.json    # Accessibility design specs

```

## What This Platform Is NOT

❌ No booking system  
❌ No payment processing  
❌ No reviews or ratings  
❌ No messaging between users  
❌ No algorithmic ranking  
❌ No ads or promotions  
❌ No hidden fees  

## Simplicity is the Product

This platform is **infrastructure** meant to:
- Reduce chaos
- Improve access  
- Respect dignity
- Work for everyone, not just premium users

## Contributing

When making changes:
- Prefer clarity over cleverness
- Prefer accessibility over beauty  
- Prefer stability over speed
- Prefer boring over smart
- Choose the simpler option when ambiguous

## License

MIT

## Support

For issues or questions, please contact the development team.

---

**Built with accessibility, simplicity, and dignity.**
