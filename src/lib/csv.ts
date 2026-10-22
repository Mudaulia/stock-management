/**
 * CSV cell sanitization — defense against spreadsheet formula injection
 * (CSV injection / formula injection).
 *
 * Nilai yang diawali `=`, `+`, `-`, `@`, atau TAB/CR dapat dieksekusi sebagai
 * formula ketika file dibuka di Excel/LibreOffice. Cell berisiko diberi
 * prefix `'` (apostrophe) agar diperlakukan sebagai teks.
 */

const RISKY_PREFIX = /^[=+\-@\t\r]/;

export function escapeCsvCell(value: string): string {
  let cell = value.replace(/"/g, '""');

  if (RISKY_PREFIX.test(cell)) {
    cell = `'${cell}`;
  }

  // Karakter kontrol lain tidak diperbolehkan dalam satu cell CSV
  // (kecuali di dalam tanda kutip oleh parser — kita buang saja).
  cell = cell.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");

  return `"${cell}"`;
}

export function buildCsv(headers: string[], rows: string[][]): string {
  const lines = [
    headers.map((h) => escapeCsvCell(h)).join(","),
    ...rows.map((row) => row.map((cell) => escapeCsvCell(cell)).join(",")),
  ];
  return lines.join("\n");
}
