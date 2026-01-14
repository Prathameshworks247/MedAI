import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { motion } from "framer-motion";
import React from "react";
interface DataPoint {
  date: string;
  value: number;
  appointmentNumber: number;
}

interface TestTrendChartProps {
  testName: string;
  unit: string;
  normalRange: [number, number];
  data: DataPoint[];
}

export function TestTrendChart({
  testName,
  unit,
  normalRange,
  data,
}: TestTrendChartProps) {
  const chartData = data.map((point, idx) => ({
    ...point,
    isBaseline: idx === 0,
    formattedDate: new Date(point.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  const isAbnormal = (value: number) =>
    value < normalRange[0] || value > normalRange[1];

  const trend =
    data.length >= 2
      ? data[data.length - 1].value < data[0].value
        ? "decreasing"
        : data[data.length - 1].value > data[0].value
        ? "increasing"
        : "stable"
      : "stable";

  const trendConfig = {
    decreasing: { label: "↓ Decreasing", className: "bg-success-muted text-success" },
    increasing: { label: "↑ Increasing", className: "bg-danger-muted text-danger" },
    stable: { label: "→ Stable", className: "bg-muted text-muted-foreground" },
  };

  const change = data[data.length - 1].value - data[0].value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl shadow-lg p-6"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-card-foreground">{testName}</h3>
          <p className="text-sm text-muted-foreground">
            Normal range: {normalRange[0]}-{normalRange[1]} {unit}
          </p>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${trendConfig[trend].className}`}
        >
          {trendConfig[trend].label}
        </span>
      </div>

      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />

            <XAxis
              dataKey="formattedDate"
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              stroke="hsl(var(--border))"
              tickLine={false}
            />

            <YAxis
              domain={[
                Math.min(...data.map((d) => d.value), normalRange[0]) - 1,
                Math.max(...data.map((d) => d.value), normalRange[1]) + 1,
              ]}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              stroke="hsl(var(--border))"
              tickLine={false}
              axisLine={false}
            />

            <ReferenceLine
              y={normalRange[0]}
              stroke="hsl(var(--success))"
              strokeDasharray="5 5"
              strokeOpacity={0.5}
            />
            <ReferenceLine
              y={normalRange[1]}
              stroke="hsl(var(--success))"
              strokeDasharray="5 5"
              strokeOpacity={0.5}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const point = payload[0].payload;
                  return (
                    <div className="bg-popover p-3 shadow-lg rounded-lg border border-border">
                      <p className="font-bold text-popover-foreground">
                        {point.formattedDate}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Appointment #{point.appointmentNumber}
                      </p>
                      <p
                        className={`text-lg font-bold ${
                          isAbnormal(point.value)
                            ? "text-danger"
                            : "text-success"
                        }`}
                      >
                        {point.value} {unit}
                      </p>
                      {point.isBaseline && (
                        <p className="text-xs text-primary mt-1">📌 Baseline</p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />

            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={({ cx, cy, payload }) => {
                const abnormal = isAbnormal(payload.value);
                return (
                  <circle
                    key={payload.date}
                    cx={cx}
                    cy={cy}
                    r={payload.isBaseline ? 8 : 6}
                    fill={abnormal ? "hsl(var(--danger))" : "hsl(var(--success))"}
                    stroke="hsl(var(--card))"
                    strokeWidth={2}
                  />
                );
              }}
              activeDot={{ r: 8, fill: "hsl(var(--primary))" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Value comparison */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center border-t border-border pt-4">
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">
            Baseline
          </div>
          <div className="text-xl font-bold text-card-foreground">
            {data[0].value}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">
            Current
          </div>
          <div className="text-xl font-bold text-primary">
            {data[data.length - 1].value}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">
            Change
          </div>
          <div
            className={`text-xl font-bold ${
              change < 0 ? "text-success" : change > 0 ? "text-danger" : "text-muted-foreground"
            }`}
          >
            {change > 0 ? "+" : ""}
            {change.toFixed(1)}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
