import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceArea,
} from "recharts";
import { motion } from "framer-motion";
import { Activity, ArrowRight } from "lucide-react";
import React from "react";

interface DataPoint {
    date: string;
    value: number;
    appointmentNumber: number;
}

interface TestTrendChartProps {
    testName: string;
    unit: string;
    normalRange?: [number, number] | [];
    data: DataPoint[];
}

export function TestTrendChart({
    testName,
    unit,
    normalRange = [],
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

    const hasNormalRange = normalRange && normalRange.length === 2 &&
        typeof normalRange[0] === 'number' && typeof normalRange[1] === 'number';

    const isAbnormal = (value: number) => {
        if (!hasNormalRange) return false;
        return value < normalRange[0]! || value > normalRange[1]!;
    };

    const trend =
        data.length >= 2
            ? data[data.length - 1].value < data[0].value
                ? "decreasing"
                : data[data.length - 1].value > data[0].value
                    ? "increasing"
                    : "stable"
            : "stable";

    const change = data[data.length - 1].value - data[0].value;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl shadow-sm border border-border/50 p-6 h-full flex flex-col"
        >
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary" />
                        {testName}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Normal Range: <span className="font-mono font-medium text-foreground">
                            {hasNormalRange ? `${normalRange[0]} - ${normalRange[1]}` : "N/A"} {unit}
                        </span>
                    </p>
                </div>

                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${trend === 'stable' ? 'bg-secondary text-secondary-foreground' : 'bg-primary/10 text-primary'
                    }`}>
                    {trend}
                </div>
            </div>

            <div className="h-64 w-full flex-1 min-h-[250px]">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />

                            {/* Normal Range Band - Only render if valid */}
                            {hasNormalRange && (
                                <ReferenceArea
                                    y1={normalRange[0]}
                                    y2={normalRange[1]}
                                    fill="hsl(var(--success))"
                                    fillOpacity={0.05}
                                />
                            )}

                            <XAxis
                                dataKey="formattedDate"
                                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                                stroke="hsl(var(--border))"
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                            />

                            <YAxis
                                domain={[
                                    (dataMin: number) => {
                                        if (!hasNormalRange) return dataMin * 0.9;
                                        return Math.min(dataMin, normalRange[0]!) * 0.9;
                                    },
                                    (dataMax: number) => {
                                        if (!hasNormalRange) return dataMax * 1.1;
                                        return Math.max(dataMax, normalRange[1]!) * 1.1;
                                    },
                                ]}
                                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                                stroke="hsl(var(--border))"
                                tickLine={false}
                                axisLine={false}
                                unit={` ${unit}`}
                                width={40}
                            />

                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const point = payload[0].payload;
                                        const abnormal = isAbnormal(point.value);
                                        return (
                                            <div className="bg-popover/95 backdrop-blur-md p-3 shadow-xl rounded-xl border border-border text-sm">
                                                <p className="font-bold text-popover-foreground mb-1">
                                                    {point.formattedDate}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-muted-foreground">Value:</span>
                                                    <span
                                                        className={`font-mono font-bold ${abnormal ? "text-rose-500" : "text-emerald-500"
                                                            }`}
                                                    >
                                                        {point.value} {unit}
                                                    </span>
                                                </div>
                                                {point.isBaseline && (
                                                    <div className="mt-2 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded w-fit">
                                                        Baseline
                                                    </div>
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
                                            r={5}
                                            fill={abnormal ? "hsl(var(--destructive))" : "hsl(var(--background))"}
                                            stroke={abnormal ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
                                            strokeWidth={3}
                                            className="transition-all hover:r-8"
                                        />
                                    );
                                }}
                                activeDot={{ r: 8, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">
                        No data available
                    </div>
                )}
            </div>

            {data.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border flex justify-between items-center text-sm">
                    <div className="text-muted-foreground">
                        Start: <span className="font-medium text-foreground">{data[0].value} {unit}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <div className="text-muted-foreground">
                        Latest: <span className="font-bold text-foreground">{data[data.length - 1].value} {unit}</span>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
