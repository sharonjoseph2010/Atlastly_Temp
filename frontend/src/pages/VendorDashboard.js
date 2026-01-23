import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { vendorAPI, discoveryAPI } from '../utils/api';
import { Map, Marker } from 'react-map-gl';
import VendorMarker from '../components/VendorMarker';
import { LogOut, Save, AlertCircle, CheckCircle } from 'lucide-react';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;
const MAPBOX_STYLE = process.env.REACT_APP_MAPBOX_STYLE;

export default function VendorDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  
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

  const [viewState, setViewState] = useState({
    longitude: 77.2090,
    latitude: 28.6139,
    zoom: 12
  });

  useEffect(() => {
    if (user?.role !== 'vendor') {
      navigate('/');
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      const categoriesRes = await discoveryAPI.getCategories();
      setCategories(categoriesRes.data.categories);

      try {
        const profileRes = await vendorAPI.getProfile(user.token);
        setFormData(profileRes.data);
        setHasProfile(true);
        setViewState({
          longitude: profileRes.data.longitude,
          latitude: profileRes.data.latitude,
          zoom: 12
        });
      } catch (err) {
        if (err.response?.status === 404) {
          setHasProfile(false);
          setShowForm(true);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerDragEnd = (event) => {
    const { lng, lat } = event.lngLat;
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
    setViewState({
      ...viewState,
      longitude: lng,
      latitude: lat,
    });
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
      setShowForm(false);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Failed to save profile',
      });
    } finally {
      setSaving(false);
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
        {/* Vendor Location Marker - Draggable */}
        <Marker
          longitude={formData.longitude}
          latitude={formData.latitude}
          anchor="bottom"
          draggable
          onDragEnd={handleMarkerDragEnd}
        >
          <VendorMarker
            vendor={{
              ...formData,
              vendor_id: user?.userId || 'current',
              category: formData.category || 'Venue'
            }}
            state="pending"
            isSelected={true}
          />
        </Marker>
      </Map>

      {/* Floating Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-surface rounded-2xl shadow-2xl border-2 border-border p-4 floating-card">
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-xl md:text-2xl font-black text-primary">
                {hasProfile ? 'Update Your Location' : 'Set Your Location'}
              </h1>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-12 px-4 md:px-6 rounded-full font-bold border-2 border-primary transition-transform active:scale-95"
                  data-testid="toggle-form"
                >
                  {showForm ? 'Hide' : 'Edit'} Details
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
            
            <p className="text-base text-primary mt-3">
              Drag the marker on the map to set your business location
            </p>
            
            {/* Coordinates Display */}
            <div className="flex gap-4 mt-3 text-sm font-mono">
              <span className="text-primary">Lat: {formData.latitude.toFixed(6)}</span>
              <span className="text-primary">Lng: {formData.longitude.toFixed(6)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Message Banner */}
      {message.text && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-20 w-full max-w-md px-4">
          <div
            className={`border-2 rounded-lg p-4 flex items-start gap-3 floating-card slide-up ${
              message.type === 'success'
                ? 'bg-success/10 border-success'
                : 'bg-error/10 border-error'
            }`}
            data-testid="message-banner"
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-6 h-6 text-success flex-shrink-0" strokeWidth={2} />
            ) : (
              <AlertCircle className="w-6 h-6 text-error flex-shrink-0" strokeWidth={2} />
            )}
            <p className={`text-base font-medium ${
              message.type === 'success' ? 'text-success' : 'text-error'
            }`}>
              {message.text}
            </p>
          </div>
        </div>
      )}

      {/* Vendor Details Form - Floating Bottom Sheet */}
      {showForm && (
        <div className="absolute bottom-0 left-0 right-0 z-20 slide-up max-h-[70vh] overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 pb-4">
            <div className="bg-surface rounded-t-3xl shadow-2xl border-2 border-border border-b-0 floating-card">
              {/* Handle Bar */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1 bg-border rounded-full"></div>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <h2 className="text-2xl font-bold text-primary mb-4">Business Details</h2>

                {/* Business Name */}
                <div>
                  <label htmlFor="business_name" className="block text-base font-bold mb-2 text-primary">
                    Business Name *
                  </label>
                  <input
                    id="business_name"
                    name="business_name"
                    type="text"
                    value={formData.business_name}
                    onChange={handleChange}
                    className="w-full h-12 border-2 border-border rounded-md px-4 text-base focus:border-primary focus:ring-2 focus:ring-secondary/50 outline-none bg-white text-primary"
                    required
                    data-testid="business-name-input"
                  />
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="category" className="block text-base font-bold mb-2 text-primary">
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full h-12 border-2 border-border rounded-md px-4 text-base focus:border-primary focus:ring-2 focus:ring-secondary/50 outline-none bg-white text-primary"
                    required
                    data-testid="category-select"
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* City */}
                <div>
                  <label htmlFor="city" className="block text-base font-bold mb-2 text-primary">
                    City *
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full h-12 border-2 border-border rounded-md px-4 text-base focus:border-primary focus:ring-2 focus:ring-secondary/50 outline-none bg-white text-primary"
                    required
                    data-testid="city-input"
                  />
                </div>

                {/* Address */}
                <div>
                  <label htmlFor="address" className="block text-base font-bold mb-2 text-primary">
                    Address *
                  </label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full h-12 border-2 border-border rounded-md px-4 text-base focus:border-primary focus:ring-2 focus:ring-secondary/50 outline-none bg-white text-primary"
                    required
                    data-testid="address-input"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-base font-bold mb-2 text-primary">
                    Phone *
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full h-12 border-2 border-border rounded-md px-4 text-base focus:border-primary focus:ring-2 focus:ring-secondary/50 outline-none bg-white text-primary"
                    required
                    data-testid="phone-input"
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-base font-bold mb-2 text-primary">
                    Description *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full border-2 border-border rounded-md px-4 py-3 text-base focus:border-primary focus:ring-2 focus:ring-secondary/50 outline-none bg-white text-primary resize-none"
                    required
                    data-testid="description-input"
                  />
                </div>

                {/* Website */}
                <div>
                  <label htmlFor="external_link" className="block text-base font-bold mb-2 text-primary">
                    Website (Optional)
                  </label>
                  <input
                    id="external_link"
                    name="external_link"
                    type="url"
                    value={formData.external_link}
                    onChange={handleChange}
                    className="w-full h-12 border-2 border-border rounded-md px-4 text-base focus:border-primary focus:ring-2 focus:ring-secondary/50 outline-none bg-white text-primary"
                    placeholder="https://"
                    data-testid="website-input"
                  />
                </div>

                {/* Save Button */}
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 h-12 px-8 rounded-full font-bold text-lg border-2 border-primary transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  data-testid="save-button"
                >
                  <Save className="w-5 h-5" strokeWidth={2} />
                  {saving ? 'Saving...' : hasProfile ? 'Update Profile' : 'Create Profile'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
