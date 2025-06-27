import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { AiTool } from '../types';

interface CategoryChartProps {
  data: AiTool[];
}

const CHART_COLORS = [
    'rgba(56, 189, 248, 0.7)', // sky-400
    'rgba(251, 146, 60, 0.7)', // orange-400
    'rgba(74, 222, 128, 0.7)', // green-400
    'rgba(167, 139, 250, 0.7)', // violet-400
    'rgba(251, 113, 133, 0.7)', // rose-400
    'rgba(250, 204, 21, 0.7)' // yellow-400
];

export const CategoryChart: React.FC<CategoryChartProps> = ({ data }) => {
  const chartData = useMemo(() => {
    const categoryRatings = data.reduce((acc, tool) => {
      if (!acc[tool.category]) {
        acc[tool.category] = { total: 0, count: 0 };
      }
      acc[tool.category].total += tool.rating;
      acc[tool.category].count++;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    return Object.entries(categoryRatings)
        .map(([name, { total, count }]) => ({
            name,
            avgRating: parseFloat((total / count).toFixed(2)),
        }))
        .sort((a, b) => a.avgRating - b.avgRating); // Sort for better visual flow
  }, [data]);

  const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 text-white p-3 rounded-lg shadow-lg">
          <p className="font-bold">{label}</p>
          <p className="text-sm">평균 별점: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 5, right: 20, left: 100, bottom: 5 }}
      >
        <XAxis type="number" domain={[0, 5]} stroke="#64748b" />
        <YAxis 
          type="category" 
          dataKey="name" 
          width={100} 
          tick={{ fill: '#334155', fontSize: 12 }} 
          axisLine={false} 
          tickLine={false} 
          />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }} />
        <Bar dataKey="avgRating" radius={[0, 5, 5, 0]}>
            {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
