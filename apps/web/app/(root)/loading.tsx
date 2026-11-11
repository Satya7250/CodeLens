import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-[50vh] gap-3 text-muted-foreground">
      <Spinner className="size-6 text-primary" />
      <p className="text-sm">Loading CodeLens workspace...</p>
    </div>
  );
}
