import { useState } from "react";
import { useGetAdherenceStats, useListAdherenceRecords, useListUsers, getGetAdherenceStatsQueryKey, getListAdherenceRecordsQueryKey, getListUsersQueryKey } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { BarChart3, Search, CheckCircle2, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCurrentUser } from "@/lib/auth";

export default function AdherencePage() {
  const user = getCurrentUser();
  const [search, setSearch] = useState("");
  const [patientId, setPatientId] = useState(user?.role === "patient" ? String(user.id) : "");

  const patientFilter = patientId ? { patientId: parseInt(patientId) } : {};
  const { data: records, isLoading } = useListAdherenceRecords(patientFilter, { query: { queryKey: getListAdherenceRecordsQueryKey() } });
  const { data: stats } = useGetAdherenceStats(patientFilter, { query: { queryKey: getGetAdherenceStatsQueryKey(patientFilter) } });
  const { data: patients } = useListUsers({ role: "patient" }, { query: { enabled: user?.role !== "patient", queryKey: getListUsersQueryKey({ role: "patient" }) } });

  const filtered = records?.filter((record) => record.status.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppLayout title="Adherence">
      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search adherence..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" data-testid="input-search-adherence" />
        </div>
        {user?.role !== "patient" && (
          <Select value={patientId} onValueChange={setPatientId}>
            <SelectTrigger className="w-60"><SelectValue placeholder="All patients" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All patients</SelectItem>
              {patients?.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border p-5 card-hover">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-white" /></div>
              <div>
                <div className="text-2xl font-bold">{stats.adherenceRate}%</div>
                <div className="text-sm text-muted-foreground">Adherence Rate</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border p-5 card-hover">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-white" /></div>
              <div>
                <div className="text-2xl font-bold">{stats.takenDoses}</div>
                <div className="text-sm text-muted-foreground">Taken Doses</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border p-5 card-hover">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center"><XCircle className="w-5 h-5 text-white" /></div>
              <div>
                <div className="text-2xl font-bold">{stats.missedDoses}</div>
                <div className="text-sm text-muted-foreground">Missed Doses</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-white rounded-2xl border animate-pulse" />)}</div>
      ) : filtered && filtered.length > 0 ? (
        <div className="bg-white rounded-2xl border divide-y">
          {filtered.map((record) => (
            <div key={record.id} className="p-5 flex items-center gap-4" data-testid={`adherence-row-${record.id}`}>
              <div className={`w-3 h-3 rounded-full ${record.status === "taken" ? "bg-green-500" : record.status === "missed" ? "bg-red-500" : "bg-gray-400"}`} />
              <div className="flex-1">
                <div className="font-medium capitalize">{record.status}</div>
                <div className="text-sm text-muted-foreground">Scheduled {new Date(record.scheduledAt).toLocaleString("en-IN")}</div>
              </div>
              {record.takenAt && <div className="text-xs text-muted-foreground">Taken {new Date(record.takenAt).toLocaleString("en-IN")}</div>}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border py-16 text-center">
          <BarChart3 className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-muted-foreground">No adherence records found</p>
        </div>
      )}
    </AppLayout>
  );
}
