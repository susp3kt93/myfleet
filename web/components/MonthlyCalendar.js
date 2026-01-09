'use client';

import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameDay, isSameMonth, parseISO, addMonths, subMonths } from 'date-fns';
import { ro } from 'date-fns/locale';
import { useTranslation } from '../contexts/LanguageContext';

export default function MonthlyCalendar({ tasks, onAcceptTask, onRejectTask }) {
    const { t, language } = useTranslation('dashboard');
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Get first and last day of the month
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    // Get the start and end of the calendar (including padding days)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    // Generate array of all days to display
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    // Group tasks by date
    const tasksByDate = tasks.reduce((acc, task) => {
        const taskDate = format(parseISO(task.scheduledDate), 'yyyy-MM-dd');
        if (!acc[taskDate]) {
            acc[taskDate] = [];
        }
        acc[taskDate].push(task);
        return acc;
    }, {});

    const handlePreviousMonth = () => {
        setCurrentMonth(subMonths(currentMonth, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(addMonths(currentMonth, 1));
    };

    const handleToday = () => {
        setCurrentMonth(new Date());
    };

    const today = new Date();

    return (
        <div className="bg-white rounded-lg shadow p-6">
            {/* Header with navigation */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                    {format(currentMonth, 'MMMM yyyy', { locale: language === 'ro' ? ro : undefined })}
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={handlePreviousMonth}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
                    >
                        {t('calendar.previous')}
                    </button>
                    <button
                        onClick={handleToday}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
                    >
                        {t('calendar.today')}
                    </button>
                    <button
                        onClick={handleNextMonth}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
                    >
                        {t('calendar.next')}
                    </button>
                </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
                {[t('calendar.monday'), t('calendar.tuesday'), t('calendar.wednesday'), t('calendar.thursday'), t('calendar.friday'), t('calendar.saturday'), t('calendar.sunday')].map((day) => (
                    <div key={day} className="text-center font-semibold text-gray-600 text-sm py-2">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day) => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const dayTasks = tasksByDate[dateKey] || [];
                    const isToday = isSameDay(day, today);
                    const isCurrentMonth = isSameMonth(day, currentMonth);

                    return (
                        <div
                            key={dateKey}
                            className={`border rounded-lg p-2 min-h-[120px] ${isToday
                                ? 'border-blue-500 bg-blue-50'
                                : isCurrentMonth
                                    ? 'border-gray-200 bg-white'
                                    : 'border-gray-100 bg-gray-50'
                                }`}
                        >
                            <div className="text-center mb-2">
                                <div className={`text-lg font-bold ${isToday
                                    ? 'text-blue-600'
                                    : isCurrentMonth
                                        ? 'text-gray-900'
                                        : 'text-gray-400'
                                    }`}>
                                    {format(day, 'd')}
                                </div>
                                {dayTasks.length > 0 && (
                                    <div className="mt-1">
                                        <span className="inline-block bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">
                                            {dayTasks.length}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1">
                                {dayTasks.slice(0, 3).map((task) => (
                                    <div
                                        key={task.id}
                                        className="bg-white border border-gray-200 rounded p-1 hover:shadow-md transition"
                                    >
                                        <h4 className="font-semibold text-xs text-gray-900 truncate mb-1">
                                            {task.title}
                                        </h4>
                                        {task.scheduledTime && (
                                            <p className="text-xs text-gray-600">
                                                🕐 {task.scheduledTime}
                                            </p>
                                        )}
                                        <p className="text-xs text-green-600 font-semibold mb-1">
                                            💰 {Number(task.price).toFixed(2)} £
                                        </p>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => onAcceptTask(task.id)}
                                                className="flex-1 text-xs bg-green-500 hover:bg-green-600 text-white py-1 px-1 rounded transition"
                                            >
                                                ✓
                                            </button>
                                            <button
                                                onClick={() => onRejectTask(task.id)}
                                                className="flex-1 text-xs bg-red-500 hover:bg-red-600 text-white py-1 px-1 rounded transition"
                                            >
                                                ✗
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {dayTasks.length > 3 && (
                                    <div className="text-xs text-gray-500 text-center">
                                        +{dayTasks.length - 3} {dayTasks.length - 3 > 1 ? t('calendar.moreTasksPlural') : t('calendar.moreTasksSingular')}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
