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
 * Signature element (Bagian 3.5, WAJIB): avatar inisial kecil menunjukkan
 * siapa terakhir mengubah data — penegasan bahwa app ini ruang berdua,
 * bukan app generik single-user. Dipakai di setiap card/item data.
 */
export function LastEditedBy({ name, size = "sm" }: LastEditedByProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const dimensions = size === "sm" ? "h-5 w-5 text-[10px]" : "h-7 w-7 text-xs";

  return (
    <span
      title={`Terakhir diubah oleh ${name}`}
      aria-label={`Terakhir diubah oleh ${name}`}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-medium text-white ${dimensions}`}
      style={{ backgroundColor: colorForName(name) }}
    >
      {initial}
    </span>
  );
}
