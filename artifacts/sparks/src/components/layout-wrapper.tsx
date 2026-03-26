import React from 'react';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-zinc-950 p-2 sm:p-4">
      {/* Mobile constraint container */}
      <div className="relative w-full max-w-[430px] h-[100dvh] sm:h-[850px] sm:max-h-[90vh] bg-gradient-brand sm:rounded-[40px] overflow-hidden shadow-2xl sm:shadow-fuchsia-500/20 sm:border-[8px] border-black flex flex-col">
        {children}
      </div>
    </div>
  );
}
