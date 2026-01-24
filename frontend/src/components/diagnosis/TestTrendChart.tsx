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
    isPrediction?: boolean;
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
        isBaseline: idx === 0 && !point.isPrediction,
        formattedDate: new Date(point.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        }),
    }));

    const historyData = chartData.filter(p => !p.isPrediction);
    const predictionData = chartData.filter(p => p.isPrediction);
    
    // For the dashed line, we want to start from the last historical point to create a continuous line
    const forecastSegment = historyData.length > 0 && predictionData.length > 0 
        ? [historyData[historyData.length - 1], ...predictionData] 
        : predictionData;

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
            className="bg-card rounded-2xl shadow-sm border border-border/50 p-6 flex flex-col h-full"
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

            {/* Fixed height container for Recharts to ensure visibility */}
            <div className="w-full h-[250px] min-h-[250px]">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                                    fillOpacity={0.1}
                                />
                            )}

                            <XAxis
                                dataKey="formattedDate"
                                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                                stroke="hsl(var(--border))"
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                                interval="preserveStartEnd"
                            />

                            <YAxis
                                domain={[
                                    (dataMin: number) => {
                                        if (!hasNormalRange) return Math.floor(dataMin * 0.9);
                                        return Math.floor(Math.min(dataMin, normalRange[0]!) * 0.9);
                                    },
                                    (dataMax: number) => {
                                        if (!hasNormalRange) return Math.ceil(dataMax * 1.1);
                                        return Math.ceil(Math.max(dataMax, normalRange[1]!) * 1.1);
                                    },
                                ]}
                                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                                stroke="hsl(var(--border))"
                                tickLine={false}
                                axisLine={false}
                                unit={unit ? ` ${unit}` : ""}
                                width={45}
                            />

                            <Tooltip
                                cursor={{ stroke: "hsl(var(--border))", strokeWidth: 2 }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const point = payload[0].payload;
                                        const abnormal = isAbnormal(point.value);
                                        return (
                                            <div className="bg-popover/95 backdrop-blur-md p-3 shadow-xl rounded-xl border border-border text-xs z-50">
                                                <div className="flex items-center justify-between gap-4 mb-1">
                                                    <p className="font-bold text-foreground">
                                                        {point.formattedDate}
                                                    </p>
                                                    {point.isPrediction && (
                                                        <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold uppercase">
                                                            Forecast
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-muted-foreground">Value:</span>
                                                    <span
                                                        className={`font-mono font-bold ${abnormal ? "text-rose-500" : "text-emerald-500"
                                                            }`}
                                                    >
                                                        {point.value} {unit}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />

                            {/* Historical Data Line */}
                            <Line
                                type="monotone"
                                data={historyData}
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
                                            r={4}
                                            fill={abnormal ? "hsl(var(--destructive))" : "hsl(var(--background))"}
                                            stroke={abnormal ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
                                            strokeWidth={2}
                                            className="transition-all hover:r-6 cursor-pointer"
                                        />
                                    );
                                }}
                                activeDot={{ r: 6, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                                animationDuration={1000}
                            />

                            {/* Forecast Data Line */}
                            {forecastSegment.length > 0 && (
                                <Line
                                    type="monotone"
                                    data={forecastSegment}
                                    dataKey="value"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth={3}
                                    strokeDasharray="8 4"
                                    strokeOpacity={0.8}
                                    dot={({ cx, cy, payload }) => {
                                        if (!payload.isPrediction) return null; // Last hist point already has a dot
                                        const abnormal = isAbnormal(payload.value);
                                        return (
                                            <g>
                                                <rect
                                                    key={payload.date}
                                                    x={cx - 4}
                                                    y={cy - 4}
                                                    width={8}
                                                    height={8}
                                                    fill="hsl(var(--background))"
                                                    stroke={abnormal ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
                                                    strokeWidth={2}
                                                    className="transition-all hover:scale-150 cursor-pointer"
                                                />
                                                {/* Add a small dot inside the square for extra flair */}
                                                <circle 
                                                    cx={cx} 
                                                    cy={cy} 
                                                    r={1.5} 
                                                    fill={abnormal ? "hsl(var(--destructive))" : "hsl(var(--primary))"} 
                                                />
                                            </g>
                                        );
                                    }}
                                    activeDot={{ r: 6, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                                    animationDuration={1500}
                                />
                            )}
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">
                        No data available
                    </div>
                )}
            </div>

            {data.length > 0 && (
                <div className="mt-auto pt-4 flex justify-between items-center text-xs text-muted-foreground">
                    <div>
                        Start: <span className="font-medium text-foreground">{historyData[0]?.value || data[0].value}</span>
                    </div>
                    <ArrowRight className="w-3 h-3 text-muted-foreground/50" />
                    <div>
                        {predictionData.length > 0 ? (
                            <>
                                Forecast: <span className="font-bold text-primary">{predictionData[predictionData.length - 1].value}</span>
                            </>
                        ) : (
                            <>
                                Latest: <span className="font-bold text-foreground">{data[data.length - 1].value}</span>
                            </>
                        )}
                    </div>
                </div>
            )}
        </motion.div>
    );
}
