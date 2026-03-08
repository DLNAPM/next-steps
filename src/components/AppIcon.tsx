import React from 'react';

interface AppIconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function AppIcon({ className = '', size = 'md' }: AppIconProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <div className={`relative flex items-center justify-center bg-gradient-to-br from-indigo-600 to-blue-700 rounded-xl shadow-lg text-white ${sizeClasses[size]} ${className}`}>
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="w-3/4 h-3/4"
      >
        {/* Back Document (Stack effect) */}
        <path 
          d="M7 4h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" 
          className="text-indigo-200 fill-white/5"
          transform="translate(1, -1)"
        />

        {/* Main Document */}
        <rect 
          x="5" 
          y="5" 
          width="14" 
          height="16" 
          rx="1" 
          className="text-white fill-white/10" 
        />
        
        {/* Document Lines */}
        <path d="M9 9h6" className="text-indigo-100" />
        <path d="M9 12h6" className="text-indigo-100" />
        <path d="M9 15h4" className="text-indigo-100" />

        {/* Seal */}
        <circle cx="15" cy="17" r="2" className="fill-indigo-300 text-indigo-300" />
        <path d="M14 18l1 -1l1 1" className="text-indigo-800" strokeWidth="1" />

        {/* Hands holding the document */}
        {/* Left Hand Thumb */}
        <path 
          d="M4 18c0-2 1.5-3 3.5-3h.5" 
          className="text-white" 
          strokeWidth="2"
        />
        {/* Right Hand Thumb */}
        <path 
          d="M20 18c0-2-1.5-3-3.5-3h-.5" 
          className="text-white" 
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}
