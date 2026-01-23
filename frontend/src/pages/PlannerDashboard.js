import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { discoveryAPI } from '../utils/api';
import { Map, Marker } from 'react-map-gl/mapbox';
import VendorMarker from '../components/VendorMarker';
import { MapPin, Filter, LogOut, X, Phone, ExternalLink, Search } from 'lucide-react';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;
const MAPBOX_STYLE = process.env.REACT_APP_MAPBOX_STYLE;

export default function PlannerDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchLocation, setSearchLocation] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const [viewState, setViewState] = useState({
    longitude: 77.2090,
    latitude: 28.6139,
    zoom: 4.5
  });

  useEffect(() => {
    if (user?.role !== 'planner') {
      navigate('/');
      return;
    }
    loadData();
  }, [user, navigate]);

  useEffect(() => {
    if (selectedCategory === 'all') {
      if (searchLocation.trim()) {
        return;
      }
      setFilteredVendors(vendors);
    } else {
      const filtered = vendors.filter(v => v.category === selectedCategory);
      if (searchLocation.trim()) {
        const searchTerm = searchLocation.toLowerCase().trim();
        const locationFiltered = filtered.filter(v => 
          v.city.toLowerCase().includes(searchTerm) || 
          v.address.toLowerCase().includes(searchTerm)
        );
        setFilteredVendors(locationFiltered);
      } else {
        setFilteredVendors(filtered);
      }
    }
  }, [selectedCategory, vendors]);

  const loadData = async () => {
    try {
      const [vendorsRes, categoriesRes] = await Promise.all([
        discoveryAPI.getVendors(),
        discoveryAPI.getCategories(),
      ]);
      setVendors(vendorsRes.data);
      setFilteredVendors(vendorsRes.data);
      setCategories(categoriesRes.data.categories);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerClick = (vendor) => {
    setSelectedVendor(vendor);
    // Recenter map slightly above the marker
    setViewState({
      ...viewState,
      longitude: vendor.longitude,
      latitude: vendor.latitude + 0.02,
      zoom: Math.max(viewState.zoom, 12)
    });
  };

  const handleLocationSearch = (e) => {
    e.preventDefault();
    if (!searchLocation.trim()) return;

    const searchTerm = searchLocation.toLowerCase().trim();
    const matchingVendors = vendors.filter(v => 
      v.city.toLowerCase().includes(searchTerm) || 
      v.address.toLowerCase().includes(searchTerm)
    );
    
    if (matchingVendors.length > 0) {
      setFilteredVendors(matchingVendors);
      const firstVendor = matchingVendors[0];
      setViewState({
        longitude: firstVendor.longitude,
        latitude: firstVendor.latitude,
        zoom: 12
      });
    } else {
      alert(`No vendors found in "${searchLocation}".`);
    }
  };

  const clearLocationSearch = () => {
    setSearchLocation('');
    setFilteredVendors(vendors);
    if (selectedCategory !== 'all') {
      setFilteredVendors(vendors.filter(v => v.category === selectedCategory));
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Full Screen Map */}
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={MAPBOX_STYLE}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
      >
        {/* Vendor Markers */}
        {filteredVendors.map(vendor => (
          <Marker
            key={vendor.vendor_id}
            longitude={vendor.longitude}
            latitude={vendor.latitude}
            anchor="bottom"
          >
            <VendorMarker
              vendor={vendor}
              state="confirmed"
              isSelected={selectedVendor?.vendor_id === vendor.vendor_id}
              onClick={() => handleMarkerClick(vendor)}
            />
          </Marker>
        ))}
      </Map>

      {/* Floating Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-surface rounded-2xl shadow-2xl border-2 border-border p-4 floating-card">
            <div className="flex items-center justify-between gap-4">
              {/* Logo/Title */}
              <h1 className="text-xl md:text-2xl font-black text-primary whitespace-nowrap">
                Event Services
              </h1>

              {/* Search Bar - Desktop */}
              <form onSubmit={handleLocationSearch} className="hidden md:flex flex-1 max-w-md items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/60" strokeWidth={2} />
                  <input
                    type="text"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    placeholder="Search location..."
                    className="w-full h-12 border-2 border-border rounded-full pl-11 pr-10 text-base focus:border-primary focus:ring-2 focus:ring-secondary/50 outline-none bg-white text-primary"
                    data-testid="location-search-input"
                  />
                  {searchLocation && (
                    <button
                      type="button"
                      onClick={clearLocationSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      data-testid="clear-search"
                    >
                      <X className="w-5 h-5 text-primary/60" strokeWidth={2} />
                    </button>
                  )}
                </div>
              </form>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-12 px-4 md:px-6 rounded-full font-bold border-2 border-primary transition-transform active:scale-95"
                  data-testid="toggle-filters"
                >
                  <Filter className="w-5 h-5" strokeWidth={2} />
                  <span className="hidden md:inline">Filters</span>
                </button>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-4 md:px-6 rounded-full font-bold transition-transform active:scale-95"
                  data-testid="logout-button"
                >
                  <LogOut className="w-5 h-5" strokeWidth={2} />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </div>
            </div>

            {/* Mobile Search */}
            <form onSubmit={handleLocationSearch} className="md:hidden mt-3 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/60" strokeWidth={2} />
                <input
                  type="text"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  placeholder="Search location..."
                  className="w-full h-12 border-2 border-border rounded-full pl-11 pr-10 text-base focus:border-primary focus:ring-2 focus:ring-secondary/50 outline-none bg-white text-primary"
                />
                {searchLocation && (
                  <button
                    type="button"
                    onClick={clearLocationSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-5 h-5 text-primary/60" strokeWidth={2} />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Floating Filter Panel */}
      {showFilters && (
        <div className="absolute top-24 md:top-28 left-4 md:left-6 z-10">
          <div className="bg-surface rounded-2xl shadow-2xl border-2 border-border p-4 w-72 floating-card slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-primary">Filters</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-primary hover:text-primary/80"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Category Filter */}
              <div>
                <label className="block text-base font-bold mb-2 text-primary">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full h-12 border-2 border-border rounded-md px-4 text-base focus:border-primary focus:ring-2 focus:ring-secondary/50 outline-none bg-white text-primary"
                  data-testid="category-filter"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Results Count */}
              <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-3">
                <p className="text-base font-bold text-primary">
                  {filteredVendors.length} {filteredVendors.length === 1 ? 'Service' : 'Services'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vendor Info Bottom Sheet */}
      {selectedVendor && (
        <div className="absolute bottom-0 left-0 right-0 z-20 slide-up">
          <div className="max-w-2xl mx-auto px-4 pb-4">
            <div className="bg-surface rounded-t-3xl shadow-2xl border-2 border-border border-b-0 overflow-hidden floating-card">
              {/* Handle Bar */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1 bg-border rounded-full"></div>
              </div>

              {/* Content */}
              <div className="p-6">
                <button
                  onClick={() => setSelectedVendor(null)}
                  className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center bg-error text-error-foreground rounded-full hover:bg-error/90 transition-colors"
                  data-testid="close-vendor-card"
                >
                  <X className="w-5 h-5" strokeWidth={2} />
                </button>

                <div className="pr-12">
                  <span className="inline-block px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm font-bold mb-3">
                    {selectedVendor.category}
                  </span>
                  
                  <h2 className="text-2xl md:text-3xl font-black text-primary mb-3">
                    {selectedVendor.business_name}
                  </h2>
                  
                  <p className="text-base md:text-lg text-primary mb-4">
                    {selectedVendor.description}
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" strokeWidth={2} />
                      <span className="text-base text-primary">
                        {selectedVendor.address}, {selectedVendor.city}
                      </span>
                    </div>
                    
                    <a
                      href={`tel:${selectedVendor.phone}`}
                      className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium w-fit"
                      data-testid="vendor-phone"
                    >
                      <Phone className="w-5 h-5" strokeWidth={2} />
                      {selectedVendor.phone}
                    </a>
                    
                    {selectedVendor.external_link && (
                      <a
                        href={selectedVendor.external_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium w-fit"
                        data-testid="vendor-link"
                      >
                        <ExternalLink className="w-5 h-5" strokeWidth={2} />
                        Visit Website
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
