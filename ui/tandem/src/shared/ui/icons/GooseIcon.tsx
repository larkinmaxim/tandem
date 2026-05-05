export function GooseIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <title>Tandem</title>
      {/* Back disc */}
      <circle cx="14.5" cy="10" r="8" className="fill-[#CECECE] dark:fill-[#6E6E6E]" />
      {/* Back dot */}
      <circle cx="16.5" cy="8" r="2" fill="#9E9E9E" />
      {/* Front disc */}
      <circle cx="9.5" cy="14" r="8" className="fill-[#CECECE] dark:fill-[#6E6E6E]" />
      {/* Front dot (brand orange) */}
      <circle cx="7.5" cy="12" r="2" fill="#F37021" />
    </svg>
  );
}

export { GooseIcon as TandemIcon };

export function Rain(_props: { className?: string }) {
  return null;
}
