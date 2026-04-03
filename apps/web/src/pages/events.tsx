import { useState } from "react";
import { useListEvents, getListEventsQueryKey } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Activity, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const severityStyles = {
  info: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" },
  warning: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-400" },
  success: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-400" },
  error: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
};

export default function EventsPage() {
  const [search, setSearch] = useState("");
  const { data: events, isLoading } = useListEvents({ limit: 100 }, { query: { queryKey: getListEventsQueryKey({ limit: 100 }) } });

  const filtered = events?.filter((event) => event.description.toLowerCase().includes(search.toLowerCase()) || event.eventType.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppLayout title="IoT Events">
      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search events..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" data-testid="input-search-events" />
        </div>
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
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>{event.severity}</span>
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
