'use client';

interface FilterButtonsProps {
  currentFilter: 'ALL' | 'OPEN' | 'RESOLVED';
  onFilterChange: (filter: 'ALL' | 'OPEN' | 'RESOLVED') => void;
}

export function FilterButtons({ currentFilter, onFilterChange }: FilterButtonsProps) {
  const filters: ('ALL' | 'OPEN' | 'RESOLVED')[] = ['ALL', 'OPEN', 'RESOLVED'];

  return (
    <div className="flex gap-2 mb-6">
      {filters.map((filter) => (
        <button
          key={filter}
          onClick={() => onFilterChange(filter)}
          className={`px-4 py-2 rounded-lg border-none cursor-pointer font-medium shadow-sm transition-all ${
            currentFilter === filter
              ? 'bg-[rgb(var(--orange))] text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}
