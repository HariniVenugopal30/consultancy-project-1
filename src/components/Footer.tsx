import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">ColorBurst Paints</h3>
            <p className="text-gray-400">
              Premium paint solutions for residential and commercial projects.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <nav className="space-y-2">
              <Link href="/about" className="text-gray-400 hover:text-white">
                About Us
              </Link>
              <Link href="/products" className="text-gray-400 hover:text-white">
                Products
              </Link>
              <Link href="/portfolio" className="text-gray-400 hover:text-white">
                Portfolio
              </Link>
              <Link href="/contact" className="text-gray-400 hover:text-white">
                Contact
              </Link>
            </nav>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold mb-4">Contact</h3>
            <div className="space-y-3 text-gray-400">
              <div className="flex items-center space-x-2">
                <Phone size={18} />
                <span>1-800-PAINT-PRO</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail size={18} />
                <span>info@colorburst.com</span>
              </div>
              <div className="flex items-start space-x-2">
                <MapPin size={18} className="mt-1" />
                <span>123 Paint Street, Color City, CC 12345</span>
              </div>
            </div>
          </div>

          {/* Hours */}
          <div>
            <h3 className="text-lg font-bold mb-4">Business Hours</h3>
            <div className="text-gray-400 space-y-1 text-sm">
              <p>Mon - Fri: 8:00 AM - 6:00 PM</p>
              <p>Saturday: 9:00 AM - 5:00 PM</p>
              <p>Sunday: Closed</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 ColorBurst Paints. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="#" className="text-gray-400 hover:text-white text-sm">
                Privacy Policy
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white text-sm">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
