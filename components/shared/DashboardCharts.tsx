"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie,
} from "recharts";
import { ChartCard } from "./ChartCard";

type DeptChartItem = { name: string; employees: number; fill: string };

interface DashboardChartsProps {
  deptChartData: DeptChartItem[];
}

export function DashboardCharts({ deptChartData }: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartCard title="Employees by Department">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={deptChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="employees" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Department Distribution">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={deptChartData}
              dataKey="employees"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              labelLine={false}
            />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
