
import React from 'react';
import NavigationMenu from './NavigationMenu';

const Header = () => {
  return (
    <header className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <div></div> {/* Empty div for flex alignment */}
        <NavigationMenu />
      </div>
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-purple-600 mb-3 font-heading tracking-tight">
          In<span className="text-purple-800">Sync</span>
        </h1>
        <p className="text-gray-600 md:text-lg max-w-2xl mx-auto leading-relaxed">
          Synchronize your content across multiple social media platforms with one click.
          <span className="block mt-1 font-medium">Write once, share everywhere.</span>
        </p>
      </div>
    </header>
  );
};

export default Header;
