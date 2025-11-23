export function exportToCsv(filename: string, rows: Record<string, any>[]) {
  if (!rows || rows.length === 0) {
    console.warn('No data to export');
    return;
  }

  const keys = Object.keys(rows[0]);
  const escape = (val: any) => {
    if (val === null || val === undefined) return '';
    const s = String(val);
    // escape double quotes
    return '"' + s.replace(/"/g, '""') + '"';
  };

  const lines = [keys.join(',')];
  for (const row of rows) {
    lines.push(keys.map((k) => escape(row[k])).join(','));
  }

  const csv = lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default exportToCsv;
