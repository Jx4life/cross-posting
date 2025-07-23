import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { 
  User, 
  ExternalLink, 
  Check,
  Facebook,
  Building2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface FacebookPage {
  id: string;
  name: string;
  category: string;
  access_token?: string;
  tasks?: string[];
}

interface FacebookPageSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onPageSelected: (pageData: { pageId: string; pageAccessToken: string; pageName: string } | null) => void;
  userData?: {
    user: any;
    pages: FacebookPage[];
  };
}

export const FacebookPageSelector: React.FC<FacebookPageSelectorProps> = ({
  isOpen,
  onClose,
  onPageSelected,
  userData
}) => {
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [isPersonalSelected, setIsPersonalSelected] = useState(false);

  useEffect(() => {
    // Reset selection when dialog opens
    if (isOpen) {
      setSelectedPageId(null);
      setIsPersonalSelected(false);
    }
  }, [isOpen]);

  const handleSelectPersonal = () => {
    setSelectedPageId(null);
    setIsPersonalSelected(true);
  };

  const handleSelectPage = (pageId: string) => {
    setSelectedPageId(pageId);
    setIsPersonalSelected(false);
  };

  const handleConfirmSelection = () => {
    if (isPersonalSelected) {
      // Store personal account selection
      localStorage.setItem('facebookPostTarget', JSON.stringify({
        type: 'personal',
        userId: userData?.user?.id,
        userName: userData?.user?.name
      }));
      
      onPageSelected(null); // null indicates personal posting
      toast({
        title: "Personal Account Selected",
        description: "Posts will be shared to your personal Facebook timeline",
      });
    } else if (selectedPageId) {
      const selectedPage = userData?.pages.find(page => page.id === selectedPageId);
      if (selectedPage && selectedPage.access_token) {
        // Store page selection
        localStorage.setItem('facebookPostTarget', JSON.stringify({
          type: 'page',
          pageId: selectedPage.id,
          pageName: selectedPage.name,
          pageAccessToken: selectedPage.access_token
        }));
        
        onPageSelected({
          pageId: selectedPage.id,
          pageAccessToken: selectedPage.access_token,
          pageName: selectedPage.name
        });
        
        toast({
          title: "Facebook Page Selected",
          description: `Posts will be shared to ${selectedPage.name}`,
        });
      } else {
        toast({
          title: "Page Access Error", 
          description: "This page doesn't have the required permissions for posting",
          variant: "destructive"
        });
        return;
      }
    }
    
    onClose();
  };

  const getPagePermissions = (page: FacebookPage) => {
    const tasks = page.tasks || [];
    const canPost = tasks.includes('MANAGE') || tasks.includes('CREATE_CONTENT');
    return { canPost, tasks };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Facebook className="h-5 w-5 text-blue-600" />
            Choose Where to Post
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select where you'd like to share your posts on Facebook:
          </p>
          
          {/* Personal Account Option */}
          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${
              isPersonalSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}
            onClick={handleSelectPersonal}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Personal Timeline</h4>
                    <p className="text-sm text-muted-foreground">
                      {userData?.user?.name || 'Your personal Facebook account'}
                    </p>
                  </div>
                </div>
                {isPersonalSelected && (
                  <Check className="h-5 w-5 text-blue-600" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Facebook Pages */}
          {userData?.pages && userData.pages.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Facebook Pages</h4>
              {userData.pages.map((page) => {
                const { canPost } = getPagePermissions(page);
                const isSelected = selectedPageId === page.id;
                
                return (
                  <Card 
                    key={page.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                    } ${!canPost ? 'opacity-60' : ''}`}
                    onClick={() => canPost && handleSelectPage(page.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded-full">
                            <Building2 className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">{page.name}</h4>
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-muted-foreground">
                                {page.category}
                              </p>
                              {canPost ? (
                                <Badge variant="secondary" className="text-xs">
                                  Can Post
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs text-orange-600">
                                  Limited Access
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        {isSelected && canPost && (
                          <Check className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {(!userData?.pages || userData.pages.length === 0) && (
            <div className="text-center py-4">
              <ExternalLink className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No Facebook pages found. You can still post to your personal timeline.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmSelection}
              disabled={!isPersonalSelected && !selectedPageId}
              className="flex-1"
            >
              Confirm Selection
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};