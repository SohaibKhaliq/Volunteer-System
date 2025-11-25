import React from 'react';

const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div role="status" aria-busy="true" className={`animate-pulse bg-white p-4 rounded-lg shadow-sm ${className}`}>
      <div className="flex items-center gap-4">
        <div className="rounded-full bg-gray-200 h-10 w-10" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-3 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="h-3 bg-gray-200 rounded" />
        <div className="h-3 bg-gray-200 rounded" />
        <div className="h-3 bg-gray-200 rounded" />
      </div>
    </div>
  );
};

export default SkeletonCard;
