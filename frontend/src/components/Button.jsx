import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({ children, onClick, disabled, loading, variant = 'primary', className = '' }) => {
    const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2";
    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400",
        secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:bg-gray-50",
        outline: "border border-gray-300 text-gray-700 hover:bg-gray-50"
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            className={`${baseStyle} ${variants[variant]} ${className}`}
        >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {children}
        </button>
    );
};
