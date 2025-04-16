
import { PostComposer } from "@/components/PostComposer";

const Index = () => {
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
        </header>

        <main className="flex justify-center">
          <PostComposer />
        </main>
      </div>
    </div>
  );
};

export default Index;
