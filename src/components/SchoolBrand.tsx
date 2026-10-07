import React from 'react';

interface SchoolBrandProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
  showSubtitle?: boolean;
  className?: string;
}

export const SchoolBrand: React.FC<SchoolBrandProps> = ({
  size = 'md',
  variant = 'light',
  showSubtitle = true,
  className = '',
}) => {
  const isDark = variant === 'dark';

  const crestSizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
  };

  const titleSizes = {
    sm: 'text-xs font-bold',
    md: 'text-sm font-extrabold',
    lg: 'text-lg font-black',
  };

  const subtitleSizes = {
    sm: 'text-[9px]',
    md: 'text-[11px]',
    lg: 'text-xs',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Refined Academic Monogram Shield */}
      <div
        className={`${crestSizes[size]} relative shrink-0 rounded-xl flex items-center justify-center font-black tracking-wider transition-transform duration-200 shadow-md ${
          isDark
            ? 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-amber-300 border border-amber-500/30 ring-1 ring-white/10'
            : 'bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 text-amber-300 border border-amber-500/30 ring-1 ring-blue-950/20'
        }`}
        style={{
          boxShadow: '0 4px 12px -2px rgba(15, 23, 42, 0.25)',
        }}
      >
        {/* Subtle decorative inner crest notch */}
        <span className="font-serif tracking-widest text-amber-300 font-bold">
          SVA
        </span>
        <span
          className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-slate-900"
          title="Active Academic Institution"
        />
      </div>

      <div className="flex flex-col min-w-0">
        <span
          className={`${titleSizes[size]} tracking-tight leading-tight uppercase font-serif ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}
        >
          Saraswati Vidya Academy
        </span>
        {showSubtitle && (
          <span
            className={`${subtitleSizes[size]} font-semibold tracking-wider uppercase ${
              isDark ? 'text-amber-300/90' : 'text-blue-900'
            }`}
          >
            SVA School Communication Hub
          </span>
        )}
      </div>
    </div>
  );
};
