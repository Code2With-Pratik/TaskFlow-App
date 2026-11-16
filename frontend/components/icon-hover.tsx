"use client";

import type { ReactElement } from "react";
import { AnimateIcon } from "@animate-ui/react/icons";

export function IconHover({ children }: { children: ReactElement }) {
  return (
    <AnimateIcon animateOnHover animateOnTap asChild>
      {children}
    </AnimateIcon>
  );
}
