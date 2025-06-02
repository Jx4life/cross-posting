
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log('Auth component mounted, location:', location);
    
    // Check URL parameters and hash for reset mode
    const urlParams = new URLSearchParams(location.search);
    const hashParams = new URLSearchParams(location.hash.substring(1));
    
    const isResetFromQuery = urlParams.get('mode') === 'reset';
    const hasAccessToken = hashParams.get('access_token');
    const hasRefreshToken = hashParams.get('refresh_token');
    const type = hashParams.get('type');
    
    console.log('Auth Debug - URL params:', urlParams.toString());
    console.log('Auth Debug - Hash params:', hashParams.toString());
    console.log('Auth Debug - Type:', type);
    console.log('Auth Debug - Reset from query:', isResetFromQuery);
    console.log('Auth Debug - Has tokens:', { hasAccessToken: !!hasAccessToken, hasRefreshToken: !!hasRefreshToken });
    
    if (isResetFromQuery || (type === 'recovery' && hasAccessToken && hasRefreshToken)) {
      console.log('Auth Debug - Activating password reset mode');
      setIsResetMode(true);
      
      // If we have tokens in the hash, set the session
      if (hasAccessToken && hasRefreshToken) {
        console.log('Auth Debug - Setting session with tokens');
        supabase.auth.setSession({
          access_token: hashParams.get('access_token')!,
          refresh_token: hashParams.get('refresh_token')!,
        }).then(({ error }) => {
          if (error) {
            console.error('Auth Debug - Error setting session:', error);
            toast.error('Invalid or expired reset link');
            setIsResetMode(false);
          } else {
            console.log('Auth Debug - Session set successfully');
          }
        });
      }
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Auth Debug - Form submitted, mode:', { isLogin, isForgotPassword });
    setIsLoading(true);

    try {
      if (isForgotPassword) {
        console.log('Auth Debug - Sending password reset email to:', email);
        const redirectUrl = `${window.location.origin}/auth?mode=reset`;
        console.log('Auth Debug - Redirect URL:', redirectUrl);
        
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectUrl,
        });
        
        if (error) {
          console.error('Auth Debug - Password reset error:', error);
          throw error;
        }
        
        console.log('Auth Debug - Password reset email sent successfully');
        toast.success("Password reset email sent! Check your inbox.");
        setIsForgotPassword(false);
      } else if (isLogin) {
        console.log('Auth Debug - Attempting sign in for:', email);
        const { error, data } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          console.error('Auth Debug - Sign in error:', error);
          throw error;
        }
        
        console.log('Auth Debug - Sign in successful, user:', data.user?.id);
        navigate("/");
      } else {
        console.log('Auth Debug - Attempting sign up for:', email);
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });
        
        if (error) {
          console.error('Auth Debug - Sign up error:', error);
          throw error;
        }
        
        console.log('Auth Debug - Sign up response:', data);
        if (data.user && !data.session) {
          toast.success("Check your email to confirm your account!");
        } else if (data.session) {
          toast.success("Account created successfully!");
          navigate("/");
        }
      }
    } catch (error: any) {
      console.error('Auth Debug - Catch block error:', error);
      toast.error(error.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Auth Debug - Password reset form submitted');
    
    if (password !== confirmPassword) {
      console.log('Auth Debug - Password mismatch');
      toast.error("Passwords don't match");
      return;
    }

    if (password.length < 6) {
      console.log('Auth Debug - Password too short');
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    console.log('Auth Debug - Updating password');

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) {
        console.error('Auth Debug - Password update error:', error);
        throw error;
      }
      
      console.log('Auth Debug - Password updated successfully');
      toast.success("Password updated successfully!");
      navigate("/");
    } catch (error: any) {
      console.error('Auth Debug - Password reset catch error:', error);
      toast.error(error.message || "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  console.log('Auth Debug - Current state:', {
    isResetMode,
    isLogin,
    isForgotPassword,
    isLoading,
    hasEmail: !!email,
    hasPassword: !!password
  });

  if (isResetMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1A1F2C] to-[#2C1A2F] flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 bg-white/5 backdrop-blur-sm border-purple-500/20">
          <h1 className="text-2xl font-bold text-center mb-6 text-white">
            Reset Your Password
          </h1>
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-white/10 border-purple-500/20 text-white placeholder:text-gray-400"
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="bg-white/10 border-purple-500/20 text-white placeholder:text-gray-400"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : "Update Password"}
            </Button>
          </form>
          <p className="text-center mt-4 text-sm text-gray-400">
            <button
              onClick={() => {
                console.log('Auth Debug - Back to sign in clicked');
                setIsResetMode(false);
                navigate('/auth');
              }}
              className="text-purple-400 hover:text-purple-300"
            >
              Back to Sign In
            </button>
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1F2C] to-[#2C1A2F] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 bg-white/5 backdrop-blur-sm border-purple-500/20">
        <h1 className="text-2xl font-bold text-center mb-6 text-white">
          {isForgotPassword 
            ? "Reset Password" 
            : isLogin 
            ? "Welcome Back" 
            : "Create Account"}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white/10 border-purple-500/20 text-white placeholder:text-gray-400"
            />
          </div>
          {!isForgotPassword && (
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/10 border-purple-500/20 text-white placeholder:text-gray-400"
              />
            </div>
          )}
          <Button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={isLoading}
          >
            {isLoading
              ? "Loading..."
              : isForgotPassword
              ? "Send Reset Email"
              : isLogin
              ? "Sign In"
              : "Create Account"}
          </Button>
        </form>
        
        {!isForgotPassword && (
          <>
            {isLogin && (
              <div className="text-center mt-4">
                <button
                  onClick={() => {
                    console.log('Auth Debug - Forgot password clicked');
                    setIsForgotPassword(true);
                  }}
                  className="text-sm text-purple-400 hover:text-purple-300"
                >
                  Forgot your password?
                </button>
              </div>
            )}
            <p className="text-center mt-4 text-sm text-gray-400">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => {
                  console.log('Auth Debug - Toggle login/signup:', !isLogin);
                  setIsLogin(!isLogin);
                }}
                className="text-purple-400 hover:text-purple-300"
              >
                {isLogin ? "Sign Up" : "Sign In"}
              </button>
            </p>
          </>
        )}
        
        {isForgotPassword && (
          <p className="text-center mt-4 text-sm text-gray-400">
            Remember your password?{" "}
            <button
              onClick={() => {
                console.log('Auth Debug - Back to sign in from forgot password');
                setIsForgotPassword(false);
              }}
              className="text-purple-400 hover:text-purple-300"
            >
              Back to Sign In
            </button>
          </p>
        )}
      </Card>
    </div>
  );
}
