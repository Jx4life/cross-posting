import React from 'react';
import { Link } from 'react-router-dom';
import logo from '@/assets/logo.png';

const Footer = () => {
  return (
    <footer className="mt-16 py-8 border-t border-gray-700/50">
      <div className="container mx-auto px-4 text-center">
        <div className="flex justify-center items-center space-x-6 text-sm text-gray-400">
          <Link 
            to="/terms" 
            className="hover:text-purple-400 transition-colors"
          >
            Terms of Use
          </Link>
          <span className="text-gray-600">•</span>
          <Link 
            to="/privacy" 
            className="hover:text-purple-400 transition-colors"
          >
            Privacy Policy
          </Link>
          <span className="text-gray-600">•</span>
          <a 
            href="mailto:insyncreators@gmail.com" 
            className="hover:text-purple-400 transition-colors"
          >
            Contact
          </a>
        </div>
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
          <img src={logo} alt="InSync Logo" className="w-4 h-4" />
          <span>© 2025 InSync. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;