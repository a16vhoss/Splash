'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { assignServiceColors } from '@/lib/analytics-colors';

interface SeriesPoint {
  period: string;
  periodLabel: string;
  byService: Record<string, { units: number; revenue: number }>;
}

interface StackedServicesChartProps {
  series: SeriesPoint[];
}

export function StackedServicesChart({ series }: StackedServicesChartProps) {
  const { chartData, serviceNames, colors } = useMemo(() => {
    const names = new Set<string>();
    for (const point of series) {
      for (const name of Object.keys(point.byService)) {
        names.add(name);
      }
    }
    const serviceNames = Array.from(names).sort((a, b) => a.localeCompare(b, 'es'));
    const colors = assignServiceColors(serviceNames);
    const chartData = series.map((point) => {
      const row: Record<string, string | number> = {
        periodLabel: point.periodLabel,
      };
      for (const name of serviceNames) {
        row[name] = point.byService[name]?.units ?? 0;
      }
      return row;
    });
    return { chartData, serviceNames, colors };
  }, [series]);

  if (series.length === 0 || serviceNames.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
        Sin datos
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis
            dataKey="periodLabel"
            tick={{ fontSize: 11, fill: '#64748B' }}
            axisLine={{ stroke: '#E2E8F0' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#64748B' }}
            axisLine={{ stroke: '#E2E8F0' }}
            tickLine={false}
            width={40}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: '#0F172A', fontWeight: 600 }}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          {serviceNames.map((name) => (
            <Bar key={name} dataKey={name} stackId="services" fill={colors[name]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
