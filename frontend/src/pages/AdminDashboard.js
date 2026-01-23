import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI, discoveryAPI } from '../utils/api';
import { Map, Marker } from 'react-map-gl/mapbox';
import { LogOut, Shield, Plus, Edit, Trash2, X, Save, MapPin, Eye, EyeOff } from 'lucide-react';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;
const MAPBOX_STYLE = process.env.REACT_APP_MAPBOX_STYLE;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  
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
  });

  const [viewState, setViewState] = useState({
    longitude: 77.2090,
    latitude: 28.6139,
    zoom: 12
  });

  const loadData = useCallback(async () => {
    try {
      const [vendorsRes, categoriesRes] = await Promise.all([
        adminAPI.getAllVendors(user.token),
        discoveryAPI.getCategories(),
      ]);
      setVendors(vendorsRes.data);
      setCategories(categoriesRes.data.categories);
    } catch (error) {
      console.error('Error loading vendors:', error);
      setMessage({ type: 'error', text: 'Failed to load vendors' });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    loadData();
  }, [user, navigate, loadData]);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/');
  }, [logout, navigate]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleMarkerDragEnd = useCallback((event) => {
    const { lng, lat } = event.lngLat;
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
    setViewState(prev => ({
      ...prev,
      longitude: lng,
      latitude: lat,
    }));
  }, []);

  const onMove = useCallback((evt) => {
    setViewState(evt.viewState);
  }, []);

  const openCreateForm = useCallback(() => {
    setEditingVendor(null);
    setFormData({
      business_name: '',
      category: '',
      city: '',
      address: '',
      phone: '',
      description: '',
      external_link: '',
      latitude: 28.6139,
      longitude: 77.2090,
    });
    setViewState({
      longitude: 77.2090,
      latitude: 28.6139,
      zoom: 12
    });
    setShowForm(true);
  }, []);

  const openEditForm = useCallback((vendor) => {
    setEditingVendor(vendor);
    setFormData({
      business_name: vendor.business_name,
      category: vendor.category,
      city: vendor.city,
      address: vendor.address,
      phone: vendor.phone,
      description: vendor.description,
      external_link: vendor.external_link || '',
      latitude: vendor.latitude,
      longitude: vendor.longitude,
    });
    setViewState({
      longitude: vendor.longitude,
      latitude: vendor.latitude,
      zoom: 12
    });
    setShowForm(true);
  }, []);

  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditingVendor(null);
    setMessage({ type: '', text: '' });
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      if (editingVendor) {
        await adminAPI.fullUpdateVendor(editingVendor.vendor_id, formData, user.token);
        setMessage({ type: 'success', text: 'Vendor updated successfully!' });
      } else {
        await adminAPI.createVendor(formData, user.token);
        setMessage({ type: 'success', text: 'Vendor created successfully!' });
      }
      await loadData();
      setTimeout(() => closeForm(), 1500);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Failed to save vendor',
      });
    }
  }, [editingVendor, formData, user, loadData, closeForm]);

  const handleToggleActive = useCallback(async (vendorId, currentStatus) => {
    try {
      await adminAPI.updateVendor(vendorId, { is_active: !currentStatus }, user.token);
      setVendors(prev =>
        prev.map(v =>
          v.vendor_id === vendorId ? { ...v, is_active: !currentStatus } : v
        )
      );
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update vendor status' });
    }
  }, [user]);

  const handleDelete = useCallback(async (vendorId) => {
    if (!window.confirm('Delete this vendor? This cannot be undone.')) return;

    try {
      await adminAPI.deleteVendor(vendorId, user.token);
      setVendors(prev => prev.filter(v => v.vendor_id !== vendorId));
      setMessage({ type: 'success', text: 'Vendor deleted successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete vendor' });
    }
  }, [user]);

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
      <header className="bg-surface border-b-2 border-border px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" strokeWidth={2} />
          <h1 className="text-2xl md:text-3xl font-bold text-primary">Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openCreateForm}
            className="flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-12 px-6 rounded-full font-bold border-2 border-primary transition-transform active:scale-95"
            data-testid="create-vendor-button"
          >
            <Plus className="w-5 h-5" strokeWidth={2} />
            <span className="hidden md:inline">Add Listing</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-6 rounded-full font-bold transition-transform active:scale-95"
            data-testid="logout-button"
          >
            <LogOut className="w-5 h-5" strokeWidth={2} />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="px-6 md:px-12 py-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-6">
          <div className="bg-surface border-2 border-border rounded-lg p-6 shadow-hard">
            <p className="text-lg font-bold text-primary mb-2">Total Vendors</p>
            <p className="text-4xl font-black text-primary">{vendors.length}</p>
          </div>
          <div className="bg-surface border-2 border-border rounded-lg p-6 shadow-hard">
            <p className="text-lg font-bold text-primary mb-2">Active</p>
            <p className="text-4xl font-black text-success">
              {vendors.filter(v => v.is_active).length}
            </p>
          </div>
          <div className="bg-surface border-2 border-border rounded-lg p-6 shadow-hard">
            <p className="text-lg font-bold text-primary mb-2">Inactive</p>
            <p className="text-4xl font-black text-error">
              {vendors.filter(v => !v.is_active).length}
            </p>
          </div>
        </div>
      </div>

      {/* Message Banner */}
      {message.text && !showForm && (
        <div className="px-6 md:px-12 pb-6">
          <div className="max-w-7xl mx-auto">
            <div
              className={`border-2 rounded-lg p-4 ${
                message.type === 'success'
                  ? 'bg-success/10 border-success text-success'
                  : 'bg-error/10 border-error text-error'
              }`}
            >
              <p className="text-base font-medium">{message.text}</p>
            </div>
          </div>
        </div>
      )}

      {/* Vendors List */}
      <div className="px-6 md:px-12 pb-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-6">Manage Vendors</h2>
          
          {vendors.length === 0 ? (
            <div className="bg-surface border-2 border-border rounded-lg p-8 text-center">
              <p className="text-lg text-primary">No vendors yet. Click "Add Listing" to create one.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {vendors.map(vendor => (
                <div
                  key={vendor.vendor_id}
                  className="bg-surface border-2 border-border rounded-lg p-6 shadow-hard"
                  data-testid={`vendor-${vendor.vendor_id}`}
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <h3 className="text-xl font-bold text-primary">
                          {vendor.business_name}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-bold ${
                            vendor.is_active
                              ? 'bg-success/20 text-success'
                              : 'bg-error/20 text-error'
                          }`}
                        >
                          {vendor.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-base font-medium text-secondary mb-2">
                        {vendor.category}
                      </p>
                      <p className="text-base text-primary mb-2">
                        {vendor.description}
                      </p>
                      <div className="space-y-1 text-sm">
                        <p className="text-primary">
                          <strong>Phone:</strong> {vendor.phone}
                        </p>
                        <p className="text-primary">
                          <strong>Address:</strong> {vendor.address}, {vendor.city}
                        </p>
                        <p className="text-primary">
                          <strong>Location:</strong> {vendor.latitude.toFixed(4)}, {vendor.longitude.toFixed(4)}
                        </p>
                      </div>
                    </div>

                    <div className="flex md:flex-col gap-2">
                      <button
                        onClick={() => handleToggleActive(vendor.vendor_id, vendor.is_active)}
                        className={`flex items-center gap-2 h-12 px-4 rounded-full font-bold text-sm transition-transform active:scale-95 ${
                          vendor.is_active
                            ? 'bg-error/10 border-2 border-error text-error hover:bg-error/20'
                            : 'bg-success/10 border-2 border-success text-success hover:bg-success/20'
                        }`}
                        data-testid={`toggle-${vendor.vendor_id}`}
                      >
                        {vendor.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {vendor.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      
                      <button
                        onClick={() => openEditForm(vendor)}
                        className="flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-12 px-4 rounded-full font-bold text-sm border-2 border-primary transition-transform active:scale-95"
                        data-testid={`edit-${vendor.vendor_id}`}
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      
                      <button
                        onClick={() => handleDelete(vendor.vendor_id)}
                        className="flex items-center gap-2 bg-error text-error-foreground hover:bg-error/90 h-12 px-4 rounded-full font-bold text-sm transition-transform active:scale-95"
                        data-testid={`delete-${vendor.vendor_id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border-2 border-border shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-surface border-b-2 border-border p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-primary">
                {editingVendor ? 'Edit Vendor' : 'Create New Vendor'}
              </h2>
              <button
                onClick={closeForm}
                className="w-10 h-10 flex items-center justify-center bg-error text-error-foreground rounded-full hover:bg-error/90"
                data-testid="close-form"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>

            {message.text && (
              <div className="p-6 pb-0">
                <div
                  className={`border-2 rounded-lg p-4 ${
                    message.type === 'success'
                      ? 'bg-success/10 border-success text-success'
                      : 'bg-error/10 border-error text-error'
                  }`}
                >
                  <p className="text-base font-medium">{message.text}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Business Name */}
                <div>
                  <label className="block text-base font-bold mb-2 text-primary">
                    Business Name *
                  </label>
                  <input
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
                  <label className="block text-base font-bold mb-2 text-primary">
                    Category *
                  </label>
                  <select
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
                  <label className="block text-base font-bold mb-2 text-primary">
                    City *
                  </label>
                  <input
                    name="city"
                    type="text"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full h-12 border-2 border-border rounded-md px-4 text-base focus:border-primary focus:ring-2 focus:ring-secondary/50 outline-none bg-white text-primary"
                    required
                    data-testid="city-input"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-base font-bold mb-2 text-primary">
                    Phone *
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full h-12 border-2 border-border rounded-md px-4 text-base focus:border-primary focus:ring-2 focus:ring-secondary/50 outline-none bg-white text-primary"
                    required
                    data-testid="phone-input"
                  />
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-base font-bold mb-2 text-primary">
                    Address *
                  </label>
                  <input
                    name="address"
                    type="text"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full h-12 border-2 border-border rounded-md px-4 text-base focus:border-primary focus:ring-2 focus:ring-secondary/50 outline-none bg-white text-primary"
                    required
                    data-testid="address-input"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-base font-bold mb-2 text-primary">
                    Description *
                  </label>
                  <textarea
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
                <div className="md:col-span-2">
                  <label className="block text-base font-bold mb-2 text-primary">
                    Website (Optional)
                  </label>
                  <input
                    name="external_link"
                    type="url"
                    value={formData.external_link}
                    onChange={handleChange}
                    className="w-full h-12 border-2 border-border rounded-md px-4 text-base focus:border-primary focus:ring-2 focus:ring-secondary/50 outline-none bg-white text-primary"
                    placeholder="https://"
                    data-testid="website-input"
                  />
                </div>

                {/* Location */}
                <div className="md:col-span-2">
                  <label className="block text-base font-bold mb-2 text-primary flex items-center gap-2">
                    <MapPin className="w-5 h-5" strokeWidth={2} />
                    Location *
                  </label>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <input
                      name="latitude"
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={handleChange}
                      className="w-full h-12 border-2 border-border rounded-md px-4 text-base focus:border-primary focus:ring-2 focus:ring-secondary/50 outline-none bg-white text-primary"
                      placeholder="Latitude"
                      required
                    />
                    <input
                      name="longitude"
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={handleChange}
                      className="w-full h-12 border-2 border-border rounded-md px-4 text-base focus:border-primary focus:ring-2 focus:ring-secondary/50 outline-none bg-white text-primary"
                      placeholder="Longitude"
                      required
                    />
                  </div>
                  <div className="rounded-lg overflow-hidden border-2 border-border">
                    <Map
                      {...viewState}
                      onMove={onMove}
                      mapboxAccessToken={MAPBOX_TOKEN}
                      mapStyle={MAPBOX_STYLE}
                      style={{ width: '100%', height: '300px' }}
                      reuseMaps
                    >
                      <Marker
                        longitude={formData.longitude}
                        latitude={formData.latitude}
                        anchor="bottom"
                        draggable
                        onDragEnd={handleMarkerDragEnd}
                      >
                        <div className="w-8 h-8 bg-secondary rounded-full border-4 border-primary cursor-move"></div>
                      </Marker>
                    </Map>
                  </div>
                  <p className="text-sm text-primary/70 mt-2">
                    Drag marker or enter coordinates to set location
                  </p>
                </div>
              </div>

              {/* Submit */}
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 bg-background border-2 border-border text-primary hover:bg-primary/5 h-12 px-8 rounded-full font-bold text-base transition-transform active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-12 px-8 rounded-full font-bold text-base border-2 border-primary transition-transform active:scale-95 flex items-center justify-center gap-2"
                  data-testid="save-button"
                >
                  <Save className="w-5 h-5" strokeWidth={2} />
                  {editingVendor ? 'Update Vendor' : 'Create Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
