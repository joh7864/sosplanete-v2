'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GlassCard } from '@/components/ui/GlassCard';

interface ChartPoint {
  name: string;
  actions: number;
  date: string;
}

interface TrackingChartsProps {
  chartData: ChartPoint[];
}

export function TrackingCharts({ chartData }: TrackingChartsProps) {
  return (
    <GlassCard className="p-8">
      <h2 className="text-xl font-black text-slate-800 mb-8">Évolution Hebdomadaire Globale</h2>
      <div className="h-[350px] w-full overflow-hidden">
        <ResponsiveContainer width="99%" height="100%" minWidth={1} minHeight={1}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorActions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '16px',
                border: 'none',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                padding: '12px'
              }}
              labelStyle={{ fontWeight: 900, marginBottom: '4px', color: '#1e293b' }}
            />
            <Area
              type="monotone"
              dataKey="actions"
              stroke="#10b981"
              strokeWidth={4}
              fillOpacity={1}
              fill="url(#colorActions)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
