export default function SprinterWireframe({ className }) {
    return (
        <div className={`relative w-full max-w-4xl mx-auto overflow-hidden ${className}`}>
            <svg
                viewBox="0 0 600 250"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-auto drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]"
            >
                <defs>
                    <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Main Body Outline */}
                <path
                    d="M50,180 L50,120 L90,80 L160,50 L480,50 L530,90 L530,180 L500,180 M110,180 L150,180 M210,180 L440,180"
                    stroke="url(#neonGradient)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#glow)"
                    className="animate-draw"
                />

                {/* Wheel Wells */}
                <path
                    d="M50,180 A30,30 0 0,1 110,180"
                    stroke="url(#neonGradient)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    filter="url(#glow)"
                />
                <path
                    d="M440,180 A30,30 0 0,1 500,180"
                    stroke="url(#neonGradient)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    filter="url(#glow)"
                />

                {/* Wheels (Simple circles) */}
                <circle cx="80" cy="180" r="24" stroke="#06b6d4" strokeWidth="1" className="opacity-60" />
                <circle cx="80" cy="180" r="10" stroke="#a855f7" strokeWidth="2" />

                <circle cx="470" cy="180" r="24" stroke="#06b6d4" strokeWidth="1" className="opacity-60" />
                <circle cx="470" cy="180" r="10" stroke="#a855f7" strokeWidth="2" />

                {/* Windows */}
                <path
                    d="M100,85 L160,60 L220,60 L220,120 L100,120 Z" // Windshield/Driver Window
                    stroke="#a855f7"
                    strokeWidth="1.5"
                    fill="rgba(168, 85, 247, 0.05)"
                    filter="url(#glow)"
                />
                <path
                    d="M230,60 L470,60 L470,120 L230,120 Z" // Cargo Section Window (optional but looks cool)
                    stroke="rgba(6, 182, 212, 0.5)"
                    strokeWidth="1"
                    strokeDasharray="5,5"
                />

                {/* Details - Door Lines */}
                <path d="M220,60 L220,170" stroke="rgba(6, 182, 212, 0.3)" strokeWidth="1" />

                {/* Internal Wireframe/Grid Lines */}
                <path d="M160,50 L160,180" stroke="rgba(6, 182, 212, 0.2)" strokeWidth="0.5" />
                <path d="M300,50 L300,180" stroke="rgba(6, 182, 212, 0.2)" strokeWidth="0.5" />
                <path d="M400,50 L400,180" stroke="rgba(6, 182, 212, 0.2)" strokeWidth="0.5" />
                <path d="M50,140 L530,140" stroke="rgba(6, 182, 212, 0.2)" strokeWidth="0.5" />

                {/* Speed Lines */}
                <path d="M550,80 L600,80" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" opacity="0.6" className="animate-pulse" />
                <path d="M540,100 L590,100" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" opacity="0.4" className="animate-pulse" style={{ animationDelay: '0.2s' }} />
                <path d="M560,120 L580,120" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" opacity="0.8" className="animate-pulse" style={{ animationDelay: '0.5s' }} />

            </svg>
        </div>
    );
}
