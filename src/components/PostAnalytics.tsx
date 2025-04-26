import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter,
  CardDescription 
} from './ui/card';
import { usePostAnalytics } from '@/hooks/usePostAnalytics';
import { Loader2, TrendingUp, Download } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { format } from 'date-fns';
import { Button } from './ui/button';
import { DateRangePicker } from './DateRangePicker';
import { AnalyticsBarChart } from './analytics/BarChart';
import { AnalyticsLineChart } from './analytics/LineChart';
import { AnalyticsPieChart } from './analytics/PieChart';

const PostAnalytics = () => {
  const { 
    analytics, 
    isLoading, 
    selectedPlatform, 
    setSelectedPlatform,
    dateRange,
    setDateRange,
    aggregatedMetrics,
    platformBreakdown
  } = usePostAnalytics();
  
  const [chartType, setChartType] = useState<string>('bar');

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
  
  const timelineData = processedAnalytics.reduce((acc, item) => {
    const date = item.formattedDate;
    const existing = acc.find(x => x.date === date);
    
    if (existing) {
      existing.engagementScore += item.engagementScore;
      existing.likes += item.likes || 0;
      existing.shares += item.shares || 0;
      existing.comments += item.comments || 0;
    } else {
      acc.push({
        date,
        engagementScore: item.engagementScore,
        likes: item.likes || 0,
        shares: item.shares || 0,
        comments: item.comments || 0
      });
    }
    
    return acc;
  }, [] as any[]).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const platformData = platformBreakdown ? Object.keys(platformBreakdown).map(key => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value: platformBreakdown[key].count
  })) : [];
  
  const exportToCSV = () => {
    if (!analytics || analytics.length === 0) return;
    
    const headers = "Date,Platform,Likes,Shares,Comments,Impressions,Engagement Rate\n";
    const csvContent = analytics.map(item => 
      `${format(new Date(item.created_at), 'yyyy-MM-dd')},${item.platform},${item.likes || 0},${item.shares || 0},${item.comments || 0},${item.impressions || 0},${item.engagement_rate || 0}`
    ).join("\n");
    
    const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `post_analytics_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            <div>
              <CardTitle>Post Performance Analytics</CardTitle>
              <CardDescription>
                Analyze your post performance across platforms
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-3">
            <DateRangePicker 
              dateRange={dateRange}
              onDateRangeChange={(range) => {
                if (range?.from && range?.to) {
                  setDateRange({ from: range.from, to: range.to });
                }
              }} 
            />
            <Select 
              value={selectedPlatform || 'all'} 
              onValueChange={(value) => setSelectedPlatform(value === 'all' ? null : value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                {platformOptions.map(platform => (
                  <SelectItem key={platform} value={platform}>
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-8">
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
              <div className="text-sm text-slate-500 dark:text-slate-400">Posts</div>
              <div className="text-2xl font-bold">{aggregatedMetrics.postCount}</div>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
              <div className="text-sm text-slate-500 dark:text-slate-400">Likes</div>
              <div className="text-2xl font-bold">{aggregatedMetrics.totalLikes}</div>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
              <div className="text-sm text-slate-500 dark:text-slate-400">Shares</div>
              <div className="text-2xl font-bold">{aggregatedMetrics.totalShares}</div>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
              <div className="text-sm text-slate-500 dark:text-slate-400">Comments</div>
              <div className="text-2xl font-bold">{aggregatedMetrics.totalComments}</div>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
              <div className="text-sm text-slate-500 dark:text-slate-400">Impressions</div>
              <div className="text-2xl font-bold">{aggregatedMetrics.totalImpressions}</div>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
              <div className="text-sm text-slate-500 dark:text-slate-400">Avg. Engagement</div>
              <div className="text-2xl font-bold">{aggregatedMetrics.averageEngagement}%</div>
            </div>
          </div>
          
          <Tabs defaultValue="bar" onValueChange={setChartType}>
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="bar">Bar Chart</TabsTrigger>
                <TabsTrigger value="line">Line Chart</TabsTrigger>
                <TabsTrigger value="pie">Platform Distribution</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="bar" className="h-[400px]">
              <AnalyticsBarChart data={processedAnalytics} />
            </TabsContent>
            
            <TabsContent value="line" className="h-[400px]">
              <AnalyticsLineChart data={timelineData} />
            </TabsContent>
            
            <TabsContent value="pie" className="h-[400px]">
              {platformData.length > 0 ? (
                <AnalyticsPieChart data={platformData} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">No platform data available</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="flex justify-end text-sm text-gray-500">
          {analytics && analytics.length > 0 && (
            <p>Showing data from {format(new Date(dateRange.from), 'MMM d, yyyy')} to {format(new Date(dateRange.to), 'MMM d, yyyy')}</p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default PostAnalytics;
