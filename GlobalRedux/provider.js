"use client";

import { useRef } from "react";
import { Provider } from "react-redux";
import { store } from "./store";

export function Providers({ children }) {
  // Use useRef to ensure Provider is stable across renders
  const storeRef = useRef(store);

  return <Provider store={storeRef.current}>{children}</Provider>;
}
