export default function StatusBadge({ status }) {
  const value = (status || 'pending').toLowerCase();
  const className = value === 'approved' ? 'badge success' : value === 'rejected' ? 'badge danger' : 'badge warning';

  return <span className={className}>{status || 'Pending'}</span>;
}
