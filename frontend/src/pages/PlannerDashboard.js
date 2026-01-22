import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { discoveryAPI } from '../utils/api';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { MapPin, Filter, LogOut, X, Phone, ExternalLink, Navigation, Search } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';

export default function PlannerDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const markersRef = useRef([]);
  
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [searchLocation, setSearchLocation] = useState('');
  const [searchedCenter, setSearchedCenter] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (user?.role !== 'planner') {
      navigate('/');
      return;
    }
    loadData();
  }, [user, navigate]);

  useEffect(() => {
    if (vendors.length > 0 && !mapLoaded) {
      initializeMap();
    }
  }, [vendors, mapLoaded]);

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredVendors(vendors);
    } else {
      setFilteredVendors(vendors.filter(v => v.category === selectedCategory));
    }
  }, [selectedCategory, vendors]);

  useEffect(() => {
    if (mapLoaded && googleMapRef.current) {
      updateMapMarkers();
    }
  }, [filteredVendors, mapLoaded]);

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

  const initializeMap = async () => {
    if (!mapRef.current) return;

    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('Google Maps API key not configured');
      setMapLoaded(true);
      return;
    }

    try {
      // Set API options
      setOptions({
        apiKey: GOOGLE_MAPS_API_KEY,
        version: 'weekly',
      });

      // Import maps library
      const { Map } = await importLibrary('maps');
      
      // Default center (will adjust based on vendors)
      const center = vendors.length > 0 
        ? { lat: vendors[0].latitude, lng: vendors[0].longitude }
        : { lat: 28.6139, lng: 77.2090 }; // Default to Delhi

      const map = new Map(mapRef.current, {
        center,
        zoom: 12,
        mapId: 'PLANNER_MAP',
      });

      googleMapRef.current = map;
      setMapLoaded(true);
    } catch (error) {
      console.error('Error loading map:', error);
      setMapLoaded(true);
    }
  };

  const updateMapMarkers = async () => {
    if (!googleMapRef.current) return;

    try {
      const { Marker } = await importLibrary('marker');

      // Clear existing markers
      markersRef.current.forEach(marker => marker.map = null);
      markersRef.current = [];

      // Add new markers
      filteredVendors.forEach(vendor => {
        const marker = new Marker({
          position: { lat: vendor.latitude, lng: vendor.longitude },
          map: googleMapRef.current,
          title: vendor.business_name,
        });

        marker.addListener('click', () => {
          setSelectedVendor(vendor);
        });

        markersRef.current.push(marker);
      });

      // Fit bounds to show all markers
      if (filteredVendors.length > 0) {
        const { LatLngBounds } = await importLibrary('core');
        const bounds = new LatLngBounds();
        filteredVendors.forEach(vendor => {
          bounds.extend({ lat: vendor.latitude, lng: vendor.longitude });
        });
        googleMapRef.current.fitBounds(bounds);
      }
    } catch (error) {
      console.error('Error updating markers:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleLocationSearch = async (e) => {
    e.preventDefault();
    if (!searchLocation.trim() || !googleMapRef.current) return;

    setIsSearching(true);

    try {
      // Use Google Geocoding to find location
      setOptions({
        apiKey: GOOGLE_MAPS_API_KEY,
        version: 'weekly',
      });

      const { Geocoder } = await importLibrary('geocoding');
      const geocoder = new Geocoder();

      const result = await geocoder.geocode({ address: searchLocation });
      
      if (result.results && result.results.length > 0) {
        const location = result.results[0].geometry.location;
        const center = { lat: location.lat(), lng: location.lng() };
        
        // Update map center and zoom
        googleMapRef.current.setCenter(center);
        googleMapRef.current.setZoom(13);
        
        setSearchedCenter(center);
      } else {
        alert('Location not found. Please try a different search term.');
      }
    } catch (error) {
      console.error('Error searching location:', error);
      alert('Error searching for location. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-surface border-b-2 border-border px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-primary">Discover Services</h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-6 rounded-full font-bold transition-transform active:scale-95"
          data-testid="logout-button"
        >
          <LogOut className="w-5 h-5" strokeWidth={2} />
          Logout
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar */}
        <aside className="w-full md:w-80 bg-surface border-r-2 border-border overflow-y-auto p-6">
          {/* Location Search */}
          <div className="mb-6">
            <label className="block text-lg font-bold mb-3 text-primary flex items-center gap-2">
              <Search className="w-6 h-6" strokeWidth={2} />
              Search Location
            </label>
            <form onSubmit={handleLocationSearch} className="space-y-3">
              <input
                type="text"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                placeholder="Enter city or area (e.g., Ernakulam)"
                className="w-full h-12 border-2 border-border rounded-md px-4 text-base focus:border-primary focus:ring-4 focus:ring-secondary/50 outline-none bg-white text-primary placeholder:text-gray-500"
                data-testid="location-search-input"
              />
              <button
                type="submit"
                disabled={isSearching || !searchLocation.trim()}
                className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 h-12 px-6 rounded-full font-bold text-base border-2 border-primary transition-transform active:scale-95 focus:ring-4 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                data-testid="search-location-button"
              >
                <MapPin className="w-5 h-5" strokeWidth={2} />
                {isSearching ? 'Searching...' : 'Search Location'}
              </button>
            </form>
          </div>

          {/* Category Filter */}
          <div className="mb-6">
            <label className="block text-lg font-bold mb-3 text-primary flex items-center gap-2">
              <Filter className="w-6 h-6" strokeWidth={2} />
              Filter by Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-12 border-2 border-border rounded-md px-4 text-lg focus:border-primary focus:ring-4 focus:ring-secondary/50 outline-none bg-white text-primary"
              data-testid="category-filter"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Vendor Count */}
          <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4 mb-6">
            <p className="text-lg font-bold text-primary">
              {filteredVendors.length} {filteredVendors.length === 1 ? 'Service' : 'Services'} Found
            </p>
          </div>

          {/* API Key Notice */}
          {!GOOGLE_MAPS_API_KEY && (
            <div className="bg-secondary/20 border-2 border-secondary rounded-lg p-4">
              <p className="text-base font-medium text-primary">
                Map requires Google Maps API key to display locations.
              </p>
            </div>
          )}
        </aside>

        {/* Map Container */}
        <main className="flex-1 relative">
          {GOOGLE_MAPS_API_KEY ? (
            <div ref={mapRef} className="w-full h-full" data-testid="map-container" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-background p-6">
              <div className="text-center max-w-md">
                <MapPin className="w-16 h-16 text-primary mx-auto mb-4" strokeWidth={2} />
                <h2 className="text-2xl font-bold text-primary mb-2">Map Not Configured</h2>
                <p className="text-lg text-primary">
                  Please add your Google Maps API key to display the interactive map.
                </p>
              </div>
            </div>
          )}

          {/* Selected Vendor Card */}
          {selectedVendor && (
            <div className="absolute bottom-6 left-6 right-6 md:left-auto md:w-96 bg-surface border-2 border-border rounded-lg shadow-hard p-6" data-testid="vendor-card">
              <button
                onClick={() => setSelectedVendor(null)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-error text-error-foreground rounded-full hover:bg-error/90"
                data-testid="close-vendor-card"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>

              <h3 className="text-xl font-bold text-primary mb-2 pr-8">
                {selectedVendor.business_name}
              </h3>
              <p className="text-base font-medium text-secondary mb-3">
                {selectedVendor.category}
              </p>
              <p className="text-base text-primary mb-3">
                {selectedVendor.description}
              </p>
              <p className="text-base text-primary mb-4">
                <strong>Address:</strong> {selectedVendor.address}, {selectedVendor.city}
              </p>
              
              <div className="space-y-2">
                <a
                  href={`tel:${selectedVendor.phone}`}
                  className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium"
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
                    className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium"
                    data-testid="vendor-link"
                  >
                    <ExternalLink className="w-5 h-5" strokeWidth={2} />
                    Visit Website
                  </a>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}