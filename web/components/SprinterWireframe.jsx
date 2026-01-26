export default function SprinterWireframe({ className }) {
    return (
        <div className={`relative w-full max-w-5xl mx-auto ${className}`}>
            <svg
                viewBox="0 0 800 400"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-auto drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] filter contrast-125"
            >
                <defs>
                    <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
                        <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#a855f7" stopOpacity="0.4" />
                    </linearGradient>
                    <linearGradient id="glassGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.1" />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.05" />
                    </linearGradient>
                    <linearGradient id="scanGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="transparent" />
                        <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                </defs>

                {/* --- CHASSIS & BODY --- */}
                {/* Roofline & Dynamic Curve */}
                <path
                    d="M140,280 L140,180 L200,120 L350,80 L750,80 L780,280 L780,300 M140,280 L780,280"
                    stroke="url(#bodyGradient)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                />

                {/* Front Bumper & Grill Area */}
                <path d="M140,280 L130,280 L120,250 L140,180" stroke="#06b6d4" strokeWidth="2" fill="none" />

                {/* Side Panel Detail (The Mercedes Side Character Line) */}
                <path d="M140,210 L300,190 L780,190" stroke="#a855f7" strokeWidth="1.5" fill="none" opacity="0.7" />

                {/* Rub Strip (Bottom Protection) */}
                <path d="M230,280 L750,280" stroke="#06b6d4" strokeWidth="3" opacity="0.5" />

                {/* --- WINDOWS --- */}
                {/* Windshield */}
                <path
                    d="M200,120 L350,80 L350,180 L200,180 Z"
                    stroke="#06b6d4"
                    strokeWidth="1"
                    fill="url(#glassGradient)"
                />
                {/* Driver Window */}
                <path
                    d="M360,85 L480,85 L480,180 L360,180 Z"
                    stroke="#06b6d4"
                    strokeWidth="1"
                    fill="url(#glassGradient)"
                />
                {/* Caro Window 1 */}
                <path d="M500,90 L620,90 L620,180 L500,180 Z" stroke="rgba(6,182,212,0.3)" strokeWidth="1" fill="url(#glassGradient)" />
                {/* Caro Window 2 */}
                <path d="M640,90 L750,90 L750,180 L640,180 Z" stroke="rgba(6,182,212,0.3)" strokeWidth="1" fill="url(#glassGradient)" />

                {/* --- WHEELS (Detailed Mag Wheels style) --- */}
                {/* Front */}
                <circle cx="230" cy="280" r="45" stroke="#a855f7" strokeWidth="2" fill="none" />
                <circle cx="230" cy="280" r="35" stroke="#06b6d4" strokeWidth="1" strokeDasharray="4 2" />
                <circle cx="230" cy="280" r="15" fill="#1e293b" stroke="#06b6d4" />

                {/* Rear */}
                <circle cx="650" cy="280" r="45" stroke="#a855f7" strokeWidth="2" fill="none" />
                <circle cx="650" cy="280" r="35" stroke="#06b6d4" strokeWidth="1" strokeDasharray="4 2" />
                <circle cx="650" cy="280" r="15" fill="#1e293b" stroke="#06b6d4" />

                {/* --- HEADLIGHTS (Aggressive Look) --- */}
                <path d="M140,190 L180,185 L180,205 L145,210 Z" fill="#06b6d4" fillOpacity="0.3" stroke="#06b6d4" strokeWidth="1" />

                {/* --- MIRRORS --- */}
                <path d="M350,160 L330,160 L330,130 L350,130" stroke="#a855f7" strokeWidth="2" fill="#0f172a" />

                {/* --- TECH DETAILS (Scanning Lines) --- */}

                {/* Vertical Scan Lines */}
                <line x1="200" y1="50" x2="200" y2="350" stroke="rgba(168, 85, 247, 0.2)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="440" y1="50" x2="440" y2="350" stroke="rgba(168, 85, 247, 0.2)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="650" y1="50" x2="650" y2="350" stroke="rgba(168, 85, 247, 0.2)" strokeWidth="1" strokeDasharray="4 4" />

                {/* Horizontal Scan Animation */}
                <rect x="100" y="50" width="700" height="300" fill="url(#scanGradient)" opacity="0.1">
                    <animate attributeName="x" from="-800" to="800" dur="3s" repeatCount="indefinite" />
                </rect>

                {/* Measurement Markers */}
                <text x="230" y="350" fill="#06b6d4" fontSize="12" fontFamily="monospace" opacity="0.8">AXLE A-1</text>
                <text x="650" y="350" fill="#06b6d4" fontSize="12" fontFamily="monospace" opacity="0.8">AXLE B-1</text>
                <text x="400" y="380" fill="#a855f7" fontSize="14" fontFamily="monospace" letterSpacing="2" textAnchor="middle">MERCEDES-BENZ SPRINTER // 2026</text>

            </svg>
        </div>
    );
}
