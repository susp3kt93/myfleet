// MyFleet Mobile Theme - Green Gradient Design
// Matches the web app design refresh

export const colors = {
    // Primary Green Gradient
    primary: {
        light: '#22c55e',      // green-500
        main: '#16a34a',       // green-600
        dark: '#15803d',       // green-700
        gradient: ['#22c55e', '#10b981'], // green-500 to emerald-500
    },

    // Emerald Accent
    emerald: {
        light: '#34d399',      // emerald-400
        main: '#10b981',       // emerald-500
        dark: '#059669',       // emerald-600
    },

    // Neutrals
    gray: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
    },

    // Status Colors
    status: {
        success: '#22c55e',    // green-500
        warning: '#f59e0b',    // amber-500
        error: '#ef4444',      // red-500
        info: '#3b82f6',       // blue-500
        pending: '#eab308',    // yellow-500
    },

    // Background
    background: {
        primary: '#f3f4f6',    // gray-100
        secondary: '#ffffff',
        dark: '#111827',       // gray-900
    },

    // Text
    text: {
        primary: '#1f2937',    // gray-800  
        secondary: '#6b7280',  // gray-500
        light: '#9ca3af',      // gray-400
        white: '#ffffff',
    },

    // Borders
    border: {
        light: '#e5e7eb',      // gray-200
        main: '#d1d5db',       // gray-300
    }
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
};

export const borderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
};

export const shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
    },
};

export const typography = {
    h1: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.text.primary,
    },
    h2: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text.primary,
    },
    h3: {
        fontSize: 20,
        fontWeight: '600',
        color: colors.text.primary,
    },
    body: {
        fontSize: 16,
        color: colors.text.primary,
    },
    bodySmall: {
        fontSize: 14,
        color: colors.text.secondary,
    },
    caption: {
        fontSize: 12,
        color: colors.text.light,
    },
};

// Common component styles
export const commonStyles = {
    // Card with green left border
    card: {
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        ...shadows.md,
    },

    cardWithBorder: {
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.xl,
        borderLeftWidth: 4,
        borderLeftColor: colors.primary.main,
        padding: spacing.lg,
        ...shadows.md,
    },

    // Primary button with gradient look
    primaryButton: {
        backgroundColor: colors.primary.main,
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.md,
    },

    primaryButtonText: {
        color: colors.text.white,
        fontSize: 16,
        fontWeight: '600',
    },

    // Secondary button
    secondaryButton: {
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border.main,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Input field
    input: {
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border.main,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        fontSize: 16,
        color: colors.text.primary,
    },

    inputFocused: {
        borderColor: colors.primary.main,
        borderWidth: 2,
    },

    // Header gradient background style (use LinearGradient)
    headerGradient: {
        paddingTop: 50, // Safe area
        paddingBottom: spacing.xl,
        paddingHorizontal: spacing.lg,
    },

    // Stat card
    statCard: {
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        borderLeftWidth: 4,
        ...shadows.sm,
    },
};

export default {
    colors,
    spacing,
    borderRadius,
    shadows,
    typography,
    commonStyles,
};
