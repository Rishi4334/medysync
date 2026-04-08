import { useState } from "react";
import { Link } from "wouter";
import { useListUsers, useListDevices, useListAdherenceRecords, getListUsersQueryKey, getListDevicesQueryKey, getListAdherenceRecordsQueryKey } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Users, Search, ChevronRight, TrendingUp, Phone, Mail, Cpu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function PatientsPage() {
  const [search, setSearch] = useState("");
  const { data: patients, isLoading } = useListUsers({ role: "patient" }, { query: { queryKey: getListUsersQueryKey({ role: "patient" }) } });
  const { data: devices } = useListDevices({ query: { queryKey: getListDevicesQueryKey() } });
  const { data: adherence } = useListAdherenceRecords({}, { query: { queryKey: getListAdherenceRecordsQueryKey() } });

  const filtered = patients?.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase()));

  function getAdherenceRate(patientId: number): number {
    if (!adherence) return 0;
    const records = adherence.filter((r) => r.patientId === patientId);
    if (records.length === 0) return 0;
    const taken = records.filter((r) => r.status === "taken").length;
    return Math.round((taken / records.length) * 100);
  }

  return (
    <AppLayout title="Patients">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search patients..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" data-testid="input-search-patients" />
        </div>
        <div className="text-sm text-muted-foreground sm:ml-auto">{filtered?.length ?? 0} patients</div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white rounded-2xl border animate-pulse" />)}</div>
      ) : filtered && filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((patient) => {
            const rate = getAdherenceRate(patient.id);
            const mappedDevice = devices?.find((device) => device.patientId === patient.id);
            return (
              <Link key={patient.id} href={`/patients/${patient.id}`}>
                <div className="cursor-pointer rounded-2xl border bg-white p-4 transition-all hover:border-primary/30 hover:shadow-sm card-hover sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4" data-testid={`patient-card-${patient.id}`}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white" style={{ background: "hsl(185 75% 40%)" }}>
                    {patient.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground">{patient.name}</span>
                      <Badge variant={patient.isActive ? "default" : "secondary"} className="text-xs">{patient.isActive ? "Active" : "Inactive"}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{patient.email}</span>
                      {patient.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{patient.phone}</span>}
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Cpu className="w-3 h-3" />
                      {mappedDevice ? (
                        <span>Mapped device: <span className="font-medium text-foreground">{mappedDevice.name}</span> ({mappedDevice.deviceCode})</span>
                      ) : (
                        <span>No device mapped</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm font-medium mb-1" style={{ color: rate >= 80 ? "hsl(142 72% 40%)" : rate >= 60 ? "hsl(38 92% 50%)" : "hsl(0 72% 51%)" }}>
                      <TrendingUp className="w-3 h-3" />
                      {rate}%
                    </div>
                    <div className="text-xs text-muted-foreground">Adherence</div>
                  </div>
                  <ChevronRight className="hidden w-4 h-4 text-muted-foreground sm:block" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border py-16 text-center">
          <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-muted-foreground">No patients found</p>
        </div>
      )}
    </AppLayout>
  );
}
