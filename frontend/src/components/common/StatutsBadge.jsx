// components/common/StatusBadge.jsx
function StatusBadge({ status }) {
  const colors = {
    libre: 'bg-green-500',
    reservee: 'bg-yellow-500',
    occupee: 'bg-red-500',
  };
  const labels = {
    libre: 'Libre',
    reservee: 'Réservée',
    occupee: 'Occupée',
  };
  return (
    <span className={`${colors[status] || 'bg-gray-500'} text-white px-3 py-1 rounded-full text-xs font-medium`}>
      {labels[status] || status}
    </span>
  );
}
export default StatusBadge;