import { Link, useLocation } from 'react-router-dom';
import { UtensilsCrossed, Menu, X, LogOut, UserCircle } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();

  const links = [
    { to: '/', label: 'Home' },
    { to: '/find-food', label: 'Find Food' },
    { to: '/donate-food', label: 'Donate Food' },
    { to: '/dashboard', label: 'Dashboard' },
  ];

  const isActive = (to: string) => (to === '/' ? location.pathname === '/' : location.pathname.startsWith(to));

  const handleSignOut = async () => {
    await signOut();
    setMobileOpen(false);
  };

  const userEmail = user?.email ?? '';

  return (
    <header className="sticky top-0 z-50 bg-cream-50/85 backdrop-blur-lg border-b border-sage-200/60">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 text-forest-700 font-bold text-xl group" onClick={() => setMobileOpen(false)}>
          <div className="w-9 h-9 rounded-xl bg-forest-600 flex items-center justify-center text-white group-hover:bg-forest-700 transition-colors">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <span className="font-display">SharePlate</span>
        </Link>

        <ul className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <li key={l.to}>
              <Link
                to={l.to}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  isActive(l.to)
                    ? 'text-forest-700 bg-forest-50'
                    : 'text-stone-600 hover:text-forest-700 hover:bg-sage-50'
                }`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <div className="flex items-center gap-2 text-stone-600 text-sm max-w-[200px]">
                <UserCircle className="w-5 h-5 text-forest-600 flex-shrink-0" />
                <span className="truncate">{userEmail}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 text-stone-600 font-medium hover:text-red-600 transition-colors px-3 py-2 rounded-lg hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 bg-forest-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-forest-700 transition-all shadow-soft"
            >
              <UserCircle className="w-4 h-4" />
              Sign In
            </Link>
          )}
        </div>

        <button
          className="md:hidden p-2 text-stone-700 hover:text-forest-700 rounded-lg hover:bg-sage-50 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="md:hidden bg-cream-50 border-t border-sage-200/60 px-4 py-4 space-y-1 animate-slide-up">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`block py-2.5 px-3 rounded-lg font-medium transition-colors ${
                isActive(l.to) ? 'text-forest-700 bg-forest-50' : 'text-stone-600 hover:bg-sage-50'
              }`}
              onClick={() => setMobileOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-3 mt-2 border-t border-sage-200/60">
            {user ? (
              <>
                <div className="flex items-center gap-2 py-2.5 px-3 text-stone-600 text-sm">
                  <UserCircle className="w-5 h-5 text-forest-600" />
                  <span className="truncate">{userEmail}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 py-2.5 px-3 w-full text-left text-stone-600 font-medium hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="block py-2.5 px-3 text-forest-700 font-semibold hover:bg-forest-50 rounded-lg transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Sign In / Register
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
