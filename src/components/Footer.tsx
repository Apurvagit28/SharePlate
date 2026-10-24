import { Link } from 'react-router-dom';
import { UtensilsCrossed, Heart, Mail, Phone, ShieldCheck, Leaf } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-forest-900 text-sage-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* About */}
          <div>
            <div className="flex items-center gap-2.5 text-white font-bold text-lg mb-4">
              <div className="w-9 h-9 rounded-xl bg-forest-600 flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <span className="font-display">SharePlate</span>
            </div>
            <p className="text-sm leading-relaxed text-sage-200/80">
              Good Food Deserves a Second Chance. We connect surplus food with people who
              need it, reducing waste and building a community of sharing.
            </p>
            <div className="flex items-center gap-2 mt-4 text-sage-300">
              <Leaf className="w-4 h-4" />
              <span className="text-xs font-medium">A community-driven initiative</span>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3 text-sage-200/80 hover:text-white transition-colors">
                <Mail className="w-4 h-4 text-forest-400" />
                hello@shareplate.org
              </li>
              <li className="flex items-center gap-3 text-sage-200/80 hover:text-white transition-colors">
                <Phone className="w-4 h-4 text-forest-400" />
                +1 (555) 123-4567
              </li>
              <li className="flex items-center gap-3 text-sage-200/80 hover:text-white transition-colors">
                <Heart className="w-4 h-4 text-forest-400" />
                A community-driven initiative
              </li>
            </ul>
          </div>

          {/* Food Safety */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-forest-400" />
              Food Safety
            </h3>
            <ul className="space-y-2.5 text-sm text-sage-200/70">
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-forest-400 mt-2 flex-shrink-0" />
                Always check allergen information before accepting food.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-forest-400 mt-2 flex-shrink-0" />
                Respect pickup deadlines — food safety depends on timely collection.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-forest-400 mt-2 flex-shrink-0" />
                Verify food suitability and condition at pickup.
              </li>
              <li>
                <Link to="/find-food" className="text-forest-400 hover:text-forest-300 font-medium">
                  Report a listing →
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-forest-800 text-center text-sm text-sage-300/60">
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
