import { Link } from 'react-router-dom';
import { UtensilsCrossed, Menu, X, LogOut, UserCircle } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();

  const links = [
    { to: '/', label: 'Home' },
    { to: '/find-food', label: 'Find Food' },
    { to: '/donate-food', label: 'Donate Food' },
    { to: '/dashboard', label: 'Dashboard' },
  ];

  const handleSignOut = async () => {
    await signOut();
    setMobileOpen(false);
  };

  const userEmail = user?.email ?? '';

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-stone-200 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-green-700 font-bold text-xl" onClick={() => setMobileOpen(false)}>
          <UtensilsCrossed className="w-7 h-7" />
          <span>SharePlate</span>
        </Link>

        <ul className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <li key={l.to}>
              <Link
                to={l.to}
                className="text-stone-700 font-medium hover:text-green-700 transition-colors"
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
                <UserCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="truncate">{userEmail}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 text-stone-600 font-medium hover:text-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-green-700 transition-colors"
            >
              <UserCircle className="w-4 h-4" />
              Sign In
            </Link>
          )}
        </div>

        <button
          className="md:hidden p-2 text-stone-700 hover:text-green-700"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-stone-200 px-4 py-3 space-y-2">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="block py-2 text-stone-700 font-medium hover:text-green-700 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-stone-200">
            {user ? (
              <>
                <div className="flex items-center gap-2 py-2 text-stone-600 text-sm">
                  <UserCircle className="w-5 h-5 text-green-600" />
                  <span className="truncate">{userEmail}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 py-2 text-stone-600 font-medium hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="block py-2 text-green-700 font-semibold hover:text-green-800 transition-colors"
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
