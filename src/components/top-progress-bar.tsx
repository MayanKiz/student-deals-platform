import { cn } from "@/lib/utils";

function TopProgressBar({ active, className }: { active: boolean; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-transparent transition-opacity duration-200",
        active ? "opacity-100" : "opacity-0",
        className,
      )}
    >
      <div className="campus-progress-line h-full w-full" />
    </div>
  );
}

export { TopProgressBar };
