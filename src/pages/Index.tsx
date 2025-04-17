
import { PostComposer } from "@/components/PostComposer";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1A1F2C] to-[#2C1A2F] text-white">
        <div className="container mx-auto px-4 py-8">
          <header className="text-center mb-12">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
              Cross Post Hub
            </h1>
            <p className="text-gray-400 mt-2">
              Share your content across Web2 and Web3 platforms
            </p>
            <Button 
              onClick={() => navigate("/auth")}
              className="mt-6 bg-purple-600 hover:bg-purple-700"
            >
              Sign In to Get Started
            </Button>
          </header>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1F2C] to-[#2C1A2F] text-white">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => navigate("/profile")}
              variant="outline"
              className="mr-2"
            >
              Profile
            </Button>
          </div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
            Cross Post Hub
          </h1>
          <p className="text-gray-400 mt-2">
            Share your content across Web2 and Web3 platforms
          </p>
        </header>

        <main className="flex justify-center">
          <PostComposer />
        </main>
      </div>
    </div>
  );
}; // Added the missing closing brace here

export default Index;
