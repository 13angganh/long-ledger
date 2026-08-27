interface LastEditedByProps {
  name: string;
  size?: "sm" | "md";
}

const PALETTE = [
  "#4a7861", // emerald
  "#c9924d", // amber
  "#6b7fa8",
  "#a8708c",
  "#8ba85a",
];

function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

/**
 * Signature element (Bagian 3.5, WAJIB): NAMA editor sebagai teks, dengan
 * titik warna kecil sebagai aksen visual (bukan avatar berisi huruf — di
 * ukuran sangat kecil, huruf jadi tidak terbaca dan butuh font-size di luar
 * token resmi). PENTING: tidak ada mode avatar-only tanpa nama — untuk
 * pasangan nama yang inisialnya bertabrakan (mis. "Angga" dan "Arfilia"
 * sama-sama "A"), avatar/inisial saja gagal membedakan siapa yang
 * mengedit. Nama selalu tampil sebagai teks, di semua ukuran/konteks.
 */
export function LastEditedBy({ name, size = "sm" }: LastEditedByProps) {
  const dotSize = size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2";
  const nameTextSize = size === "sm" ? "text-xs" : "text-sm";
  const color = colorForName(name);

  return (
    <span
      title={`Terakhir diubah oleh ${name}`}
      className="inline-flex min-w-0 shrink-0 items-center gap-1.5"
    >
      <span
        aria-hidden
        className={`inline-block shrink-0 rounded-full ${dotSize}`}
        style={{ backgroundColor: color }}
      />
      <span className={`truncate text-text-secondary ${nameTextSize}`}>{name}</span>
    </span>
  );
}
