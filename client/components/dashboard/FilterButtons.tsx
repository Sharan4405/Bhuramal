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
          className={`px-6 py-2.5 rounded-lg border-none cursor-pointer font-semibold shadow-sm transition-all ${
            currentFilter === filter
              ? 'bg-linear-to-r from-orange-500 to-orange-600 text-white shadow-md'
              : 'bg-white text-gray-700 hover:text-[rgb(var(--orange))] hover:bg-orange-50'
          }`}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}
