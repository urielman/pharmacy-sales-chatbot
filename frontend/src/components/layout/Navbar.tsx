import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo from '../../pharmesol-logo.png';
import { Button } from '../ui/button';
import { Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Directory', path: '/directory' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSimulateCall = () => {
    navigate('/chat?phone=+1-555-123-4567');
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center flex-shrink-0">
            <img
              src={logo}
              alt="Pharmesol"
              className="h-8 w-auto min-w-[120px]"
            />
          </Link>

          {/* Desktop Navigation Items */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-base font-medium transition-all duration-200 relative pb-1 ${
                  isActive(item.path)
                    ? 'text-[#fb923c] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#fb923c]'
                    : 'text-[#fb923c] hover:after:absolute hover:after:bottom-0 hover:after:left-0 hover:after:w-full hover:after:h-0.5 hover:after:bg-[#fb923c]'
                }`}
              >
                {item.label}
              </Link>
            ))}

            {/* Simulate a Call Button */}
            <Button
              className="bg-[#fb923c] hover:bg-[#f97316] text-white font-medium px-6 py-2 rounded-full transition-colors"
              onClick={handleSimulateCall}
            >
              Simulate a Call
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-[#fb923c] hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-3 border-t border-gray-200">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive(item.path)
                    ? 'text-[#fb923c] bg-orange-50'
                    : 'text-gray-700 hover:text-[#fb923c] hover:bg-gray-50'
                }`}
              >
                {item.label}
              </Link>
            ))}

            {/* Mobile Simulate a Call Button */}
            <Button
              className="w-full bg-[#fb923c] hover:bg-[#f97316] text-white font-medium px-6 py-2 rounded-full transition-colors"
              onClick={handleSimulateCall}
            >
              Simulate a Call
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};
