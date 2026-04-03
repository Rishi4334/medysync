import { useGetDashboardSummary, useGetRecentActivity, getGetDashboardSummaryQueryKey, getGetRecentActivityQueryKey } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { getCurrentUser } from "@/lib/auth";
import { Activity, Users, Bell, Cpu, TrendingUp, AlertTriangle, CheckCircle2, XCircle, Clock } from "lucide-react";

function StatCard({ label, value, icon: Icon, color, sub }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }>; color: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl p-6 border card-hover">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="text-3xl font-bold text-foreground mb-1">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

const severityStyles = {
  info: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" },
  warning: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-400" },
  success: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-400" },
  error: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
};

export default function DashboardPage() {
  const user = getCurrentUser();
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary({}, { query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const { data: activity, isLoading: loadingActivity } = useGetRecentActivity({ limit: 10 }, { query: { queryKey: getGetRecentActivityQueryKey({ limit: 10 }) } });

  const stats = summary;

  return (
    <AppLayout>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">Welcome back, {user?.name?.split(" ")[0]}</h1>
        <p className="text-muted-foreground mt-1">
          {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {loadingSummary ? (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-32 bg-white rounded-2xl border animate-pulse" />)}
        </div>
      ) : stats ? (
        <>
          {(user?.role === "admin" || user?.role === "caretaker") && (
            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Total Patients" value={stats.totalPatients} icon={Users} color="bg-blue-500" />
              <StatCard label="Total Caretakers" value={stats.totalCaretakers} icon={Users} color="bg-purple-500" />
              <StatCard label="Active Reminders" value={stats.activeReminders} icon={Bell} color="bg-teal-500" />
              <StatCard label="Today's Reminders" value={stats.todayReminders} icon={Clock} color="bg-indigo-500" />
            </div>
          )}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Today's Adherence" value={`${stats.todayAdherenceRate}%`} icon={TrendingUp} color={stats.todayAdherenceRate >= 80 ? "bg-green-500" : "bg-orange-500"} sub="Medicine taken rate" />
            <StatCard label="Weekly Adherence" value={`${stats.weeklyAdherenceRate}%`} icon={CheckCircle2} color={stats.weeklyAdherenceRate >= 80 ? "bg-green-500" : "bg-orange-500"} sub="7-day average" />
            {(user?.role === "admin" || user?.role === "caretaker") && (
              <>
                <StatCard label="Devices Online" value={stats.devicesOnline} icon={Cpu} color="bg-green-500" sub={`${stats.devicesOffline} offline`} />
                <StatCard label="Recent Alerts" value={stats.recentAlerts} icon={AlertTriangle} color={stats.recentAlerts > 0 ? "bg-red-500" : "bg-gray-400"} sub="Today" />
              </>
            )}
            <StatCard label="Medicines Taken" value={stats.medicinesTaken} icon={CheckCircle2} color="bg-green-500" />
            <StatCard label="Medicines Missed" value={stats.medicinesMissed} icon={XCircle} color="bg-red-500" />
          </div>
        </>
      ) : null}

      <div className="bg-white rounded-2xl border">
        <div className="px-6 py-4 border-b flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">Recent Activity</h2>
          <div className="ml-2 flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500 live-dot" />
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
        </div>
        <div className="divide-y">
          {loadingActivity ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="px-6 py-4 animate-pulse flex gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            ))
          ) : activity && activity.length > 0 ? (
            activity.map((item) => {
              const s = severityStyles[item.severity as keyof typeof severityStyles] ?? severityStyles.info;
              return (
                <div key={item.id} className="flex flex-wrap items-start gap-3 px-4 py-4 transition-colors hover:bg-muted/30 sm:px-6" data-testid={`activity-item-${item.id}`}>
                  <div className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{item.description}</p>
                    {item.patientName && <p className="text-xs text-muted-foreground mt-0.5">{item.patientName}</p>}
                  </div>
                  <div className="w-full text-xs text-muted-foreground sm:w-auto">{new Date(item.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              );
            })
          ) : (
            <div className="px-6 py-12 text-center text-muted-foreground">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
