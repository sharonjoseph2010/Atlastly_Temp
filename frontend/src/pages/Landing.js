import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Store, Calendar, Map as MapIcon, Filter, Sparkles,
  Camera, Utensils, ArrowRight, Search, ThumbsUp,
} from 'lucide-react';

// A small inline badge-pill used to accent words inside the headline
const Pill = ({ children, icon: Icon, variant = 'primary' }) => {
  const styles = {
    primary: 'bg-primary text-primary-foreground border-primary',
    secondary: 'bg-secondary text-secondary-foreground border-primary',
    surface: 'bg-surface text-primary border-primary',
  }[variant];
  return (
    <span
      className={`inline-flex items-center gap-2 md:gap-3 px-4 md:px-6 py-1 md:py-2 rounded-full border-2 shadow-hard align-middle mx-1 ${styles}`}
    >
      {Icon && <Icon className="w-6 h-6 md:w-9 md:h-9" strokeWidth={2.5} />}
      {children}
    </span>
  );
};

// Sample vendor pill card shown over the mock map — mimics our VendorMarker style
const VendorPill = ({ name, category, icon: Icon, className = '' }) => (
  <div
    className={`absolute flex items-center gap-2 bg-surface border-2 border-primary rounded-full px-3 py-1.5 shadow-hard whitespace-nowrap ${className}`}
  >
    <span className="w-7 h-7 bg-secondary rounded-full flex items-center justify-center border-2 border-primary">
      <Icon className="w-4 h-4 text-primary" strokeWidth={2.5} />
    </span>
    <span className="text-sm font-bold text-primary">{name}</span>
    <span className="text-xs text-primary/60">· {category}</span>
  </div>
);

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* ===== Floating pill nav ===== */}
      <nav className="sticky top-4 md:top-6 z-30 flex justify-center px-4">
        <div className="flex items-center gap-1 md:gap-2 bg-surface border-2 border-border rounded-full shadow-hard p-1.5 md:p-2">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-3 md:px-4 h-10 md:h-11 font-black text-primary"
            data-testid="nav-logo"
          >
            <span className="w-7 h-7 md:w-8 md:h-8 bg-primary rounded-full flex items-center justify-center">
              <MapPin className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground" strokeWidth={2.5} />
            </span>
            <span className="hidden sm:inline">Atlastly</span>
          </button>
          <button
            onClick={() => navigate('/planner-auth')}
            className="h-10 md:h-11 px-3 md:px-5 rounded-full font-bold text-sm md:text-base text-primary hover:bg-primary/5 transition"
            data-testid="nav-plan-event"
          >
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" strokeWidth={2.5} /> Plan event
            </span>
          </button>
          <button
            onClick={() => navigate('/vendor-auth')}
            className="h-10 md:h-11 px-3 md:px-5 rounded-full font-bold text-sm md:text-base text-primary hover:bg-primary/5 transition"
            data-testid="nav-list-business"
          >
            <span className="flex items-center gap-2">
              <Store className="w-4 h-4" strokeWidth={2.5} /> List business
            </span>
          </button>
          <button
            onClick={() => navigate('/admin-auth')}
            className="h-10 md:h-11 px-4 md:px-5 rounded-full font-bold text-sm md:text-base bg-primary text-primary-foreground hover:bg-primary/90 transition flex items-center gap-2"
            data-testid="nav-login"
          >
            Login <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
      </nav>

      {/* ===== Hero ===== */}
      <section className="px-6 md:px-12 pt-16 md:pt-24 pb-8 md:pb-12">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-[5.5rem] font-black leading-[1.05] text-primary">
            <span className="block">
              Finding your next{' '}
              <Pill icon={Calendar} variant="surface">event</Pill>
            </span>
            <span className="block mt-2 md:mt-3 text-primary/50 font-bold">
              should be as easy as
            </span>
            <span className="block mt-2 md:mt-3">
              using a <Pill icon={MapIcon} variant="secondary">map</Pill>
            </span>
          </h1>

          <p className="mt-8 md:mt-10 text-lg md:text-xl text-primary max-w-2xl mx-auto leading-relaxed">
            A simple platform to discover local event service providers. Vendors list themselves. Planners find them by location. No middlemen.
          </p>

          {/* Primary CTAs — keep both roles front and centre */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate('/planner-auth')}
              className="h-14 px-8 rounded-full font-bold text-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-transform active:scale-95 flex items-center gap-2 w-full sm:w-auto justify-center"
              data-testid="hero-planner-btn"
            >
              <Search className="w-5 h-5" strokeWidth={2.5} />
              Find vendors
            </button>
            <button
              onClick={() => navigate('/vendor-auth')}
              className="h-14 px-8 rounded-full font-bold text-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 border-2 border-primary transition-transform active:scale-95 flex items-center gap-2 w-full sm:w-auto justify-center"
              data-testid="hero-vendor-btn"
            >
              <Store className="w-5 h-5" strokeWidth={2.5} />
              List your business
            </button>
          </div>
        </div>
      </section>

      {/* ===== Map preview card ===== */}
      <section className="px-6 md:px-12 pb-16 md:pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-3xl border-2 border-border shadow-hard overflow-hidden bg-gradient-to-br from-secondary/20 via-background to-secondary/10 h-[420px] md:h-[540px]">
            {/* Faux street map — subtle roads + grid */}
            <svg
              className="absolute inset-0 w-full h-full opacity-[0.18]"
              viewBox="0 0 1200 600"
              preserveAspectRatio="xMidYMid slice"
              aria-hidden
            >
              <defs>
                <pattern id="mg" width="48" height="48" patternUnits="userSpaceOnUse">
                  <path d="M 48 0 L 0 0 0 48" fill="none" stroke="currentColor" strokeWidth="0.6" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#mg)" className="text-primary" />
              {/* "Streets" */}
              <g stroke="currentColor" strokeLinecap="round" className="text-primary">
                <line x1="-20" y1="180" x2="1220" y2="140" strokeWidth="6" />
                <line x1="-20" y1="420" x2="1220" y2="460" strokeWidth="5" />
                <line x1="280" y1="-20" x2="340" y2="620" strokeWidth="6" />
                <line x1="820" y1="-20" x2="780" y2="620" strokeWidth="5" />
                <line x1="100" y1="300" x2="1100" y2="290" strokeWidth="3" />
                <line x1="540" y1="-20" x2="560" y2="620" strokeWidth="3" />
              </g>
              {/* "River" */}
              <path
                d="M -20 520 C 200 420, 400 600, 640 500 S 1000 400, 1220 480"
                fill="none"
                stroke="#2563eb"
                strokeOpacity="0.35"
                strokeWidth="28"
                strokeLinecap="round"
              />
              {/* "Park" blob */}
              <ellipse cx="970" cy="210" rx="120" ry="70" fill="#22c55e" fillOpacity="0.18" />
            </svg>

            {/* Soft map shapes */}
            <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-[40%] rotate-12" />
            <div className="absolute bottom-10 right-20 w-80 h-80 bg-secondary/20 rounded-[45%] -rotate-6" />

            {/* Floating vendor pills (sample) */}
            <VendorPill name="Foodlink" category="Catering" icon={Utensils} className="top-12 left-8 md:top-20 md:left-24" />
            <VendorPill name="Leela Palace" category="Venue" icon={MapPin} className="top-32 right-12 md:top-40 md:right-32" />
            <VendorPill name="Frame Studio" category="Photography" icon={Camera} className="bottom-24 left-16 md:bottom-36 md:left-40" />
            <VendorPill name="Blossom Decor" category="Decor" icon={Sparkles} className="bottom-10 right-8 md:bottom-20 md:right-24 hidden sm:flex" />

            {/* Center "you are here" beacon */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <div className="w-16 h-16 bg-secondary rounded-full border-[6px] border-primary shadow-hard" />
                <div className="absolute inset-0 w-16 h-16 rounded-full bg-secondary animate-ping opacity-30" />
              </div>
            </div>

            {/* Legend badge */}
            <div className="absolute top-4 left-4 bg-surface border-2 border-border rounded-full px-4 py-1.5 shadow-hard text-sm font-bold text-primary flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Live — vendors near you
            </div>
          </div>
        </div>
      </section>

      {/* ===== Feature 1: X marks the spot ===== */}
      <section className="px-6 md:px-12 py-16 md:py-24 bg-surface border-y-2 border-border">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-5xl font-black text-primary leading-tight">
              The shortlist is <span className="text-primary/40">already around the corner.</span>
            </h2>
            <p className="mt-6 text-lg text-primary leading-relaxed max-w-xl">
              Your next caterer probably works two blocks away. The florist you'd love to hire is three streets over. We put them on a map, so the people closest to your event stop being invisible.
            </p>
          </div>
          {/* Visual: stacked vendor pills on an abstract map */}
          <div className="relative h-80 md:h-96 rounded-3xl border-2 border-border shadow-hard bg-background overflow-hidden">
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }}
            />
            <VendorPill name="Foodlink" category="Catering" icon={Utensils} className="top-8 left-6" />
            <VendorPill name="Mumbai Caterers" category="Catering" icon={Utensils} className="top-24 right-6" />
            <VendorPill name="Frame Studio" category="Photography" icon={Camera} className="top-44 left-10" />
            <VendorPill name="Leela" category="Venue" icon={MapPin} className="bottom-20 right-8" />
            <VendorPill name="Blossom Decor" category="Decor" icon={Sparkles} className="bottom-6 left-16" />
          </div>
        </div>
      </section>

      {/* ===== Feature 2: Filter signal from noise ===== */}
      <section className="px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          {/* Visual FIRST on desktop */}
          <div className="order-2 md:order-1 relative h-80 md:h-96 rounded-3xl border-2 border-border shadow-hard bg-surface p-6 overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-primary" strokeWidth={2.5} />
              <span className="text-sm font-black text-primary uppercase tracking-wide">Filters</span>
            </div>
            <div className="space-y-2">
              {[
                { name: 'Venue', count: 48, active: true },
                { name: 'Catering', count: 32, active: false },
                { name: 'Photography', count: 27, active: true },
                { name: 'Decor', count: 19, active: false },
                { name: 'Makeup', count: 14, active: false },
                { name: 'Jewellery', count: 9, active: false },
              ].map((f) => (
                <div
                  key={f.name}
                  className={`flex items-center justify-between rounded-lg border-2 px-4 py-2.5 ${
                    f.active ? 'bg-secondary/30 border-primary' : 'bg-background border-border'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`w-4 h-4 rounded border-2 border-primary flex items-center justify-center ${
                        f.active ? 'bg-primary' : 'bg-surface'
                      }`}
                    >
                      {f.active && <ThumbsUp className="w-2.5 h-2.5 text-primary-foreground" strokeWidth={3} />}
                    </span>
                    <span className="font-bold text-primary">{f.name}</span>
                  </span>
                  <span className="text-sm text-primary/70 font-mono">{f.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-3xl md:text-5xl font-black text-primary leading-tight">
              Ten checkboxes. <span className="text-primary/40">Zero clutter.</span>
            </h2>
            <p className="mt-6 text-lg text-primary leading-relaxed max-w-xl">
              Pick the services you actually care about — venues, caterers, decor, makeup, rentals — and the map quietly fades the rest. No infinite scroll, no filter roulette. Just what you asked for.
            </p>
          </div>
        </div>
      </section>

      {/* ===== Testimonial chat bubble ===== */}
      <section className="px-6 md:px-12 py-16 md:py-24 bg-surface border-y-2 border-border">
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            {/* emoji reactions */}
            <div className="absolute -top-8 left-6 flex items-center gap-1 bg-surface border-2 border-border rounded-full px-3 py-1 shadow-hard text-lg">
              <span>👍</span><span>👏</span><span>❤️</span><span>🔥</span>
            </div>
            <div className="bg-secondary text-primary border-2 border-primary rounded-[32px] rounded-bl-lg p-6 md:p-8 shadow-hard">
              <p className="text-lg md:text-2xl font-medium italic leading-relaxed">
                "I found three decorators and a caterer near my venue in one afternoon. Usually takes me a week of phone calls and Instagram DMs. This just... worked."
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm text-primary/70 font-mono">
                <span>✓✓ Read</span><span>·</span><span>5:52 PM</span>
              </div>
            </div>
            <div className="mt-5 ml-4 flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-full border-2 border-border flex items-center justify-center text-primary-foreground font-black text-lg">
                S
              </div>
              <div>
                <p className="font-bold text-primary">Sandra T.</p>
                <p className="text-sm text-primary/70">Wedding Planner, Bengaluru</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Role Selection (existing cards, preserved text & testids) ===== */}
      <section className="px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black text-primary mb-3 text-center">
            Ready to start?
          </h2>
          <p className="text-lg text-primary/70 mb-12 text-center">
            What your event needs, right here.
          </p>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
            <div
              className="bg-surface border-2 border-border rounded-2xl p-6 md:p-8 shadow-hard hover:translate-y-[-4px] hover:shadow-hard-hover transition-all cursor-pointer"
              onClick={() => navigate('/planner-auth')}
              data-testid="planner-card"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-primary-foreground" strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-primary">Planning an Event</h3>
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

            <div
              className="bg-surface border-2 border-border rounded-2xl p-6 md:p-8 shadow-hard hover:translate-y-[-4px] hover:shadow-hard-hover transition-all cursor-pointer"
              onClick={() => navigate('/vendor-auth')}
              data-testid="vendor-card"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center border-2 border-primary">
                  <Store className="w-8 h-8 text-secondary-foreground" strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-primary">Provide Services</h3>
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

      {/* ===== How It Works (preserved) ===== */}
      <section className="px-6 md:px-12 py-12 md:py-16 bg-surface border-t-2 border-border">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-8 md:mb-12 text-center">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { n: 1, t: 'Search Location', p: 'Enter your event location or drop a pin on the map' },
              { n: 2, t: 'Browse Services', p: 'See nearby vendors on the map. Filter by service type' },
              { n: 3, t: 'Contact Directly', p: 'Get vendor contact details and reach out on your own terms' },
            ].map((s) => (
              <div key={s.n} className="text-center">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-hard">
                  <span className="text-3xl font-black text-primary-foreground">{s.n}</span>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-primary mb-3">{s.t}</h3>
                <p className="text-base md:text-lg leading-relaxed text-primary">{s.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Footer (preserved) ===== */}
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
