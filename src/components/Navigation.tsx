
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, FileText, MessageCircle, List, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const Navigation = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <nav className="bg-white/90 backdrop-blur-sm border-b border-gray-200 px-4 py-3">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <BookOpen className="h-8 w-8 text-blue-600 mr-2" />
          <span className="text-xl font-bold text-gray-900">ScholarMate</span>
        </Link>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={location.pathname === '/' ? 'default' : 'ghost'}
            asChild
          >
            <Link to="/">
              <BookOpen className="h-4 w-4 mr-2" />
              Search
            </Link>
          </Button>
          
          {user && (
            <>
              <Button
                variant={location.pathname === '/my-lists' || location.pathname.startsWith('/list/') ? 'default' : 'ghost'}
                asChild
              >
                <Link to="/my-lists">
                  <List className="h-4 w-4 mr-2" />
                  My Lists
                </Link>
              </Button>
              
              <Button
                variant={location.pathname === '/saved-papers' ? 'default' : 'ghost'}
                asChild
              >
                <Link to="/saved-papers">
                  <FileText className="h-4 w-4 mr-2" />
                  Saved Papers
                </Link>
              </Button>
              
              <Button
                variant={location.pathname === '/research-chat' ? 'default' : 'ghost'}
                asChild
              >
                <Link to="/research-chat">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Research Chat
                </Link>
              </Button>

              <Button
                variant="ghost"
                onClick={signOut}
                className="text-red-600 hover:text-red-800"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </>
          )}
          
          {!user && (
            <Button asChild>
              <Link to="/auth">
                Sign In
              </Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
