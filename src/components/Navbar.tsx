
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Bike, User, LogOut, Settings } from 'lucide-react';

const Navbar = () => {
  const { user, isAdmin, signOut } = useAuth();

  return (
    <nav className="bg-white shadow-md border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Bike className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Bikezy</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
              Home
            </Link>
            
            {user ? (
              <>
                <Link to="/bookings" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                  My Bookings
                </Link>
                
                {isAdmin && (
                  <Link to="/admin" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                    <Settings className="h-4 w-4 inline mr-1" />
                    Admin Panel
                  </Link>
                )}
                
                
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-gray-600" />
                  <span className="text-sm text-gray-600">{user.email}</span>
                  {isAdmin && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Admin</span>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={signOut}
                    className="ml-2"
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="default">Login / Sign Up</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
