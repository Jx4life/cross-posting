
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, Settings, LogOut, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const NavigationMenu = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<{ avatar_url: string | null; username: string | null }>({
    avatar_url: null,
    username: null
  });

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_url, username")
        .eq("id", user?.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setProfileData({
          avatar_url: data.avatar_url,
          username: data.username
        });
      }
    } catch (error) {
      console.error("Error fetching profile data", error);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  return (
    <div className="flex items-center gap-4">
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full border border-purple-200 hover:bg-purple-100/50 p-0 overflow-hidden">
              {profileData.avatar_url ? (
                <Avatar className="h-9 w-9">
                  <AvatarImage src={profileData.avatar_url} />
                  <AvatarFallback className="bg-purple-100">
                    <User className="h-5 w-5 text-purple-700" />
                  </AvatarFallback>
                </Avatar>
              ) : (
                <User className="h-5 w-5 text-purple-700" />
              )}
              <span className="sr-only">User menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 overflow-hidden">
                {profileData.avatar_url ? (
                  <AvatarImage src={profileData.avatar_url} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-4 w-4 text-purple-700" />
                )}
              </div>
              <div className="flex flex-col space-y-0.5">
                <p className="text-sm font-medium">{profileData.username || user.email}</p>
                <p className="text-xs text-muted-foreground">Manage your account</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile" className="flex cursor-pointer items-center">
                <Settings className="mr-2 h-4 w-4" />
                <span>Profile Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/terms" className="flex cursor-pointer items-center">
                <FileText className="mr-2 h-4 w-4" />
                <span>Terms of Use</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button asChild variant="outline" size="sm" className="border-purple-200 hover:bg-purple-100/50 text-purple-700">
          <Link to="/auth">Sign In</Link>
        </Button>
      )}
    </div>
  );
};

export default NavigationMenu;
