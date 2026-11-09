export const normalizeRollNumber = (value = '') => String(value).trim().toUpperCase();

export const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatFileSize = (size) => {
  if (!size) return '0 KB';
  const units = ['Bytes', 'KB', 'MB', 'GB'];
  let number = Number(size);
  let unitIndex = 0;

  while (number >= 1024 && unitIndex < units.length - 1) {
    number /= 1024;
    unitIndex += 1;
  }

  return `${number.toFixed(number >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

export const getStatusColor = (status = 'pending') => {
  const normalized = String(status).toLowerCase();
  if (normalized === 'approved') return 'success';
  if (normalized === 'rejected') return 'danger';
  return 'warning';
};

export const makeId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const buildStudentProfileUpdate = (formData) => ({
  phone: formData.phone?.trim(),
  branch: formData.branch,
  year: formData.year,
  updatedAt: new Date().toISOString(),
});
