import React from 'react';

export default function Button({ children, onClick, className = '' }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-sm ${className}`}
    >
      {children}
    </button>
  );
}
