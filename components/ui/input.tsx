import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onWheel, onKeyDown, onChange, min, ...props }, ref) => {
    const isNumber = type === "number";
    const mergedMin = isNumber && min === undefined ? 0 : min;

    return (
      <input
        type={type}
        min={mergedMin}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        onWheel={
          isNumber
            ? (e) => {
                e.preventDefault();
                onWheel?.(e);
              }
            : onWheel
        }
        onKeyDown={
          isNumber
            ? (e) => {
                if (["ArrowUp", "ArrowDown", "-"].includes(e.key))
                  e.preventDefault();
                onKeyDown?.(e);
              }
            : onKeyDown
        }
        onChange={
          isNumber
            ? (e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v) && v < 0) e.target.value = "0";
                onChange?.(e);
              }
            : onChange
        }
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

/** Drop-in for raw <input type="number"> with scroll/arrow/negative prevention */
const NumberInput = React.forwardRef<
  HTMLInputElement,
  Omit<React.ComponentProps<"input">, "type">
>(({ className, onWheel, onKeyDown, onChange, min, ...props }, ref) => (
  <input
    type="number"
    min={min ?? 0}
    className={className}
    ref={ref}
    // onWheel={(e) => {
    //   e.preventDefault();
    //   onWheel?.(e);
    // }}
    // onKeyDown={(e) => {
    //   if (["ArrowUp", "ArrowDown", "-"].includes(e.key)) e.preventDefault();
    //   onKeyDown?.(e);
    // }}
    // onChange={(e) => {
    //   const value = parseFloat(e.target.value);
    //   if (!isNaN(value) && value < 0) e.target.value = "0";
    //   onChange?.(e);
    // }}
    {...props}
  />
));
NumberInput.displayName = "NumberInput";

export { Input, NumberInput };
