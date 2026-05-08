import { usePresence } from "@/modules/presence/PresenceProvider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function PresenceDot({ userId, showLabel = false }: { userId: string; showLabel?: boolean }) {
  const { isOnline } = usePresence();
  const online = isOnline(userId);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1.5 align-middle" aria-label={online ? "Online" : "Offline"}>
          <span
            className={`inline-block h-2 w-2 rounded-full ${online ? "bg-emerald-500 ring-2 ring-emerald-500/20" : "bg-muted-foreground/40"}`}
            aria-hidden
          />
          {showLabel && <span className="text-xs text-muted-foreground">{online ? "Online" : "Offline"}</span>}
        </span>
      </TooltipTrigger>
      <TooltipContent>{online ? "Online" : "Offline"}</TooltipContent>
    </Tooltip>
  );
}