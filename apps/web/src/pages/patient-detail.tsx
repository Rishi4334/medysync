import { useRoute, Link } from "wouter";
import { useGetUser, useListDevices, useListReminders, useListEvents, useGetAdherenceStats, getGetUserQueryKey, getListDevicesQueryKey, getListRemindersQueryKey, getListEventsQueryKey, getGetAdherenceStatsQueryKey } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ArrowLeft, Bell, Activity, Cpu } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function PatientDetailPage() {
  const [, params] = useRoute("/patients/:id");
  const id = params ? parseInt(params.id) : 0;

  const { data: patient, isLoading } = useGetUser(id, { query: { enabled: !!id, queryKey: getGetUserQueryKey(id) } });
  const { data: devices } = useListDevices({ query: { enabled: !!id, queryKey: getListDevicesQueryKey() } });
  const { data: reminders } = useListReminders({ patientId: id }, { query: { enabled: !!id, queryKey: getListRemindersQueryKey({ patientId: id }) } });
  const { data: events } = useListEvents({ patientId: id, limit: 10 }, { query: { enabled: !!id, queryKey: getListEventsQueryKey({ patientId: id, limit: 10 }) } });
  const { data: stats } = useGetAdherenceStats({ patientId: id }, { query: { enabled: !!id, queryKey: getGetAdherenceStatsQueryKey({ patientId: id }) } });

  if (isLoading) {
    return <AppLayout><div className="animate-pulse space-y-4"><div className="h-8 bg-gray-100 rounded w-1/3" /><div className="h-32 bg-gray-100 rounded-2xl" /></div></AppLayout>;
  }

  if (!patient) {
    return <AppLayout title="Patient not found"><p>Patient not found.</p></AppLayout>;
  }

  const mappedDevice = devices?.find((device) => device.patientId === patient.id);

  const eventTypeLabel: Record<string, string> = {
    motion_detected: "Motion Detected",
    box_opened: "Box Opened",
    box_closed: "Box Closed",
    reminder_triggered: "Reminder Triggered",
    medicine_taken: "Medicine Taken",
    medicine_missed: "Medicine Missed",
  };

  const eventColors: Record<string, string> = {
    medicine_taken: "bg-green-100 text-green-800",
    medicine_missed: "bg-red-100 text-red-800",
    motion_detected: "bg-yellow-100 text-yellow-800",
    box_opened: "bg-blue-100 text-blue-800",
    box_closed: "bg-gray-100 text-gray-800",
    reminder_triggered: "bg-purple-100 text-purple-800",
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <Link href="/patients">
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />Back to Patients
          </button>
        </Link>
        <div className="rounded-2xl border bg-white p-4 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-5">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white" style={{ background: "hsl(185 75% 40%)" }}>{patient.name.charAt(0)}</div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold sm:text-2xl">{patient.name}</h1>
              <Badge>{patient.isActive ? "Active" : "Inactive"}</Badge>
            </div>
            <p className="text-muted-foreground mt-1">{patient.email}</p>
            {patient.phone && <p className="text-sm text-muted-foreground">{patient.phone}</p>}
            <div className="mt-2 inline-flex items-center gap-2 rounded-lg border bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700">
              <Cpu className="w-3.5 h-3.5" />
              {mappedDevice ? (
                <span>Mapped device: <span className="font-medium text-slate-900">{mappedDevice.name}</span> ({mappedDevice.deviceCode})</span>
              ) : (
                <span>No mapped device</span>
              )}
            </div>
          </div>
          {stats && (
            <div className="grid w-full grid-cols-3 gap-3 text-center sm:gap-6 lg:ml-auto lg:w-auto">
              <div>
                <div className="text-2xl font-bold" style={{ color: stats.adherenceRate >= 80 ? "hsl(142 72% 40%)" : "hsl(38 92% 50%)" }}>{stats.adherenceRate}%</div>
                <div className="text-xs text-muted-foreground">Adherence Rate</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.takenDoses}</div>
                <div className="text-xs text-muted-foreground">Taken</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-500">{stats.missedDoses}</div>
                <div className="text-xs text-muted-foreground">Missed</div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border">
          <div className="px-5 py-4 border-b flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <span className="font-semibold">Medicine Reminders</span>
            <span className="ml-auto text-xs text-muted-foreground">{reminders?.length ?? 0} total</span>
          </div>
          <div className="divide-y max-h-80 overflow-y-auto">
            {reminders && reminders.length > 0 ? reminders.map((r) => (
              <div key={r.id} className="px-5 py-3.5 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ background: r.isActive ? "hsl(142 72% 40%)" : "hsl(0 0% 75%)" }} />
                <div className="flex-1">
                  <div className="text-sm font-medium">{r.medicineName}</div>
                  <div className="text-xs text-muted-foreground">{r.dosage} — {r.scheduledTime} ({r.daysOfWeek})</div>
                </div>
                <Badge variant={r.isActive ? "default" : "secondary"} className="text-xs">{r.isActive ? "Active" : "Off"}</Badge>
              </div>
            )) : <div className="px-5 py-8 text-center text-sm text-muted-foreground">No reminders</div>}
          </div>
        </div>

        <div className="bg-white rounded-2xl border">
          <div className="px-5 py-4 border-b flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <span className="font-semibold">Recent Events</span>
          </div>
          <div className="divide-y max-h-80 overflow-y-auto">
            {events && events.length > 0 ? events.map((e) => (
              <div key={e.id} className="px-5 py-3.5 flex items-center gap-3">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${eventColors[e.eventType] ?? "bg-gray-100 text-gray-800"}`}>{eventTypeLabel[e.eventType] ?? e.eventType}</span>
                <span className="ml-auto text-xs text-muted-foreground">{new Date(e.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            )) : <div className="px-5 py-8 text-center text-sm text-muted-foreground">No events</div>}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
