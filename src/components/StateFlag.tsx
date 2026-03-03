"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * State flag component that displays the official US state flag.
 * Uses Wikipedia Commons SVGs (public domain) with a styled abbreviation fallback.
 *
 * To use local SVGs instead: add files to public/flags/{code}.svg
 * and change the src to `/flags/${code}.svg`
 */

// Map state codes to Wikipedia Commons SVG filenames
// These are the most common/stable URLs for US state flags
const STATE_FLAG_URLS: Record<string, string> = {
  AL: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Flag_of_Alabama.svg/255px-Flag_of_Alabama.svg.png",
  AK: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Flag_of_Alaska.svg/255px-Flag_of_Alaska.svg.png",
  AZ: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Flag_of_Arizona.svg/255px-Flag_of_Arizona.svg.png",
  AR: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Flag_of_Arkansas.svg/255px-Flag_of_Arkansas.svg.png",
  CA: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Flag_of_California.svg/255px-Flag_of_California.svg.png",
  CO: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Flag_of_Colorado.svg/255px-Flag_of_Colorado.svg.png",
  CT: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Flag_of_Connecticut.svg/255px-Flag_of_Connecticut.svg.png",
  DE: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Flag_of_Delaware.svg/255px-Flag_of_Delaware.svg.png",
  FL: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Flag_of_Florida.svg/255px-Flag_of_Florida.svg.png",
  GA: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Flag_of_Georgia_%28U.S._state%29.svg/255px-Flag_of_Georgia_%28U.S._state%29.svg.png",
  HI: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Flag_of_Hawaii.svg/255px-Flag_of_Hawaii.svg.png",
  ID: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Flag_of_Idaho.svg/255px-Flag_of_Idaho.svg.png",
  IL: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Flag_of_Illinois.svg/255px-Flag_of_Illinois.svg.png",
  IN: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Flag_of_Indiana.svg/255px-Flag_of_Indiana.svg.png",
  IA: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Flag_of_Iowa.svg/255px-Flag_of_Iowa.svg.png",
  KS: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Flag_of_Kansas.svg/255px-Flag_of_Kansas.svg.png",
  KY: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Flag_of_Kentucky.svg/255px-Flag_of_Kentucky.svg.png",
  LA: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Flag_of_Louisiana.svg/255px-Flag_of_Louisiana.svg.png",
  ME: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Flag_of_Maine.svg/255px-Flag_of_Maine.svg.png",
  MD: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Flag_of_Maryland.svg/255px-Flag_of_Maryland.svg.png",
  MA: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Flag_of_Massachusetts.svg/255px-Flag_of_Massachusetts.svg.png",
  MI: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Flag_of_Michigan.svg/255px-Flag_of_Michigan.svg.png",
  MN: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Flag_of_Minnesota.svg/255px-Flag_of_Minnesota.svg.png",
  MS: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Flag_of_Mississippi.svg/255px-Flag_of_Mississippi.svg.png",
  MO: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Flag_of_Missouri.svg/255px-Flag_of_Missouri.svg.png",
  MT: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Flag_of_Montana.svg/255px-Flag_of_Montana.svg.png",
  NE: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Flag_of_Nebraska.svg/255px-Flag_of_Nebraska.svg.png",
  NV: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Flag_of_Nevada.svg/255px-Flag_of_Nevada.svg.png",
  NH: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Flag_of_New_Hampshire.svg/255px-Flag_of_New_Hampshire.svg.png",
  NJ: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Flag_of_New_Jersey.svg/255px-Flag_of_New_Jersey.svg.png",
  NM: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Flag_of_New_Mexico.svg/255px-Flag_of_New_Mexico.svg.png",
  NY: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Flag_of_New_York.svg/255px-Flag_of_New_York.svg.png",
  NC: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Flag_of_North_Carolina.svg/255px-Flag_of_North_Carolina.svg.png",
  ND: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Flag_of_North_Dakota.svg/255px-Flag_of_North_Dakota.svg.png",
  OH: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Flag_of_Ohio.svg/255px-Flag_of_Ohio.svg.png",
  OK: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Flag_of_Oklahoma.svg/255px-Flag_of_Oklahoma.svg.png",
  OR: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Flag_of_Oregon.svg/255px-Flag_of_Oregon.svg.png",
  PA: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Flag_of_Pennsylvania.svg/255px-Flag_of_Pennsylvania.svg.png",
  RI: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Flag_of_Rhode_Island.svg/255px-Flag_of_Rhode_Island.svg.png",
  SC: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Flag_of_South_Carolina.svg/255px-Flag_of_South_Carolina.svg.png",
  SD: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Flag_of_South_Dakota.svg/255px-Flag_of_South_Dakota.svg.png",
  TN: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Flag_of_Tennessee.svg/255px-Flag_of_Tennessee.svg.png",
  TX: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Flag_of_Texas.svg/255px-Flag_of_Texas.svg.png",
  UT: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Flag_of_Utah.svg/255px-Flag_of_Utah.svg.png",
  VT: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Flag_of_Vermont.svg/255px-Flag_of_Vermont.svg.png",
  VA: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Flag_of_Virginia.svg/255px-Flag_of_Virginia.svg.png",
  WA: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Flag_of_Washington.svg/255px-Flag_of_Washington.svg.png",
  WV: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Flag_of_West_Virginia.svg/255px-Flag_of_West_Virginia.svg.png",
  WI: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Flag_of_Wisconsin.svg/255px-Flag_of_Wisconsin.svg.png",
  WY: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Flag_of_Wyoming.svg/255px-Flag_of_Wyoming.svg.png",
};

// State-specific colors for the fallback badges
const STATE_COLORS: Record<string, string> = {
  TX: "bg-blue-800",
  CA: "bg-blue-700",
  FL: "bg-red-600",
  NC: "bg-red-700",
  GA: "bg-red-800",
  TN: "bg-red-600",
  SC: "bg-blue-900",
  AL: "bg-red-700",
  MS: "bg-blue-800",
  LA: "bg-blue-700",
  OK: "bg-green-800",
  AR: "bg-red-700",
  MO: "bg-red-600",
  KS: "bg-blue-700",
  NM: "bg-yellow-500",
  AZ: "bg-red-600",
  CO: "bg-blue-700",
};

interface StateFlagProps {
  stateCode: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
}

export default function StateFlag({
  stateCode,
  size = "md",
  className = "",
  showLabel = false,
}: StateFlagProps) {
  const [imgError, setImgError] = useState(false);
  const code = stateCode?.toUpperCase();
  const flagUrl = STATE_FLAG_URLS[code];

  const sizeClasses = {
    sm: "w-6 h-4",
    md: "w-10 h-7",
    lg: "w-16 h-11",
  };

  const badgeSizes = {
    sm: "w-6 h-4 text-[8px]",
    md: "w-10 h-7 text-[10px]",
    lg: "w-16 h-11 text-sm",
  };

  if (!code) return null;

  // Fallback badge
  if (!flagUrl || imgError) {
    const bgColor = STATE_COLORS[code] || "bg-slate-600";
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        <div
          className={`${badgeSizes[size]} ${bgColor} rounded-sm flex items-center justify-center text-white font-bold shadow-sm border border-white/20`}
        >
          {code}
        </div>
        {showLabel && (
          <span className="text-xs text-slate-500 font-medium">{code}</span>
        )}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div
        className={`${sizeClasses[size]} relative rounded-sm overflow-hidden shadow-sm border border-slate-200`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={flagUrl}
          alt={`${code} state flag`}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      </div>
      {showLabel && (
        <span className="text-xs text-slate-500 font-medium">{code}</span>
      )}
    </div>
  );
}
