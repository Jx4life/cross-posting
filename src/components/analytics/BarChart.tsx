
import React from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BarChartProps {
  data: any[];
}

export const AnalyticsBarChart: React.FC<BarChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart data={data}>
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
        <Bar dataKey="likes" fill="#8884d8" name="Likes" />
        <Bar dataKey="shares" fill="#82ca9d" name="Shares" />
        <Bar dataKey="comments" fill="#ffc658" name="Comments" />
        <Legend />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};
