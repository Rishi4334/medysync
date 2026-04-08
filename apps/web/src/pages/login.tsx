import { useState } from "react";
import { useLocation } from "wouter";
import { useLoginUser, useCreateUser } from "@workspace/api-client-react";
import { setCurrentUser, setAuthToken } from "@/lib/auth";
import { setupPushNotifications } from "@/lib/push-notifications";
import { Heart, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [registerRole, setRegisterRole] = useState<"caretaker" | "patient">("patient");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const login = useLoginUser();
  const createUser = useCreateUser();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    login.mutate(
      { data: { username, password } },
      {
        onSuccess: (data) => {
          setCurrentUser(data.user as Parameters<typeof setCurrentUser>[0]);
          setAuthToken(data.token);
          void setupPushNotifications(data.user.id, { requestPermission: false });
          toast({ title: `Welcome back, ${data.user.name}!` });
          setLocation("/dashboard");
        },
        onError: () => {
          toast({ title: "Invalid credentials", description: "Please check your username and password.", variant: "destructive" });
        },
      }
    );
  }

  function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password || !name || !email) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    createUser.mutate(
      {
        data: {
          username,
          password,
          name,
          email,
          phone: phone || null,
          role: registerRole,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Account created successfully", description: "You can now sign in with your credentials." });
          setMode("signin");
          setPassword("");
        },
        onError: () => {
          toast({ title: "Registration failed", description: "Username or email may already be in use.", variant: "destructive" });
        },
      },
    );
  }

  const demoAccounts = [
    { username: "admin", password: "admin123", role: "Admin" },
    { username: "caretaker1", password: "care123", role: "Caretaker" },
    { username: "patient1", password: "patient123", role: "Patient" },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: "hsl(210 20% 98%)" }}>
      <div className="hidden lg:flex flex-1 items-center justify-center p-12" style={{ background: "hsl(213 35% 14%)" }}>
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8" style={{ background: "hsl(185 75% 40%)" }}>
            <Heart className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">MedCare</h1>
          <p className="text-lg mb-2" style={{ color: "hsl(185 75% 70%)" }}>Patient Care Ecosystem</p>
          <p className="text-sm leading-relaxed" style={{ color: "hsl(210 20% 55%)" }}>
            A complete healthcare monitoring platform connecting patients, caretakers, and smart IoT medicine boxes in real time.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 text-left">
            {[
              { label: "Real-time IoT", desc: "ESP32 smart medicine box" },
              { label: "Smart Reminders", desc: "Automated medicine schedules" },
              { label: "Care Analytics", desc: "Adherence tracking & reports" },
            ].map((f) => (
              <div key={f.label} className="p-4 rounded-xl" style={{ background: "hsl(213 30% 20%)" }}>
                <div className="text-sm font-semibold mb-1" style={{ color: "hsl(185 75% 65%)" }}>{f.label}</div>
                <div className="text-xs" style={{ color: "hsl(210 20% 55%)" }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6 lg:hidden">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(185 75% 40%)" }}>
                <Heart className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold">MedCare</span>
            </div>
            <h2 className="text-2xl font-bold text-foreground">{mode === "signin" ? "Sign in to your account" : "Create your account"}</h2>
            <p className="text-muted-foreground mt-1">
              {mode === "signin" ? "Enter your credentials to continue" : "Register as caretaker or patient"}
            </p>
          </div>

          <div className="mb-5 rounded-xl border bg-muted/40 p-1 grid grid-cols-2 gap-1">
            <button
              type="button"
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${mode === "signin" ? "bg-white shadow-sm" : "text-muted-foreground"}`}
              onClick={() => setMode("signin")}
              data-testid="button-mode-signin"
            >
              Sign in
            </button>
            <button
              type="button"
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${mode === "register" ? "bg-white shadow-sm" : "text-muted-foreground"}`}
              onClick={() => setMode("register")}
              data-testid="button-mode-register"
            >
              Register
            </button>
          </div>

          <form onSubmit={mode === "signin" ? handleSubmit : handleRegister} className="space-y-5">
            {mode === "register" && (
              <>
                <div>
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" className="mt-1" required data-testid="input-name" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className="mt-1" required data-testid="input-email" />
                </div>
                <div>
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input id="phone" type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter your phone" className="mt-1" data-testid="input-phone" />
                </div>
                <div>
                  <Label>Register as</Label>
                  <Select value={registerRole} onValueChange={(value: "caretaker" | "patient") => setRegisterRole(value)}>
                    <SelectTrigger className="mt-1" data-testid="select-register-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="patient">Patient</SelectItem>
                      <SelectItem value="caretaker">Caretaker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div>
              <Label htmlFor="username">Username</Label>
              <Input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your username" className="mt-1" required data-testid="input-username" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required data-testid="input-password" />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={login.isPending || createUser.isPending} data-testid="button-submit">
              {mode === "signin"
                ? login.isPending
                  ? "Signing in..."
                  : "Sign in"
                : createUser.isPending
                  ? "Creating account..."
                  : "Create account"}
            </Button>
          </form>

          <div className="mt-8 p-4 rounded-xl border" style={{ background: "hsl(213 20% 97%)" }}>
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Demo Accounts</p>
            <div className="space-y-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.username}
                  onClick={() => {
                    setUsername(acc.username);
                    setPassword(acc.password);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors text-left"
                  data-testid={`demo-${acc.role.toLowerCase()}`}
                >
                  <span className="text-sm font-medium">{acc.role}</span>
                  <span className="text-xs text-muted-foreground font-mono">{acc.username} / {acc.password}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
