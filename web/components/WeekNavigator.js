'use client';

import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { ro } from 'date-fns/locale';
import { useTranslation } from '../contexts/LanguageContext';

export default function WeekNavigator({ currentDate, onDateChange }) {
    const { t } = useTranslation('dashboard');
    const { locale } = useTranslation('common');
    const handlePreviousWeek = () => {
        const newDate = subWeeks(currentDate, 1);
        onDateChange(newDate);
    };

    const handleToday = () => {
        onDateChange(new Date());
    };

    const handleNextWeek = () => {
        const newDate = addWeeks(currentDate, 1);
        onDateChange(newDate);
    };

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 }); // Sunday

    const formatWeekRange = () => {
        const start = format(weekStart, 'd MMM', { locale: ro });
        const end = format(weekEnd, 'd MMM yyyy', { locale: ro });
        return `${start} - ${end}`;
    };

    return (
        <div className="flex items-center justify-between bg-white rounded-lg shadow p-4 mb-6">
            <button
                onClick={handlePreviousWeek}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition font-medium"
            >
                {t('weeklyTasks.previousWeek')}
            </button>

            <div className="flex flex-col items-center">
                <span className="text-sm text-gray-600">{t('time.week', { ns: 'common' })}</span>
                <span className="text-lg font-bold text-gray-900">{formatWeekRange()}</span>
            </div>

            <button
                onClick={handleToday}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition font-medium"
            >
                {t('weeklyTasks.currentWeek')}
            </button>

            <button
                onClick={handleNextWeek}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition font-medium"
            >
                {t('weeklyTasks.nextWeek')}
            </button>
        </div>
    );
}
