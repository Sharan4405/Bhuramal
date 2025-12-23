interface BadgeProps {
  status: 'OPEN' | 'RESOLVED';
}

export function Badge({ status }: BadgeProps) {
  return (
    <span className={status === 'OPEN' ? 'badge-open' : 'badge-resolved'}>
      {status}
    </span>
  );
}
