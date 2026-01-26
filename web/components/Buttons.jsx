'use client';

/**
 * Modern Button Components with Gradient Styles
 * Consistent design system for all admin pages
 */

// Primary gradient button (main actions)
export function PrimaryButton({ children, onClick, type = 'button', className = '', disabled = false }) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`
                px-6 py-2.5 
                bg-gradient-to-r from-purple-600 to-pink-500 
                text-white font-semibold
                rounded-xl 
                shadow-lg hover:shadow-xl 
                hover:scale-105 
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                ${className}
            `}
        >
            {children}
        </button>
    );
}

// Secondary button (cancel, back)
export function SecondaryButton({ children, onClick, type = 'button', className = '' }) {
    return (
        <button
            type={type}
            onClick={onClick}
            className={`
                px-6 py-2.5 
                bg-gray-300 hover:bg-gray-400 
                text-gray-800 font-semibold
                rounded-xl 
                shadow-lg hover:shadow-xl 
                hover:scale-105 
                transition-all duration-200
                ${className}
            `}
        >
            {children}
        </button>
    );
}

// Success button (complete, confirm)
export function SuccessButton({ children, onClick, type = 'button', className = '' }) {
    return (
        <button
            type={type}
            onClick={onClick}
            className={`
                px-6 py-2.5 
                bg-gradient-to-r from-green-500 to-emerald-600 
                text-white font-semibold
                rounded-xl 
                shadow-lg hover:shadow-xl 
                hover:scale-105 
                transition-all duration-200
                ${className}
            `}
        >
            {children}
        </button>
    );
}

// Danger button (delete, remove)
export function DangerButton({ children, onClick, type = 'button', className = '' }) {
    return (
        <button
            type={type}
            onClick={onClick}
            className={`
                px-6 py-2.5 
                bg-gradient-to-r from-red-500 to-red-600 
                text-white font-semibold
                rounded-xl 
                shadow-lg hover:shadow-xl 
                hover:scale-105 
                transition-all duration-200
                ${className}
            `}
        >
            {children}
        </button>
    );
}

// Small button variants (for tables, compact spaces)
export function SmallPrimaryButton({ children, onClick, type = 'button', className = '' }) {
    return (
        <button
            type={type}
            onClick={onClick}
            className={`
                px-4 py-1.5 text-sm
                bg-gradient-to-r from-purple-600 to-pink-500 
                text-white font-medium
                rounded-lg 
                shadow hover:shadow-md 
                hover:scale-105 
                transition-all duration-200
                ${className}
            `}
        >
            {children}
        </button>
    );
}

export function SmallSecondaryButton({ children, onClick, type = 'button', className = '' }) {
    return (
        <button
            type={type}
            onClick={onClick}
            className={`
                px-4 py-1.5 text-sm
                bg-gray-200 hover:bg-gray-300 
                text-gray-700 font-medium
                rounded-lg 
                hover:shadow-md 
                transition-all duration-200
                ${className}
            `}
        >
            {children}
        </button>
    );
}

// Navigation buttons (prev/next)
export function NavButton({ children, onClick, direction = 'next', disabled = false }) {
    const icon = direction === 'next' ? '→' : '←';

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                px-5 py-2.5 
                bg-gradient-to-r from-blue-500 to-cyan-500 
                text-white font-semibold
                rounded-xl 
                shadow-lg hover:shadow-xl 
                hover:scale-105 
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                flex items-center gap-2
            `}
        >
            {direction === 'prev' && <span>{icon}</span>}
            {children}
            {direction === 'next' && <span>{icon}</span>}
        </button>
    );
}

// Icon button (for small actions)
export function IconButton({ icon, onClick, variant = 'default', title = '' }) {
    const variants = {
        default: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
        primary: 'bg-gradient-to-r from-purple-600 to-pink-500 text-white',
        danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white',
        success: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white',
    };

    return (
        <button
            onClick={onClick}
            title={title}
            className={`
                w-10 h-10 
                ${variants[variant]}
                rounded-lg 
                flex items-center justify-center
                shadow hover:shadow-md 
                hover:scale-110 
                transition-all duration-200
            `}
        >
            {icon}
        </button>
    );
}

// Export all
export default {
    Primary: PrimaryButton,
    Secondary: SecondaryButton,
    Success: SuccessButton,
    Danger: DangerButton,
    SmallPrimary: SmallPrimaryButton,
    SmallSecondary: SmallSecondaryButton,
    Nav: NavButton,
    Icon: IconButton,
};
