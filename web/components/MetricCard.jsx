'use client';

/**
 * MetricCard - Large gradient card component for dashboard metrics
 * Features: Vibrant gradients, large numbers, mini charts, hover animations
 */
export default function MetricCard({
    title,
    value,
    subtitle,
    icon,
    gradient = 'purple-pink',
    progress,
    onClick,
    href
}) {
    const gradientClasses = {
        'purple-pink': 'bg-gradient-to-br from-purple-500 to-pink-500',
        'blue-cyan': 'bg-gradient-to-br from-blue-500 to-cyan-400',
        'orange-red': 'bg-gradient-to-br from-orange-500 to-red-500',
        'magenta-purple': 'bg-gradient-to-br from-fuchsia-500 to-purple-500',
    };

    const CardContent = () => (
        <div className={`
            ${gradientClasses[gradient]}
            rounded-3xl p-8 
            min-h-[320px] 
            flex flex-col justify-between
            text-white
            shadow-2xl
            transition-all duration-300
            hover:scale-[1.02] hover:shadow-3xl
            cursor-pointer
            relative overflow-hidden
        `}>
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
            
            {/* Card content */}
            <div className="relative z-10">
                {/* Icon */}
                <div className="text-6xl mb-4 opacity-90">
                    {icon}
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold opacity-90 mb-2">
                    {title}
                </h3>

                {/* Value */}
                <div className="text-5xl font-bold mb-2">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                </div>

                {/* Subtitle */}
                {subtitle && (
                    <p className="text-sm opacity-80">
                        {subtitle}
                    </p>
                )}

                {/* Progress bar if provided */}
                {progress !== undefined && (
                    <div className="mt-4 bg-white/20 rounded-full h-2 overflow-hidden">
                        <div 
                            className="h-full bg-white/60 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}
            </div>

            {/* View Details Button */}
            <button className="
                relative z-10
                mt-6
                px-6 py-3
                bg-white/20 hover:bg-white/30
                border border-white/30
                rounded-xl
                font-semibold
                transition-all duration-200
                backdrop-blur-sm
                text-left
                w-full
            ">
                View Details →
            </button>
        </div>
    );

    // Wrap with Link if href provided
    if (href) {
        const Link = require('next/link').default;
        return (
            <Link href={href} className="block">
                <CardContent />
            </Link>
        );
    }

    return <CardContent />;
}
