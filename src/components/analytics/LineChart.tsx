
import React from 'react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface LineChartProps {
  data: any[];
}

export const AnalyticsLineChart: React.FC<LineChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsLineChart data={data}>
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="likes" stroke="#8884d8" name="Likes" />
        <Line type="monotone" dataKey="shares" stroke="#82ca9d" name="Shares" />
        <Line type="monotone" dataKey="comments" stroke="#ffc658" name="Comments" />
        <Line type="monotone" dataKey="earnings" stroke="#00C49F" name="Earnings ($)" strokeWidth={2} />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
};
