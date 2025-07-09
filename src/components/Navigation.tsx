
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { BookOpen, List, MessageCircle, LogOut, Home } from 'lucide-react';

const Navigation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div 
              className="flex items-center cursor-pointer" 
              onClick={() => navigate('/')}
            >
              <BookOpen className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-xl font-bold text-gray-900">ScholarMate</span>
            </div>
            
            {user && (
              <div className="hidden md:flex space-x-4">
                <Button
                  variant={isActive('/') ? "default" : "ghost"}
                  onClick={() => navigate('/')}
                  className="flex items-center"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
                <Button
                  variant={isActive('/my-lists') ? "default" : "ghost"}
                  onClick={() => navigate('/my-lists')}
                  className="flex items-center"
                >
                  <List className="h-4 w-4 mr-2" />
                  My Lists
                </Button>
                <Button
                  variant={isActive('/research-chat') ? "default" : "ghost"}
                  onClick={() => navigate('/research-chat')}
                  className="flex items-center"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Research Chat
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700 hidden sm:block">
                  Welcome, {user.user_metadata?.full_name || user.email}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => navigate('/auth')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
