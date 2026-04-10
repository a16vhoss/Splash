'use client';

import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

export function Sparkline({ data, color = '#0284C7', height = 32 }: SparklineProps) {
  if (data.length === 0) {
    return <div style={{ height }} className="text-[10px] text-muted-foreground">—</div>;
  }
  const chartData = data.map((value, index) => ({ index, value }));
  // Ensure a non-zero min/max so a flat line still renders visibly
  const min = Math.min(...data);
  const max = Math.max(...data);
  const domain: [number, number] = min === max ? [min - 1, max + 1] : [min, max];

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <YAxis domain={domain} hide />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
