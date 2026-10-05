import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-stone-200/80 overflow-hidden shadow-xs animate-pulse flex flex-col h-full">
      <div className="w-full h-52 bg-stone-200" />
      <div className="p-5 flex flex-col flex-1 gap-3">
        <div className="h-3 w-20 bg-stone-200 rounded" />
        <div className="h-6 w-3/4 bg-stone-200 rounded" />
        <div className="h-4 w-full bg-stone-100 rounded" />
        <div className="mt-auto pt-3 border-t border-stone-100 flex items-center justify-between">
          <div className="h-3 w-24 bg-stone-200 rounded" />
          <div className="h-3 w-16 bg-stone-200 rounded" />
        </div>
      </div>
    </div>
  );
};
