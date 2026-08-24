interface RatingStarsProps {
  value: number | null;
  onChange?: (value: number) => void;
  max?: number;
  size?: number;
}

/**
 * Rating bintang 1-5 (default). Kalau `onChange` diberikan, jadi interaktif
 * (form); kalau tidak, jadi display-only (list/detail).
 */
export function RatingStars({ value, onChange, max = 5, size = 16 }: RatingStarsProps) {
  const stars = Array.from({ length: max }, (_, i) => i + 1);
  const isInteractive = Boolean(onChange);

  return (
    <div className="flex items-center gap-0.5" role={isInteractive ? "radiogroup" : undefined}>
      {stars.map((star) => {
        const filled = value !== null && star <= value;
        return (
          <button
            key={star}
            type={isInteractive ? "button" : undefined}
            disabled={!isInteractive}
            onClick={isInteractive ? () => onChange?.(star) : undefined}
            aria-label={`${star} dari ${max} bintang`}
            className={isInteractive ? "cursor-pointer" : "cursor-default"}
          >
            <svg
              width={size}
              height={size}
              viewBox="0 0 24 24"
              fill={filled ? "#c9924d" : "none"}
              stroke={filled ? "#c9924d" : "#6b6c74"}
              strokeWidth={1.5}
            >
              <path
                d="M12 3.5l2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.2 5.9-.8L12 3.5z"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
