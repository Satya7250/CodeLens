export function BrandMark({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      aria-hidden="true"
      focusable="false"
      className={`inline-flex shrink-0 ${className}`}
    >
      <rect className="fill-white dark:fill-[#080808]" width="200" height="200" />
      <circle
        cx="100"
        cy="100"
        r="59"
        fill="none"
        stroke="#858585"
        strokeWidth="1.25"
      />
      <text
        x="100"
        y="101"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="54"
        fontWeight="400"
        fill="none"
        className="stroke-neutral-900 dark:stroke-neutral-100"
        strokeWidth="1.8"
        strokeLinejoin="round"
      >
        C
      </text>
    </svg>
  );
}
