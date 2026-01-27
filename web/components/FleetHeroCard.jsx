export default function FleetHeroCard({ className }) {
    return (
        <div className={`text-center ${className}`}>
            {/* Fleet Logo/Icon */}
            <div className="mb-6 flex justify-center">
                <div className="relative">
                    {/* Van Icon */}
                    <svg
                        width="80"
                        height="80"
                        viewBox="0 0 100 100"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="drop-shadow-lg"
                    >
                        <defs>
                            <linearGradient id="vanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#1e40af" />
                                <stop offset="100%" stopColor="#3b82f6" />
                            </linearGradient>
                        </defs>

                        {/* Van Body */}
                        <rect x="20" y="35" width="60" height="30" rx="3" fill="url(#vanGradient)" />

                        {/* Van Front */}
                        <path d="M20 45 L15 50 L15 60 L20 65 L20 45Z" fill="#1e40af" />

                        {/* Windows */}
                        <rect x="25" y="40" width="12" height="15" rx="1" fill="white" opacity="0.3" />
                        <rect x="42" y="40" width="33" height="15" rx="1" fill="white" opacity="0.2" />

                        {/* Wheels */}
                        <circle cx="32" cy="65" r="6" fill="#1f2937" />
                        <circle cx="32" cy="65" r="3" fill="#6b7280" />
                        <circle cx="68" cy="65" r="6" fill="#1f2937" />
                        <circle cx="68" cy="65" r="3" fill="#6b7280" />

                        {/* Headlight */}
                        <circle cx="17" cy="55" r="2" fill="#fbbf24" opacity="0.8" />
                    </svg>

                    {/* Pulse Ring */}
                    <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping"></div>
                </div>
            </div>

            {/* Brand Name */}
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-2 tracking-tight">
                MyFleet
            </h1>

            {/* Tagline */}
            <p className="text-gray-600 text-sm md:text-base font-medium">
                Professional Fleet Management
            </p>

            {/* Trust Badge */}
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span className="text-green-700 text-xs font-semibold">Trusted by 500+ companies</span>
            </div>
        </div>
    );
}
