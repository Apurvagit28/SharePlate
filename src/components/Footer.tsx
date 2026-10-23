import { Link } from 'react-router-dom';
import { UtensilsCrossed, Heart, Mail, Phone, ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-stone-800 text-stone-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-lg mb-3">
              <UtensilsCrossed className="w-6 h-6 text-green-500" />
              SharePlate
            </div>
            <p className="text-sm leading-relaxed text-stone-400">
              Good Food Deserves a Second Chance. We connect surplus food with people who
              need it, reducing waste and building a community of sharing.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-3">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-green-500" />
                hello@shareplate.org
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-green-500" />
                +1 (555) 123-4567
              </li>
              <li className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-green-500" />
                A community-driven initiative
              </li>
            </ul>
          </div>

          {/* Food Safety */}
          <div>
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-500" />
              Food Safety
            </h3>
            <ul className="space-y-2 text-sm text-stone-400">
              <li>Always check allergen information before accepting food.</li>
              <li>Respect pickup deadlines — food safety depends on timely collection.</li>
              <li>Verify food suitability and condition at pickup.</li>
              <li>
                <Link to="/find-food" className="text-green-500 hover:underline">
                  Report a listing →
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-stone-700 text-center text-sm text-stone-500">
          <p>&copy; {new Date().getFullYear()} SharePlate. Built for a better, less wasteful world.</p>
          <p className="mt-2 text-xs">
            Statistics shown are demonstration data until calculated from real database records.
            SharePlate does not certify or inspect food — always verify suitability before consuming.
          </p>
        </div>
      </div>
    </footer>
  );
}
