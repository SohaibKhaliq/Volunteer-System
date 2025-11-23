// Simple client-side CSV exporter
export default function exportToCsv(filename: string, rows: Record<string, any>[]) {
  if (!rows || !rows.length) {
    const blob = new Blob([''], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    return;
  }

  const keys = Object.keys(rows[0]);
  const csvRows = [keys.join(',')];

  for (const row of rows) {
    const values = keys.map((k) => {
      const val = row[k];
      if (val === null || val === undefined) return '';
      const str = String(val).replace(/"/g, '""');
      // if contains comma, newline or double quote, wrap in quotes
      return /[",\n]/.test(str) ? `"${str}"` : str;
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
}
