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
            padding: 12px 1in;
            background: white;
          }
        }
      `}</style>
      <div className="mt-6 pt-3 border-t-2 border-black flex items-start gap-4 text-sm print-footer-fixed">
        <img
          src="/logo3.png"
          alt=""
          width={196}
          height={196}
          className="object-contain flex-shrink-0"
        />
        <div>
          <div>DepEd Bldg., Palusapis Street, Poblacion, Bayugan City</div>
          <div className="text-blue-600">deped.bayugan@gmail.com</div>
          <div>Telephone Numbers: (085) 231-1496, (085) 231-1924</div>
          <div>Mobile No: 0962-867-6334</div>
        </div>
      </div>
    </>
  );
}
