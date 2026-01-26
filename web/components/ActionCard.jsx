'use client';

/**
 * ActionCard - Smaller gradient card for quick actions
 * Similar to MetricCard but optimized for action items
 */
export default function ActionCard({
    title,
    description,
    icon,
    gradient = 'blue',
    href,
    badge,
    highlight = false
}) {
    const Link = require('next/link').default;

    const gradientClasses = {
        'blue': 'bg-gradient-to-br from-blue-500 to-blue-600',
        'purple': 'bg-gradient-to-br from-purple-500 to-purple-600',
        'amber': 'bg-gradient-to-br from-amber-500 to-amber-600',
        'green': 'bg-gradient-to-br from-green-500 to-green-600',
        'cyan': 'bg-gradient-to-br from-cyan-500 to-cyan-600',
        'orange': 'bg-gradient-to-br from-orange-500 to-orange-600',
        'red': 'bg-gradient-to-br from-red-500 to-red-600',
    };

    return (
        <Link href={href} className="block group relative">
            {/* Badge if provided */}
            {badge && (
                <div className="absolute top-4 right-4 bg-white text-red-600 text-xs font-bold px-2 py-1 rounded-full shadow-lg z-10 animate-pulse">
                    {badge}
                </div>
            )}

            <div className={`
                ${gradientClasses[gradient]}
                ${highlight ? 'ring-4 ring-white ring-opacity-50 animate-pulse' : ''}
                rounded-2xl p-6
                text-white
                shadow-lg
                transition-all duration-300
                group-hover:scale-[1.03] group-hover:shadow-2xl
                cursor-pointer
                relative overflow-hidden
            `}>
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />
                
                {/* Content */}
                <div className="relative z-10 flex items-center space-x-4">
                    {/* Icon */}
                    <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
                        {icon}
                    </div>

                    {/* Text */}
                    <div className="flex-1">
                        <h3 className="text-lg font-bold mb-1">
                            {title}
                        </h3>
                        <p className="text-sm opacity-90">
                            {description}
                        </p>
                    </div>

                    {/* Arrow */}
                    <div className="text-2xl opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                        →
                    </div>
                </div>
            </div>
        </Link>
    );
}
