'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function UnifiedBackButton({ href, label = 'Back', className = '' }) {
    const router = useRouter();

    const baseClasses = "flex items-center text-white/80 hover:text-white transition group font-medium";

    if (href) {
        return (
            <Link href={href} className={`${baseClasses} ${className}`}>
                <span className="mr-2 transform group-hover:-translate-x-1 transition-transform">←</span>
                {label}
            </Link>
        );
    }

    return (
        <button
            onClick={() => router.back()}
            className={`${baseClasses} ${className}`}
        >
            <span className="mr-2 transform group-hover:-translate-x-1 transition-transform">←</span>
            {label}
        </button>
    );
}
