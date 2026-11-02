const statusClass = {
  Pending: 'status-badge--pending',
  'In progress': 'status-badge--progress',
  Resolved: 'status-badge--resolved',
};

export function StatusBadge({ children }) {
  return <span className={`status-badge ${statusClass[children] || ''}`}>{children}</span>;
}
