import { TandemIcon } from "@/shared/ui/icons/TandemIcon";
import { cn } from "@/shared/lib/cn";

interface GooseLogoProps {
  className?: string;
  size?: "default" | "small";
  hover?: boolean;
}

export function GooseLogo({
  className = "",
  size = "default",
}: GooseLogoProps) {
  const sizes = {
    default: {
      frame: "w-16 h-16",
      goose: "w-16 h-16",
    },
    small: {
      frame: "w-8 h-8",
      goose: "w-8 h-8",
    },
  } as const;

  const currentSize = sizes[size];

  return (
    <div
      className={cn(
        className,
        currentSize.frame,
        "relative overflow-hidden",
      )}
    >
      <TandemIcon
        className={cn(currentSize.goose, "absolute left-0 bottom-0 z-[2]")}
      />
    </div>
  );
}
