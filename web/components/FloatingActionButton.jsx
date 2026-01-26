'use client';

/**
 * FloatingActionButton - FAB for quick actions
 */
import { useState } from 'react';

export default function FloatingActionButton({ actions = [] }) {
    const [isOpen, setIsOpen] = useState(false);

    const defaultActions = [
        { label: 'Add User', icon: '👤', onClick: () => window.location.href = '/admin/users?action=add' },
        { label: 'Create Task', icon: '📝', onClick: () => window.location.href = '/admin/tasks?action=create' },
        { label: 'Add Vehicle', icon: '🚗', onClick: () => window.location.href = '/admin/vehicles?action=add' },
    ];

    const actionList = actions.length > 0 ? actions : defaultActions;

    return (
        <div className="fixed bottom-8 right-8 z-50">
            {/* Action menu */}
            {isOpen && (
                <div className="mb-4 space-y-2">
                    {actionList.map((action, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                action.onClick();
                                setIsOpen(false);
                            }}
                            className="
                                flex items-center gap-3
                                bg-white
                                px-4 py-3
                                rounded-full
                                shadow-lg
                                hover:shadow-xl
                                transition-all duration-200
                                hover:scale-105
                                text-gray-800
                                font-medium
                                w-full
                                justify-end
                            "
                            style={{
                                animation: `slideIn 0.3s ease-out ${index * 0.1}s both`
                            }}
                        >
                            <span>{action.label}</span>
                            <span className="text-2xl">{action.icon}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Main FAB button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="
                    w-16 h-16
                    bg-gradient-to-br from-purple-500 to-pink-500
                    text-white
                    rounded-full
                    shadow-2xl
                    hover:shadow-3xl
                    transition-all duration-300
                    hover:scale-110
                    flex items-center justify-center
                    text-3xl
                "
            >
                {isOpen ? '✕' : '+'}
            </button>

            <style jsx>{`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
            `}</style>
        </div>
    );
}
