"use client";

import React, { useId } from "react";

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export function Logo({ className = "w-6 h-6 text-black dark:text-white", ...props }: LogoProps) {
  const uniqueId = useId();
  const maskId = `ep-logo-mask-${uniqueId.replace(/:/g, "")}`;

  return (
    <svg
      viewBox="0 0 100 112"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="EncryptPlus Logo"
      {...props}
    >
      <defs>
        {/* Knockout mask for monocolor depth separation */}
        <mask id={maskId}>
          {/* Base white: reveals all base geometry */}
          <rect width="100" height="112" fill="white" />
          {/* Knockout margin around Plus sign */}
          <rect x="52" y="49" width="43" height="19" rx="6" fill="black" />
          <rect x="64" y="37" width="19" height="43" rx="6" fill="black" />
          {/* Horizontal cutouts inside the E */}
          <rect x="42.5" y="46.5" width="28" height="6" rx="1.5" fill="black" />
          <rect x="42.5" y="59.5" width="28" height="6" rx="1.5" fill="black" />
          {/* Inner cutout inside lock shackle */}
          <path d="M 43 36 V 26 C 43 22 46 19 50 19 C 54 19 57 22 57 26 V 36 Z" fill="black" />
        </mask>
      </defs>

      {/* Masked Shield & Padlock body */}
      <g mask={`url(#${maskId})`}>
        {/* Outer Shield Frame */}
        <path
          d="M 50 4 
             L 87 19.5 
             C 87 19.5, 89.5 50, 79 73 
             C 70 92, 50 108, 50 108 
             C 50 108, 30 92, 21 73 
             C 10.5 50, 13 19.5, 13 19.5 
             L 50 4 Z 
             M 50 12.5 
             L 20.5 25.5 
             C 18.5 50, 27 82, 50 99.5 
             C 73 82, 81.5 50, 79.5 25.5 
             L 50 12.5 Z"
          fillRule="evenodd"
        />

        {/* Lock Shackle */}
        <path
          d="M 36 36 
             V 26 
             C 36 18, 42 12, 50 12 
             C 58 12, 64 18, 64 26 
             V 36 
             H 36 Z"
        />

        {/* Lock Body */}
        <path
          d="M 32.5 36 
             C 30 36, 28 38, 28 40.5 
             V 71.5 
             C 28 75.5, 32.5 78.5, 39.5 79.5 
             C 45.5 80.5, 54.5 80.5, 61.5 79.5 
             C 68.5 78.5, 73 75.5, 73 71.5 
             V 40.5 
             C 73 38, 71 36, 68.5 36 
             H 32.5 Z"
        />
      </g>

      {/* Plus Sign */}
      <rect x="55.5" y="52.5" width="36" height="12" rx="3.5" />
      <rect x="67.5" y="40.5" width="12" height="36" rx="3.5" />
    </svg>
  );
}

export default Logo;
