/* eslint-disable @next/next/no-img-element */
"use client";

/**
 * Shared footer for printable documents.
 * Fixed to the bottom of the paper when printing.
 * Matches the PrintNosi footer style.
 */
export function PrintFooter() {
  return (
    <>
      <style>{`
        @media print {
          @page {
            margin: 1in;
          }
          .print-footer-fixed {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 0;
            background: white;
          }
        }
      `}</style>
      <div className="print-footer-fixed">
        <img
          src="/images/footer_logo.png"
          alt=""
          className="w-full h-auto object-contain"
        />
        <div className="text-center text-sm italic text-gray-500">
          This is a system generated document
        </div>
      </div>
    </>
  );
}
