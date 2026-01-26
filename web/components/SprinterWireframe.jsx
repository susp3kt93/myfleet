export default function SprinterWireframe({ className }) {
    return (
        <div className={`relative w-full max-w-5xl mx-auto ${className}`}>
            <svg
                viewBox="0 0 800 400"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-auto drop-shadow-[0_0_15px_rgba(6,182,212,0.6)] filter contrast-125"
            >
                <defs>
                    <linearGradient id="cyberGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#d946ef" stopOpacity="1" />
                        <stop offset="50%" stopColor="#8b5cf6" stopOpacity="1" />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity="1" />
                    </linearGradient>
                    <linearGradient id="glassShield" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                    </linearGradient>
                    <filter id="neonGlow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* --- FUTURE CONCEPT BODY --- */}
                {/* Main Aerodynamic Silhouette */}
                <path
                    d="M100,280 L80,250 C80,250 100,100 250,80 L600,70 C650,70 750,70 780,280 L780,300 M100,280 L780,280"
                    stroke="url(#cyberGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#neonGlow)"
                    fill="none"
                />

                {/* The Signature "Vision" Continuous Windshield Line */}
                <path
                    d="M250,80 C180,90 140,150 120,220"
                    stroke="#06b6d4"
                    strokeWidth="2"
                    fill="none"
                    opacity="0.8"
                />

                {/* Futuristic LED Front Strip (The "Face") */}
                <path
                    d="M115,230 L160,225"
                    stroke="#06b6d4"
                    strokeWidth="4"
                    strokeLinecap="round"
                    filter="url(#neonGlow)"
                    className="animate-pulse"
                />

                {/* Side Illuminated Character Line (Glowing Stream) */}
                <path
                    d="M160,225 C250,220 500,210 780,210"
                    stroke="#d946ef"
                    strokeWidth="2"
                    opacity="0.9"
                    filter="url(#neonGlow)"
                />

                {/* --- GLASS CANOPY --- */}
                <path
                    d="M250,80 C180,90 140,150 120,220 L300,220 L350,85 Z"
                    fill="url(#glassShield)"
                    stroke="none"
                />

                {/* --- AERO WHEELS (Solid Futuristic Look) --- */}
                {/* Front Wheel */}
                <g transform="translate(200, 280)">
                    <circle cx="0" cy="0" r="45" stroke="#8b5cf6" strokeWidth="2" filter="url(#neonGlow)" />
                    {/* Turbine Spokes */}
                    <path d="M0,0 L0,-45" stroke="#06b6d4" strokeWidth="1" opacity="0.5" transform="rotate(0)" />
                    <path d="M0,0 L0,-45" stroke="#06b6d4" strokeWidth="1" opacity="0.5" transform="rotate(60)" />
                    <path d="M0,0 L0,-45" stroke="#06b6d4" strokeWidth="1" opacity="0.5" transform="rotate(120)" />
                    <circle cx="0" cy="0" r="15" fill="#0f172a" stroke="#d946ef" strokeWidth="2" />
                </g>

                {/* Rear Wheel */}
                <g transform="translate(680, 280)">
                    <circle cx="0" cy="0" r="45" stroke="#8b5cf6" strokeWidth="2" filter="url(#neonGlow)" />
                    <path d="M0,0 L0,-45" stroke="#06b6d4" strokeWidth="1" opacity="0.5" transform="rotate(0)" />
                    <path d="M0,0 L0,-45" stroke="#06b6d4" strokeWidth="1" opacity="0.5" transform="rotate(60)" />
                    <path d="M0,0 L0,-45" stroke="#06b6d4" strokeWidth="1" opacity="0.5" transform="rotate(120)" />
                    <circle cx="0" cy="0" r="15" fill="#0f172a" stroke="#d946ef" strokeWidth="2" />
                </g>

                {/* --- REAR LED TAIL LIGHT (Vertical) --- */}
                <path d="M780,100 L780,250" stroke="#d946ef" strokeWidth="3" filter="url(#neonGlow)" opacity="0.8" />

                {/* --- SPEED / DATA STREAM EFFECTS --- */}
                <line x1="300" y1="60" x2="350" y2="60" stroke="#06b6d4" strokeWidth="1" opacity="0.5" className="animate-pulse" />
                <line x1="280" y1="50" x2="380" y2="50" stroke="#8b5cf6" strokeWidth="1" opacity="0.3" className="animate-pulse" style={{ animationDelay: '0.1s' }} />

                {/* Holographic Ground Projection */}
                <ellipse cx="440" cy="310" rx="300" ry="10" fill="url(#cyberGradient)" opacity="0.1" filter="blur(10px)" />

                {/* Tech Specs */}
                <text x="50" y="380" fill="#06b6d4" fontSize="12" fontFamily="monospace" opacity="0.8">MODEL: VISION VAN X</text>
                <text x="650" y="380" fill="#d946ef" fontSize="12" fontFamily="monospace" opacity="0.8">AERO COEFF: 0.19</text>

            </svg>
        </div>
    );
}
