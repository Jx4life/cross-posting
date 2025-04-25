
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from './ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { usePostAnalytics } from '@/hooks/usePostAnalytics';
import { Loader2, TrendingUp } from 'lucide-react';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { format } from 'date-fns';

export const PostAnalytics = () => {
  const { 
    analytics, 
    isLoading, 
    selectedPlatform, 
    setSelectedPlatform 
  } = usePostAnalytics();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  const processedAnalytics = analytics?.map(item => ({
    ...item,
    formattedDate: format(new Date(item.created_at), 'MMM d'),
    engagementScore: item.likes + item.shares + item.comments
  })) || [];

  const platformOptions = ['twitter', 'lens', 'farcaster'];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          <CardTitle>Post Performance Analytics</CardTitle>
        </div>
        <Select 
          value={selectedPlatform || ''} 
          onValueChange={(value) => setSelectedPlatform(value || null)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Platforms</SelectItem>
            {platformOptions.map(platform => (
              <SelectItem key={platform} value={platform}>
                {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {processedAnalytics.length === 0 ? (
          <p className="text-center text-gray-500">No analytics data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={processedAnalytics}>
              <XAxis dataKey="formattedDate" />
              <YAxis />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <Card className="p-4">
                        <div className="space-y-2">
                          <p><strong>Date:</strong> {data.formattedDate}</p>
                          <p><strong>Platform:</strong> {data.platform}</p>
                          <div className="flex gap-2">
                            <Badge variant="secondary">Likes: {data.likes}</Badge>
                            <Badge variant="secondary">Shares: {data.shares}</Badge>
                            <Badge variant="secondary">Comments: {data.comments}</Badge>
                          </div>
                        </div>
                      </Card>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="engagementScore" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default PostAnalytics;
