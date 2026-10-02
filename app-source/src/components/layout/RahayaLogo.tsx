import React from 'react';

interface RahayaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
  className?: string;
  theme?: 'dark' | 'light';
}

export const RahayaLogo: React.FC<RahayaLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  theme = 'light',
}) => {
  const sizeMap = {
    sm: { px: 32, textClass: 'text-sm' },
    md: { px: 44, textClass: 'text-base' },
    lg: { px: 64, textClass: 'text-lg' },
    xl: { px: 88, textClass: 'text-xl' },
    '2xl': { px: 120, textClass: 'text-2xl' },
  };

  const { px } = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Exact vector illustration based on Rahaya Coffee official emblem */}
      <svg
        width={px}
        height={px}
        viewBox="0 0 240 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200"
      >
        {/* Outer Circular Rings */}
        <circle cx="120" cy="120" r="114" stroke="#0F2B5C" strokeWidth="8" />
        <circle cx="120" cy="120" r="102" stroke="#DC2626" strokeWidth="3" />
        <circle cx="120" cy="120" r="100" fill="#FFFFFF" />

        {/* Rising Steam: Navy Blue and Red dual swirls */}
        <path
          d="M102 85C95 72 100 56 112 44C118 38 126 31 124 23C136 34 135 48 126 58C117 68 114 77 116 85C110 85 106 85 102 85Z"
          fill="#0F2B5C"
        />
        <path
          d="M115 85C114 74 121 66 128 58C134 51 138 43 133 34C143 42 142 53 136 62C129 70 126 78 127 85H115Z"
          fill="#DC2626"
        />

        {/* Coffee Cup Body & Handle */}
        <path
          d="M80 87C80 87 72 135 120 135C168 135 160 87 160 87H80Z"
          fill="#FFFFFF"
          stroke="#0F2B5C"
          strokeWidth="6"
        />
        {/* Cup Rim Fill (Dark roasted espresso) */}
        <ellipse cx="120" cy="87" rx="39" ry="11" fill="#0F2B5C" />
        <ellipse cx="120" cy="87" rx="34" ry="8" fill="#582900" />
        <ellipse cx="120" cy="88" rx="27" ry="5" fill="#8B4513" />
        {/* Cup Handle */}
        <path
          d="M158 92C172 92 184 102 181 117C178 130 165 131 154 127"
          stroke="#0F2B5C"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        {/* Saucer / Plate */}
        <path
          d="M72 132C95 141 145 141 168 132"
          stroke="#0F2B5C"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* RAHAYA Typography in SVG with Red Slash Accents */}
        <g id="rahaya-text">
          {/* R */}
          <path
            d="M48 168V146H58C63 146 66 149 66 153C66 157 63 160 58 160H54V168H48ZM54 155H58C59.5 155 60.5 154.2 60.5 153C60.5 151.8 59.5 151 58 151H54V155ZM59 160L67 168H60.5L53.5 160.5H59Z"
            fill="#0F2B5C"
          />
          {/* A with Red Slash */}
          <path
            d="M72 168L80 146H86L94 168H88.5L87 163.5H79L77.5 168H72ZM80.5 159.5H85.5L83 151.5L80.5 159.5Z"
            fill="#0F2B5C"
          />
          <path d="M78 165L87 151" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
          {/* H */}
          <path
            d="M99 168V146H105V154.5H115V146H121V168H115V159.5H105V168H99Z"
            fill="#0F2B5C"
          />
          {/* A with Red Slash */}
          <path
            d="M126 168L134 146H140L148 168H142.5L141 163.5H133L131.5 168H126ZM134.5 159.5H139.5L137 151.5L134.5 159.5Z"
            fill="#0F2B5C"
          />
          <path d="M132 165L141 151" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
          {/* Y */}
          <path
            d="M153 146L160 157V168H165V157L172 146H166L162.5 152.5L159 146H153Z"
            fill="#0F2B5C"
          />
          {/* A with Red Slash */}
          <path
            d="M176 168L184 146H190L198 168H192.5L191 163.5H183L181.5 168H176ZM184.5 159.5H189.5L187 151.5L184.5 159.5Z"
            fill="#0F2B5C"
          />
          <path d="M182 165L191 151" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
        </g>

        {/* • C O F F E E • */}
        <line x1="48" y1="181" x2="68" y2="181" stroke="#0F2B5C" strokeWidth="2.5" />
        <text
          x="120"
          y="185"
          fill="#0F2B5C"
          fontSize="11"
          fontWeight="700"
          letterSpacing="5"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          COFFEE
        </text>
        <line x1="172" y1="181" x2="192" y2="181" stroke="#0F2B5C" strokeWidth="2.5" />
      </svg>

      {showText && (
        <div className="flex flex-col">
          <span
            className={`font-black tracking-tight leading-none ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            } text-lg`}
          >
            RAHAYA <span className="text-red-600">POS</span>
          </span>
          <span className="text-[11px] font-medium tracking-wider uppercase text-slate-500">
            Artisan F&B System
          </span>
        </div>
      )}
    </div>
  );
};
