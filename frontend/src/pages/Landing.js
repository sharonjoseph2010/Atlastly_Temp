import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Users, Store } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="px-6 md:px-12 py-12 md:py-24">
        <div className="max-w-6xl mx-auto">
          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none text-primary mb-6">
            Atlastly
          </h1>
          
          <p className="text-2xl md:text-3xl font-bold text-secondary mb-4">
            What your event needs, right here
          </p>
          
          <p className="text-lg md:text-xl leading-relaxed text-primary mb-12 max-w-2xl">
            A simple platform to discover local event service providers. Vendors list themselves. Planners find them by location. No middlemen.
          </p>

          {/* Role Selection Cards */}
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-4xl">
            {/* Planner Card */}
            <div
              className="bg-surface border-2 border-border rounded-lg p-6 md:p-8 shadow-hard hover:translate-y-[-4px] hover:shadow-hard-hover transition-all cursor-pointer"
              onClick={() => navigate('/planner-auth')}
              data-testid="planner-card"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-primary-foreground" strokeWidth={2.5} />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-primary">
                  Planning an Event
                </h2>
              </div>
              
              <p className="text-base md:text-lg leading-relaxed text-primary mb-6">
                Search for venues, caterers, photographers, and more on an interactive map. Find services near your event location.
              </p>
              
              <button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 rounded-full font-bold text-lg transition-transform active:scale-95 focus:ring-4 focus:ring-secondary"
                data-testid="get-started-planner-btn"
              >
                Get Started
              </button>
            </div>

            {/* Vendor Card */}
            <div
              className="bg-surface border-2 border-border rounded-lg p-6 md:p-8 shadow-hard hover:translate-y-[-4px] hover:shadow-hard-hover transition-all cursor-pointer"
              onClick={() => navigate('/vendor-auth')}
              data-testid="vendor-card"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center border-2 border-primary">
                  <Store className="w-8 h-8 text-secondary-foreground" strokeWidth={2.5} />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-primary">
                  Provide Services
                </h2>
              </div>
              
              <p className="text-base md:text-lg leading-relaxed text-primary mb-6">
                List your event service business for free. Pin your location on the map. Get discovered by local event planners.
              </p>
              
              <button
                className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 h-12 px-8 rounded-full font-bold text-lg border-2 border-primary transition-transform active:scale-95 focus:ring-4 focus:ring-primary"
                data-testid="get-started-vendor-btn"
              >
                List Your Business
              </button>
            </div>
          </div>

          {/* Admin Link */}
          <div className="mt-12 text-center">
            <button
              onClick={() => navigate('/admin-auth')}
              className="text-primary hover:text-primary/80 font-medium text-base underline"
              data-testid="admin-login-link"
            >
              Admin Login
            </button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-6 md:px-12 py-12 md:py-16 bg-surface">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-8 md:mb-12 text-center">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-black text-primary-foreground">1</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-primary mb-3">Search Location</h3>
              <p className="text-base md:text-lg leading-relaxed text-primary">
                Enter your event location or drop a pin on the map
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-black text-primary-foreground">2</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-primary mb-3">Browse Services</h3>
              <p className="text-base md:text-lg leading-relaxed text-primary">
                See nearby vendors on the map. Filter by service type
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-black text-primary-foreground">3</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-primary mb-3">Contact Directly</h3>
              <p className="text-base md:text-lg leading-relaxed text-primary">
                Get vendor contact details and reach out on your own terms
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-12 py-8 bg-primary text-primary-foreground">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-base md:text-lg">
            A platform for discovery. No bookings. No payments. No reviews.
          </p>
        </div>
      </footer>
    </div>
  );
}