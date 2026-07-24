const API_BASE = import.meta.env.VITE_API_URL || 'https://spectra-j42e.onrender.com/api';
const FILE_BASE = API_BASE.replace(/\/api\/?$/, '');

export function fileUrl(path: string | undefined): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${FILE_BASE}${path}`;
}
