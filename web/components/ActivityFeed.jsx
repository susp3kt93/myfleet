'use client';

import { useEffect, useState } from 'react';

export default function ActivityFeed({ data, loading = false, error = null, autoRefresh = false }) {
    const [activities, setActivities] = useState(data || []);

    useEffect(() => {
        if (data) {
            setActivities(data);
        }
    }, [data]);

    // Format timestamp to relative time
    const getRelativeTime = (timestamp) => {
        const now = new Date();
        const activityTime = new Date(timestamp);
        const diffMs = now - activityTime;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return activityTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Get icon for action type
    const getActionIcon = (action) => {
        if (action.includes('completed')) return '✅';
        if (action.includes('started')) return '▶️';
        if (action.includes('cancelled')) return '❌';
        if (action.includes('updated')) return '📝';
        if (action.includes('logged in')) return '🔐';
        return '📋';
    };

    // Get color for action type
    const getActionColor = (action) => {
        if (action.includes('completed')) return 'text-green-600 bg-green-50';
        if (action.includes('started')) return 'text-blue-600 bg-blue-50';
        if (action.includes('cancelled')) return 'text-red-600 bg-red-50';
        if (action.includes('updated')) return 'text-yellow-600 bg-yellow-50';
        return 'text-gray-600 bg-gray-50';
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                                <div className="flex-1">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
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

    if (!activities || activities.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="h-64 flex items-center justify-center">
                    <div className="text-center">
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-gray-600 text-sm">No recent activity</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow max-h-[480px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                {autoRefresh && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Live
                    </span>
                )}
            </div>

            <div className="space-y-2 overflow-y-auto flex-1">
                {activities.map((activity, index) => (
                    <div
                        key={`${activity.userId}-${activity.timestamp}-${index}`}
                        className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0"
                    >
                        {/* Avatar/Icon */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full ${getActionColor(activity.action)} flex items-center justify-center text-sm`}>
                            {getActionIcon(activity.action)}
                        </div>

                        {/* Activity Details */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 leading-tight">
                                <span className="font-semibold">{activity.userName}</span>
                                {' '}
                                <span className="text-gray-600">{activity.action}</span>
                                {activity.taskTitle && (
                                    <span className="text-gray-900 font-medium"> "{activity.taskTitle}"</span>
                                )}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-gray-500">
                                    {getRelativeTime(activity.timestamp)}
                                </span>
                                {activity.personalId && (
                                    <>
                                        <span className="text-gray-300">•</span>
                                        <span className="text-xs text-gray-400">{activity.personalId}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
