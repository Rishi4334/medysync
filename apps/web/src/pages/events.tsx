import { useState } from "react";
import { useListEvents, useDeleteEvent, useClearEventsByType, getListEventsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Activity, Search, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const severityStyles = {
  info: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" },
  warning: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-400" },
  success: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-400" },
  error: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
};

export default function EventsPage() {
  const [search, setSearch] = useState("");
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: events, isLoading } = useListEvents({ limit: 100 }, { query: { queryKey: getListEventsQueryKey({ limit: 100 }) } });
  const deleteEvent = useDeleteEvent();
  const clearEventsByType = useClearEventsByType();

  const filtered = events?.filter((event) => event.description.toLowerCase().includes(search.toLowerCase()) || event.eventType.toLowerCase().includes(search.toLowerCase()));

  function adherenceImpactLabel(eventType: string): string | null {
    if (eventType === "reminder_triggered") return "Adherence: pending started";
    if (eventType === "box_opened" || eventType === "medicine_taken") return "Adherence: may mark taken (only after reminder)";
    if (eventType === "medicine_missed") return "Adherence: may mark missed (only after reminder)";
    return null;
  }

  return (
    <AppLayout title="IoT Events">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search events..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" data-testid="input-search-events" />
        </div>
        <Button
          variant="outline"
          disabled={clearEventsByType.isPending}
          onClick={() =>
            clearEventsByType.mutate(
              { eventType: "device_online" },
              {
                onSuccess: (result) => {
                  qc.invalidateQueries({ queryKey: getListEventsQueryKey({ limit: 100 }) });
                  toast({ title: `Cleared ${result.deleted} device_online events` });
                },
                onError: () => toast({ title: "Failed to clear device_online events", variant: "destructive" }),
              },
            )
          }
          data-testid="button-clear-device-online"
        >
          {clearEventsByType.isPending ? "Clearing..." : "Clear device_online"}
        </Button>
      </div>

      <div className="mb-4 rounded-xl border bg-amber-50 px-4 py-3 text-xs text-amber-900" data-testid="adherence-flow-note">
        Adherence flow: <span className="font-semibold">Reminder Triggered</span> {"->"} <span className="font-semibold">Pending</span> {"->"} <span className="font-semibold">Taken/Missed</span>.
        Random motion/box events without a recent reminder are ignored for adherence.
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-20 bg-white rounded-2xl border animate-pulse" />)}</div>
      ) : filtered && filtered.length > 0 ? (
        <div className="bg-white rounded-2xl border divide-y">
          {filtered.map((event) => {
            const s = severityStyles[event.severity as keyof typeof severityStyles] ?? severityStyles.info;
            return (
              <div key={event.id} className="p-5 flex items-start gap-3" data-testid={`event-row-${event.id}`}>
                <div className={`mt-1 w-2.5 h-2.5 rounded-full ${s.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{event.description}</div>
                  <div className="text-xs text-muted-foreground mt-1">{event.eventType} • {new Date(event.timestamp).toLocaleString("en-IN")}</div>
                  {adherenceImpactLabel(event.eventType) && (
                    <div className="mt-1 inline-block rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-700">
                      {adherenceImpactLabel(event.eventType)}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>{event.severity}</span>
                  <button
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500"
                    onClick={() =>
                      deleteEvent.mutate(
                        { id: event.id },
                        {
                          onSuccess: () => {
                            qc.invalidateQueries({ queryKey: getListEventsQueryKey({ limit: 100 }) });
                          },
                          onError: () => toast({ title: "Failed to delete event", variant: "destructive" }),
                        },
                      )
                    }
                    title="Delete event"
                    data-testid={`button-delete-event-${event.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border py-16 text-center">
          <Activity className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-muted-foreground">No events found</p>
        </div>
      )}
    </AppLayout>
  );
}
