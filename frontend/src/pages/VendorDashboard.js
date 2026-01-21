import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { vendorAPI, discoveryAPI } from '../utils/api';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { LogOut, MapPin, Eye, EyeOff, Save, AlertCircle, CheckCircle, Map } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';

export default function VendorDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const markerRef = useRef(null);
  const previewMapRef = useRef(null);
  const previewGoogleMapRef = useRef(null);
  
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [categories, setCategories] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  
  const [formData, setFormData] = useState({
    business_name: '',
    category: '',
    city: '',
    address: '',
    phone: '',
    description: '',
    external_link: '',
    latitude: 28.6139,
    longitude: 77.2090,
    is_active: true,
  });

  useEffect(() => {
    if (user?.role !== 'vendor') {
      navigate('/');
      return;
    }
    loadData();
  }, [user, navigate]);

  useEffect(() => {
    if (!loading) {
      initializeMap();
    }
  }, [loading]);

  const loadData = async () => {
    try {
      const categoriesRes = await discoveryAPI.getCategories();
      setCategories(categoriesRes.data.categories);

      try {
        const profileRes = await vendorAPI.getProfile(user.token);
        setFormData(profileRes.data);
        setHasProfile(true);
      } catch (err) {
        if (err.response?.status === 404) {
          setHasProfile(false);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = async () => {
    if (!mapRef.current || !GOOGLE_MAPS_API_KEY) return;

    try {
      // Set API options
      setOptions({
        apiKey: GOOGLE_MAPS_API_KEY,
        version: 'weekly',
      });

      // Import maps library
      const { Map } = await importLibrary('maps');
      const { Marker } = await importLibrary('marker');
      
      const map = new Map(mapRef.current, {
        center: { lat: formData.latitude, lng: formData.longitude },
        zoom: 13,
        mapId: 'VENDOR_MAP',
      });

      const marker = new Marker({
        position: { lat: formData.latitude, lng: formData.longitude },
        map,
        draggable: true,
      });

      marker.addListener('dragend', (e) => {
        setFormData(prev => ({
          ...prev,
          latitude: e.latLng.lat(),
          longitude: e.latLng.lng(),
        }));
      });

      googleMapRef.current = map;
      markerRef.current = marker;
    } catch (error) {
      console.error('Error loading map:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      if (hasProfile) {
        await vendorAPI.updateProfile(formData, user.token);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        await vendorAPI.createProfile(formData, user.token);
        setHasProfile(true);
        setMessage({ type: 'success', text: 'Profile created successfully!' });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Failed to save profile',
      });
    } finally {
      setSaving(false);
    }
  };

  const loadPreviewMap = async () => {
    if (!previewMapRef.current || !GOOGLE_MAPS_API_KEY || !hasProfile) return;

    try {
      const loader = new APILoader({
        apiKey: GOOGLE_MAPS_API_KEY,
        version: 'weekly',
      });

      await loader.load();
      
      // Get all vendors to show on preview
      const vendorsRes = await discoveryAPI.getVendors();
      const allVendors = vendorsRes.data;

      const center = { lat: formData.latitude, lng: formData.longitude };
      
      const map = new google.maps.Map(previewMapRef.current, {
        center,
        zoom: 12,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
        ],
      });

      // Add markers for all vendors (including current vendor)
      allVendors.forEach(vendor => {
        const isCurrentVendor = vendor.vendor_id === user.userId;
        
        const marker = new google.maps.Marker({
          position: { lat: vendor.latitude, lng: vendor.longitude },
          map,
          title: vendor.business_name,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: isCurrentVendor ? 15 : 12,
            fillColor: isCurrentVendor ? '#FFDC00' : '#001F3F',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 3,
          },
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; max-width: 250px;">
              <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #001F3F;">
                ${vendor.business_name} ${isCurrentVendor ? '(You)' : ''}
              </h3>
              <p style="margin: 4px 0; color: #FFDC00; font-weight: 600;">${vendor.category}</p>
              <p style="margin: 4px 0; color: #001F3F;">${vendor.description}</p>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });
      });

      // Fit bounds to show all vendors
      if (allVendors.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        allVendors.forEach(vendor => {
          bounds.extend({ lat: vendor.latitude, lng: vendor.longitude });
        });
        map.fitBounds(bounds);
      }

      previewGoogleMapRef.current = map;
    } catch (error) {
      console.error('Error loading preview map:', error);
    }
  };

  useEffect(() => {
    if (showPreview && hasProfile) {
      setTimeout(() => loadPreviewMap(), 100);
    }
  }, [showPreview, hasProfile]);

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface border-b-2 border-border px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-primary">Vendor Dashboard</h1>
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
      <main className="px-6 md:px-12 py-8">
        <div className="max-w-4xl mx-auto">
          {message.text && (
            <div
              className={`mb-6 border-2 rounded-lg p-4 flex items-start gap-3 ${
                message.type === 'success'
                  ? 'bg-success/10 border-success'
                  : 'bg-error/10 border-error'
              }`}
              data-testid="message-banner"
            >
              {message.type === 'success' ? (
                <CheckCircle className="w-6 h-6 text-success flex-shrink-0 mt-0.5" strokeWidth={2} />
              ) : (
                <AlertCircle className="w-6 h-6 text-error flex-shrink-0 mt-0.5" strokeWidth={2} />
              )}
              <p className={`text-base font-medium ${
                message.type === 'success' ? 'text-success' : 'text-error'
              }`}>
                {message.text}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Name */}
            <div>
              <label htmlFor="business_name" className="block text-lg font-bold mb-2 text-primary">
                Business Name *
              </label>
              <input
                id="business_name"
                name="business_name"
                type="text"
                value={formData.business_name}
                onChange={handleChange}
                className="w-full h-12 border-2 border-border rounded-md px-4 text-lg focus:border-primary focus:ring-4 focus:ring-secondary/50 outline-none bg-white text-primary"
                required
                data-testid="business-name-input"
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-lg font-bold mb-2 text-primary">
                Service Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full h-12 border-2 border-border rounded-md px-4 text-lg focus:border-primary focus:ring-4 focus:ring-secondary/50 outline-none bg-white text-primary"
                required
                data-testid="category-select"
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* City */}
            <div>
              <label htmlFor="city" className="block text-lg font-bold mb-2 text-primary">
                City *
              </label>
              <input
                id="city"
                name="city"
                type="text"
                value={formData.city}
                onChange={handleChange}
                className="w-full h-12 border-2 border-border rounded-md px-4 text-lg focus:border-primary focus:ring-4 focus:ring-secondary/50 outline-none bg-white text-primary"
                required
                data-testid="city-input"
              />
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-lg font-bold mb-2 text-primary">
                Address *
              </label>
              <input
                id="address"
                name="address"
                type="text"
                value={formData.address}
                onChange={handleChange}
                className="w-full h-12 border-2 border-border rounded-md px-4 text-lg focus:border-primary focus:ring-4 focus:ring-secondary/50 outline-none bg-white text-primary"
                required
                data-testid="address-input"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-lg font-bold mb-2 text-primary">
                Phone Number *
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="w-full h-12 border-2 border-border rounded-md px-4 text-lg focus:border-primary focus:ring-4 focus:ring-secondary/50 outline-none bg-white text-primary"
                required
                data-testid="phone-input"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-lg font-bold mb-2 text-primary">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full border-2 border-border rounded-md px-4 py-3 text-lg focus:border-primary focus:ring-4 focus:ring-secondary/50 outline-none bg-white text-primary resize-none"
                required
                data-testid="description-input"
              />
            </div>

            {/* External Link */}
            <div>
              <label htmlFor="external_link" className="block text-lg font-bold mb-2 text-primary">
                Website (Optional)
              </label>
              <input
                id="external_link"
                name="external_link"
                type="url"
                value={formData.external_link}
                onChange={handleChange}
                className="w-full h-12 border-2 border-border rounded-md px-4 text-lg focus:border-primary focus:ring-4 focus:ring-secondary/50 outline-none bg-white text-primary"
                placeholder="https://"
                data-testid="website-input"
              />
            </div>

            {/* Map Location */}
            <div>
              <label className="block text-lg font-bold mb-2 text-primary flex items-center gap-2">
                <MapPin className="w-6 h-6" strokeWidth={2} />
                Pin Your Location *
              </label>
              {GOOGLE_MAPS_API_KEY ? (
                <div>
                  <div ref={mapRef} className="w-full h-96 border-2 border-border rounded-lg" data-testid="vendor-map" />
                  <p className="text-sm text-primary/70 mt-2">
                    Drag the marker to set your exact location
                  </p>
                </div>
              ) : (
                <div className="w-full h-96 border-2 border-border rounded-lg bg-background flex items-center justify-center">
                  <p className="text-base text-primary">Map requires Google Maps API key</p>
                </div>
              )}
            </div>

            {/* Visibility Toggle */}
            {hasProfile && (
              <div className="flex items-center gap-3 bg-surface border-2 border-border rounded-lg p-4">
                <input
                  id="is_active"
                  name="is_active"
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-6 h-6"
                  data-testid="visibility-toggle"
                />
                <label htmlFor="is_active" className="text-lg font-bold text-primary flex items-center gap-2">
                  {formData.is_active ? (
                    <Eye className="w-6 h-6" strokeWidth={2} />
                  ) : (
                    <EyeOff className="w-6 h-6" strokeWidth={2} />
                  )}
                  Profile Visible to Planners
                </label>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 h-12 px-8 rounded-full font-bold text-lg border-2 border-primary transition-transform active:scale-95 focus:ring-4 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              data-testid="save-profile-button"
            >
              <Save className="w-5 h-5" strokeWidth={2} />
              {saving ? 'Saving...' : hasProfile ? 'Update Profile' : 'Create Profile'}
            </button>
          </form>

          {/* Preview Button */}
          {hasProfile && GOOGLE_MAPS_API_KEY && (
            <div className="mt-6">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 rounded-full font-bold text-lg transition-transform active:scale-95 focus:ring-4 focus:ring-secondary flex items-center justify-center gap-2"
                data-testid="preview-button"
              >
                <Map className="w-5 h-5" strokeWidth={2} />
                {showPreview ? 'Hide Preview' : 'Preview How Planners See You'}
              </button>

              {showPreview && (
                <div className="mt-6 bg-surface border-2 border-border rounded-lg p-6 shadow-hard">
                  <h3 className="text-xl font-bold text-primary mb-3">
                    Planner View Preview
                  </h3>
                  <p className="text-base text-primary mb-4">
                    This is how your business appears to event planners on the discovery map. Your marker is highlighted in yellow.
                  </p>
                  <div 
                    ref={previewMapRef} 
                    className="w-full h-96 border-2 border-border rounded-lg"
                    data-testid="preview-map"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}