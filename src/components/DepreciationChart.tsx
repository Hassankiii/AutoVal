"use client";

import {
  ComposedChart,
  Area,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import type { ChartDataPoint } from "@/types/chart";
import { formatAED } from "@/lib/utils";

interface DepreciationChartProps {
  data: ChartDataPoint[];
  currentYear: number;
  userYear: number;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartDataPoint }>;
  label?: string | number;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0]?.payload as ChartDataPoint;

  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl text-sm">
      <p className="text-slate-300 font-semibold mb-2">{label}</p>
      {point.medianPrice != null && (
        <p className="text-slate-200">
          Market median:{" "}
          <span className="text-emerald-400 font-semibold">
            {formatAED(point.medianPrice)}
          </span>
        </p>
      )}
      {point.p25 != null && point.p75 != null && (
        <p className="text-slate-400 text-xs mt-0.5">
          Range: {formatAED(point.p25)} – {formatAED(point.p75)}
        </p>
      )}
      {point.adjustedValue != null && (
        <p className="text-amber-400 font-semibold mt-1">
          Your car: {formatAED(point.adjustedValue)}
        </p>
      )}
      {point.sampleSize > 0 && (
        <p className="text-slate-500 text-xs mt-1">
          Based on {point.sampleSize} listing{point.sampleSize !== 1 ? "s" : ""}
        </p>
      )}
      {point.isSparse && (
        <p className="text-amber-500 text-xs mt-1">⚠ Limited data</p>
      )}
    </div>
  );
}

// Custom dot for scatter — highlight user car
function UserCarDot(props: {
  cx?: number;
  cy?: number;
  payload?: ChartDataPoint;
}) {
  const { cx, cy } = props;
  if (cx == null || cy == null) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={8} fill="#f59e0b" stroke="#fbbf24" strokeWidth={2} />
      <circle cx={cx} cy={cy} r={14} fill="#f59e0b" fillOpacity={0.2} />
    </g>
  );
}

export function DepreciationChart({
  data,
  currentYear,
  userYear,
}: DepreciationChartProps) {
  // Transform for recharts: Scatter needs separate data filtered to isUserCar points
  const scatterData = data
    .filter((d) => d.isUserCar && d.adjustedValue != null)
    .map((d) => ({ ...d, value: d.adjustedValue }));

  const yMin = Math.min(...data.map((d) => d.p25 ?? d.medianPrice ?? 0).filter(Boolean));
  const yMax = Math.max(...data.map((d) => d.p75 ?? d.medianPrice ?? 0).filter(Boolean));
  const yPad = (yMax - yMin) * 0.15;

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart
          data={data}
          margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="iqrGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#64748b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#64748b" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis
            dataKey="year"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickCount={data.length}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            axisLine={{ stroke: "#334155" }}
            tickLine={false}
            tickFormatter={(v) => String(v)}
          />
          <YAxis
            domain={[
              Math.max(0, Math.round((yMin - yPad) / 1000) * 1000),
              Math.round((yMax + yPad) / 1000) * 1000,
            ]}
            tickFormatter={(v) =>
              v >= 1000 ? `${Math.round(v / 1000)}K` : String(v)
            }
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={55}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* IQR band */}
          <Area
            type="monotone"
            dataKey="p75"
            stroke="none"
            fill="url(#iqrGradient)"
            fillOpacity={1}
            legendType="none"
            dot={false}
            activeDot={false}
          />
          <Area
            type="monotone"
            dataKey="p25"
            stroke="none"
            fill="#0f172a"
            fillOpacity={1}
            legendType="none"
            dot={false}
            activeDot={false}
          />

          {/* Median price line */}
          <Line
            type="monotone"
            dataKey="medianPrice"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#10b981" }}
            name="Market Median"
          />

          {/* User car dot */}
          <Scatter
            data={scatterData}
            dataKey="value"
            name="Your Car"
            shape={<UserCarDot />}
          />

          {/* Today reference line */}
          {currentYear !== userYear && (
            <ReferenceLine
              x={currentYear}
              stroke="#475569"
              strokeDasharray="4 4"
              label={{
                value: "Today",
                fill: "#64748b",
                fontSize: 10,
                position: "top",
              }}
            />
          )}

          <Legend
            formatter={(value) => (
              <span style={{ color: "#94a3b8", fontSize: 12 }}>{value}</span>
            )}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
