/* eslint-disable @next/next/no-img-element */
"use client";

/**
 * Shared header for printable documents.
 * Matches the PrintNosi header style.
 */
export function PrintHeader() {
  return (
    <div className="text-center mb-2">
      <div className="flex justify-center">
        <img
          src="/deped_header.png"
          alt="DepEd Logo"
          width={300}
          height={300}
          className="object-contain"
        />
      </div>
      <div className="text-base mt-1">
        SCHOOLS DIVISION OFFICE OF BAYUGAN CITY
      </div>
      <hr className="border-black mt-1" />
    </div>
  );
}
