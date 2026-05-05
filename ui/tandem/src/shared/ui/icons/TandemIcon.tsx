export function TandemIcon({ className = "" }: { className?: string }) {
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
      <circle cx="15.26" cy="11.98" r="7.55" className="fill-[#5a5b62] dark:fill-[#CECECE]" />
      <circle cx="15.26" cy="11.98" r="2.95" className="fill-[#2a2b31] dark:fill-[#9E9E9E]" />
      <circle cx="8.77" cy="11.98" r="7.55" className="fill-[#3a3b40] dark:fill-[#6E6E6E]" />
      <circle cx="8.77" cy="11.98" r="2.95" fill="#F37021" />
    </svg>
  );
}
