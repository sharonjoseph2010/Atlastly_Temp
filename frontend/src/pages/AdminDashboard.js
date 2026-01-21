import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../utils/api';
import { LogOut, Shield, Eye, EyeOff, MapPin, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    loadVendors();
  }, [user, navigate]);

  const loadVendors = async () => {
    try {
      const response = await adminAPI.getAllVendors(user.token);
      setVendors(response.data);
    } catch (error) {
      console.error('Error loading vendors:', error);
      setMessage({ type: 'error', text: 'Failed to load vendors' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (vendorId, currentStatus) => {
    try {
      await adminAPI.updateVendor(
        vendorId,
        { is_active: !currentStatus },
        user.token
      );
      setVendors(prev =>
        prev.map(v =>
          v.vendor_id === vendorId ? { ...v, is_active: !currentStatus } : v
        )
      );
      setMessage({
        type: 'success',
        text: `Vendor ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update vendor status' });
    }
  };

  const handleDelete = async (vendorId) => {
    if (!window.confirm('Are you sure you want to delete this vendor?')) {
      return;
    }

    try {
      await adminAPI.deleteVendor(vendorId, user.token);
      setVendors(prev => prev.filter(v => v.vendor_id !== vendorId));
      setMessage({ type: 'success', text: 'Vendor deleted successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete vendor' });
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface border-b-2 border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" strokeWidth={2} />
          <h1 className="text-2xl md:text-3xl font-bold text-primary">Admin Dashboard</h1>
        </div>
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
        <div className="max-w-7xl mx-auto">
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

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
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

          {/* Vendors List */}
          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-6">Manage Vendors</h2>
          
          {vendors.length === 0 ? (
            <div className="bg-surface border-2 border-border rounded-lg p-8 text-center">
              <p className="text-lg text-primary">No vendors registered yet</p>
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
                    {/* Vendor Info */}
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
                      <div className="space-y-1">
                        <p className="text-base text-primary">
                          <strong>Phone:</strong> {vendor.phone}
                        </p>
                        <p className="text-base text-primary">
                          <strong>Address:</strong> {vendor.address}, {vendor.city}
                        </p>
                        {vendor.external_link && (
                          <p className="text-base text-primary">
                            <strong>Website:</strong>{' '}
                            <a
                              href={vendor.external_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary underline hover:text-primary/80"
                            >
                              {vendor.external_link}
                            </a>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex md:flex-col gap-2">
                      <button
                        onClick={() => handleToggleActive(vendor.vendor_id, vendor.is_active)}
                        className={`flex items-center gap-2 h-12 px-6 rounded-full font-bold text-base transition-transform active:scale-95 ${
                          vendor.is_active
                            ? 'bg-error/10 border-2 border-error text-error hover:bg-error/20'
                            : 'bg-success/10 border-2 border-success text-success hover:bg-success/20'
                        }`}
                        data-testid={`toggle-active-${vendor.vendor_id}`}
                      >
                        {vendor.is_active ? (
                          <><EyeOff className="w-5 h-5" strokeWidth={2} /> Deactivate</>
                        ) : (
                          <><Eye className="w-5 h-5" strokeWidth={2} /> Activate</>
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleDelete(vendor.vendor_id)}
                        className="flex items-center gap-2 bg-error text-error-foreground hover:bg-error/90 h-12 px-6 rounded-full font-bold text-base transition-transform active:scale-95"
                        data-testid={`delete-${vendor.vendor_id}`}
                      >
                        <Trash2 className="w-5 h-5" strokeWidth={2} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}