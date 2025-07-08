
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, FileText, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Navigation = () => {
  const location = useLocation();

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
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
