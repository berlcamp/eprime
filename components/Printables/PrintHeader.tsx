/* eslint-disable @next/next/no-img-element */
"use client";

/**
 * Shared header for printable documents.
 * Matches the PrintNosi header style.
 */
export function PrintHeader({ hrLine = false }: { hrLine?: boolean }) {
  return (
    <div className="text-center mb-2">
      <div className="flex justify-center">
        <img
          src="/logos/deped.png"
          alt="DepEd Seal"
          width={96}
          height={96}
          className="object-contain"
        />
      </div>
      <div className="mt-1" style={{ fontFamily: "'Old English Text MT', 'UnifrakturCook', serif" }}>
        <div className="text-base">Republic of the Philippines</div>
        <div className="text-2xl font-semibold">Department of Education</div>
      </div>
      <div className="text-xs tracking-wider">CARAGA REGION</div>
      <div className="text-base mt-1 font-semibold">
        SCHOOLS DIVISION OFFICE OF BAYUGAN CITY
      </div>
      {hrLine && <hr className="border-black mt-1" />}
    </div>
  );
}
