'use client';

import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { useState } from 'react';

export default function TaskCalendarHeatMap({ data, loading = false, error = null }) {
    const [selectedDate, setSelectedDate] = useState(null);

    if (loading) {
        return (
            <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-40 bg-gray-100 rounded"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Activity Calendar</h3>
                <div className="h-40 flex items-center justify-center">
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

    if (!data || data.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Activity Calendar</h3>
                <div className="h-40 flex items-center justify-center">
                    <div className="text-center">
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-600 text-sm">No calendar data available</p>
                    </div>
                </div>
            </div>
        );
    }

    // Get date range for current month
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Get max count for color scaling
    const maxCount = Math.max(...data.map(d => d.count), 1);

    // Custom tooltip
    const getTooltipDataAttrs = (value) => {
        if (!value || !value.date) {
            return null;
        }
        const date = new Date(value.date);
        const dateStr = date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
        return {
            'data-tip': `${dateStr}: ${value.count} task${value.count !== 1 ? 's' : ''}`
        };
    };

    // Get color class based on count
    const getColorClass = (value) => {
        if (!value || value.count === 0) {
            return 'color-empty';
        }
        const percentage = (value.count / maxCount) * 100;
        if (percentage >= 75) return 'color-scale-4';
        if (percentage >= 50) return 'color-scale-3';
        if (percentage >= 25) return 'color-scale-2';
        return 'color-scale-1';
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Task Activity Calendar</h3>
                <span className="text-sm text-gray-500">
                    {startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
            </div>

            <div className="calendar-heatmap-container">
                <CalendarHeatmap
                    startDate={startDate}
                    endDate={endDate}
                    values={data}
                    classForValue={getColorClass}
                    tooltipDataAttrs={getTooltipDataAttrs}
                    showWeekdayLabels={true}
                    onClick={(value) => setSelectedDate(value)}
                />
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end gap-2 mt-4 text-xs text-gray-600">
                <span>Less</span>
                <div className="flex gap-1">
                    <div className="w-3 h-3 bg-gray-100 rounded"></div>
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#c6e48b' }}></div>
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#7bc96f' }}></div>
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#239a3b' }}></div>
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#196127' }}></div>
                </div>
                <span>More</span>
            </div>

            {/* Custom styles for heatmap */}
            <style jsx global>{`
                .calendar-heatmap-container {
                    font-size: 12px;
                    overflow-x: auto;
                }
                .react-calendar-heatmap {
                    width: 100%;
                }
                .react-calendar-heatmap .color-empty {
                    fill: #ebedf0;
                }
                .react-calendar-heatmap .color-scale-1 {
                    fill: #c6e48b;
                }
                .react-calendar-heatmap .color-scale-2 {
                    fill: #7bc96f;
                }
                .react-calendar-heatmap .color-scale-3 {
                    fill: #239a3b;
                }
                .react-calendar-heatmap .color-scale-4 {
                    fill: #196127;
                }
                .react-calendar-heatmap rect {
                    rx: 2;
                }
                .react-calendar-heatmap rect:hover {
                    stroke: #555;
                    stroke-width: 2px;
                    cursor: pointer;
                }
                .react-calendar-heatmap text {
                    font-size: 11px;
                    fill: #6b7280;
                    font-weight: 500;
                }
                @media (max-width: 768px) {
                    .calendar-heatmap-container {
                        font-size: 8px;
                    }
                    .react-calendar-heatmap text {
                        font-size: 8px;
                    }
                }
            `}</style>
        </div>
    );
}
