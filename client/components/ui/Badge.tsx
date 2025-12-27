import { ReactNode } from 'react';

interface BadgeProps {
  status?: 'OPEN' | 'RESOLVED';
  variant?: 'success' | 'error' | 'warning' | 'gray' | 'blue' | 'yellow' | 'purple' | 'indigo';
  children?: ReactNode;
}

export function Badge({ status, variant, children }: BadgeProps) {
  // Legacy support for status prop
  if (status) {
    return (
      <span className={status === 'OPEN' ? 'badge-open' : 'badge-resolved'}>
        {status}
      </span>
    );
  }

  // New variant-based styling
  const variantClasses = {
    success: 'bg-green-100 text-green-800 border-green-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200'
  };

  const className = variantClasses[variant || 'gray'];

  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${className}`}>
      {children}
    </span>
  );
}
