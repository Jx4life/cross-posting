
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?mode=reset`,
        });
        if (error) throw error;
        toast.success("Password reset email sent! Check your inbox.");
        setIsForgotPassword(false);
      } else if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account!");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) throw error;
      
      toast.success("Password updated successfully!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if we're in password reset mode
  const urlParams = new URLSearchParams(window.location.search);
  const isResetMode = urlParams.get('mode') === 'reset';

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
                className="bg-white/10 border-purple-500/20 text-white"
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
                className="bg-white/10 border-purple-500/20 text-white"
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
              className="bg-white/10 border-purple-500/20 text-white"
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
                className="bg-white/10 border-purple-500/20 text-white"
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
                  onClick={() => setIsForgotPassword(true)}
                  className="text-sm text-purple-400 hover:text-purple-300"
                >
                  Forgot your password?
                </button>
              </div>
            )}
            <p className="text-center mt-4 text-sm text-gray-400">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setIsLogin(!isLogin)}
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
              onClick={() => setIsForgotPassword(false)}
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
