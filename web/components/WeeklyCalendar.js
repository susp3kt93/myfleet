'use client';

import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { ro } from 'date-fns/locale';

export default function WeeklyCalendar({ tasks, onAcceptTask }) {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday

    // Generate array of 7 days starting from Monday
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    // Group tasks by date
    const tasksByDate = tasks.reduce((acc, task) => {
        const taskDate = format(parseISO(task.scheduledDate), 'yyyy-MM-dd');
        if (!acc[taskDate]) {
            acc[taskDate] = [];
        }
        acc[taskDate].push(task);
        return acc;
    }, {});

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Calendar Săptămânal</h2>

            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {weekDays.map((day) => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const dayTasks = tasksByDate[dateKey] || [];
                    const isToday = isSameDay(day, today);

                    return (
                        <div
                            key={dateKey}
                            className={`border rounded-lg p-4 min-h-[200px] ${isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                }`}
                        >
                            <div className="text-center mb-3">
                                <div className="text-xs font-medium text-gray-500 uppercase">
                                    {format(day, 'EEE', { locale: ro })}
                                </div>
                                <div className={`text-2xl font-bold ${isToday ? 'text-blue-600' : 'text-gray-900'
                                    }`}>
                                    {format(day, 'd')}
                                </div>
                                {dayTasks.length > 0 && (
                                    <div className="mt-1">
                                        <span className="inline-block bg-primary-500 text-white text-xs px-2 py-1 rounded-full">
                                            {dayTasks.length} {dayTasks.length === 1 ? 'task' : 'tasks'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                {dayTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className="bg-white border border-gray-200 rounded p-2 hover:shadow-md transition"
                                    >
                                        <h4 className="font-semibold text-sm text-gray-900 mb-1">
                                            {task.title}
                                        </h4>
                                        {task.scheduledTime && (
                                            <p className="text-xs text-gray-600 mb-1">
                                                🕐 {task.scheduledTime}
                                            </p>
                                        )}
                                        <p className="text-xs text-green-600 font-semibold mb-2">
                                            💰 {Number(task.price).toFixed(2)} RON
                                        </p>
                                        <button
                                            onClick={() => onAcceptTask(task.id)}
                                            className="w-full text-xs bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded transition"
                                        >
                                            ✓ Acceptă
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
