"use client";

import { useEffect, useState, type ReactNode } from "react";

type MobileNavMenuProps = {
  children: ReactNode;
};

export function MobileNavMenu({ children }: MobileNavMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative shrink-0 lg:hidden">
      <button
        type="button"
        className="relative z-40 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-stone-200 bg-white text-stone-700"
        aria-label="Open menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        ☰
      </button>

      {isOpen ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-20 bg-black/10"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="fixed left-0 right-0 top-[70px] z-30 border-y border-stone-200 bg-white px-4 py-3 shadow-sm"
            onClickCapture={(event) => {
              const target = event.target as HTMLElement;
              const actionElement = target.closest("a,button");
              if (actionElement) {
                setIsOpen(false);
              }
            }}
          >
            {children}
          </div>
        </>
      ) : null}
    </div>
  );
}
