'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = {
    completed: '#10b981',    // Green
    inProgress: '#3b82f6',   // Blue
    pending: '#fbbf24',      // Yellow
    cancelled: '#ef4444'     // Red
};

const STATUS_LABELS = {
    completed: 'Completed',
    inProgress: 'In Progress',
    pending: 'Pending',
    cancelled: 'Cancelled'
};

export default function DonutChart({ data, loading = false, error = null }) {
    if (loading) {
        return (
            <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
                        <div className="w-48 h-48 bg-gray-200 rounded-full"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Status Distribution</h3>
                <div className="h-64 flex items-center justify-center">
                    <div className="text-center">
                        <svg className="w-12 h-12 text-red-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-gray-600 text-sm">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!data || data.total === 0) {
        return (
            <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Status Distribution</h3>
                <div className="h-64 flex items-center justify-center">
                    <div className="text-center">
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="text-gray-600 text-sm">No tasks available</p>
                    </div>
                </div>
            </div>
        );
    }

    // Prepare chart data
    const chartData = [
        { name: STATUS_LABELS.completed, value: data.completed, status: 'completed' },
        { name: STATUS_LABELS.inProgress, value: data.inProgress, status: 'inProgress' },
        { name: STATUS_LABELS.pending, value: data.pending, status: 'pending' },
        { name: STATUS_LABELS.cancelled, value: data.cancelled, status: 'cancelled' }
    ].filter(item => item.value > 0); // Only show segments with data

    // Custom label for center
    const renderCenterLabel = () => {
        return (
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                <tspan x="50%" dy="-0.5em" fontSize="32" fontWeight="bold" fill="#1f2937">
                    {data.total}
                </tspan>
                <tspan x="50%" dy="1.5em" fontSize="14" fill="#6b7280">
                    Total Tasks
                </tspan>
            </text>
        );
    };

    // Custom tooltip
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const item = payload[0];
            const percentage = ((item.value / data.total) * 100).toFixed(1);
            return (
                <div className="bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200">
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600">
                        {item.value} tasks ({percentage}%)
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Status Distribution</h3>

            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                    >
                        {chartData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={COLORS[entry.status]}
                                className="hover:opacity-80 transition-opacity cursor-pointer"
                            />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value, entry) => {
                            const percentage = ((entry.payload.value / data.total) * 100).toFixed(0);
                            return `${value} (${percentage}%)`;
                        }}
                    />
                    {renderCenterLabel()}
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
