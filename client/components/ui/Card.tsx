interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export function Card({ children, className = '', onClick, hover = false }: CardProps) {
  const hoverClass = hover 
    ? 'cursor-pointer hover:shadow-lg hover:border-orange-200 transition-all duration-200' 
    : '';
  
  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${hoverClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
