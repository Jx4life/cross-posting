
import { useState, useEffect } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ProfileImageUploader } from "@/components/media/ProfileImageUploader";

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (user) {
      getProfile();
    }
  }, [user]);

  async function getProfile() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("username, avatar_url, bio")
        .eq("id", user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setUsername(data.username || "");
        setAvatarUrl(data.avatar_url || "");
        setBio(data.bio || "");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile() {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user?.id,
          username,
          bio,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  const handleAvatarUploaded = (url: string) => {
    setAvatarUrl(url);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1F2C] to-[#2C1A2F] text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              className="text-white hover:bg-white/10" 
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>
          
          <h1 className="text-3xl font-bold mb-8 text-center">Profile Settings</h1>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
            <div className="space-y-6">
              <div className="flex justify-center mb-6">
                <ProfileImageUploader 
                  currentAvatarUrl={avatarUrl} 
                  onImageUploaded={handleAvatarUploaded} 
                  username={username}
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" htmlFor="username">
                    Username
                  </label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-white/10 border-purple-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" htmlFor="bio">
                    Bio
                  </label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="bg-white/10 border-purple-500/20"
                    rows={4}
                  />
                </div>

                <Button
                  onClick={updateProfile}
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? "Saving..." : "Update Profile"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
