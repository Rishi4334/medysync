import { useEffect, useState } from "react";
import { Bell, CheckCircle2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { setupPushNotifications } from "@/lib/push-notifications";
import { useToast } from "@/hooks/use-toast";

export function PushNotificationBanner() {
  const user = getCurrentUser();
  const { toast } = useToast();
  const [permission, setPermission] = useState<NotificationPermission>(typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setPermission(Notification.permission);
  }, []);

  if (!user || user.role !== "caretaker") {
    return null;
  }

  async function handleEnable() {
    setBusy(true);
    try {
      const result = await setupPushNotifications(user.id, { requestPermission: true });
      setPermission(typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default");
      if (result.ok) {
        toast({ title: "Notifications enabled", description: "FCM token saved for this account." });
      } else {
        toast({ title: "Notifications not enabled", description: result.reason, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Failed to enable notifications", description: String(error), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  if (permission === "granted") {
    return (
      <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-green-900">Push notifications are enabled</div>
            <p className="mt-1 text-sm text-green-800">Your browser can receive MedCare alerts. Keep notification permissions turned on in browser settings.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Bell className="mt-0.5 h-5 w-5 text-amber-700" />
          <div>
            <div className="font-semibold text-amber-900">Enable push notifications</div>
            <p className="mt-1 text-sm text-amber-800">Allow notifications so you receive IoT alerts even when the dashboard is not open.</p>
          </div>
        </div>
        <Button type="button" onClick={handleEnable} disabled={busy} className="sm:self-start">
          <ShieldAlert className="mr-2 h-4 w-4" />
          {busy ? "Enabling..." : "Enable notifications"}
        </Button>
      </div>
    </div>
  );
}
