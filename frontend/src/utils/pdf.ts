import api from '../api/axios';

export async function downloadPdf(url: string, filename: string) {
  try {
    const r = await api.get(url, { responseType: 'blob' });
    const blobUrl = URL.createObjectURL(r.data);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error('Failed to download PDF:', err);
  }
}
