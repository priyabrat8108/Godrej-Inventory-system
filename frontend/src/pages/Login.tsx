import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock, ShieldCheck } from "lucide-react";
import godrejLogo from "@/assets/godrej-logo.png";

type AuthTab = "signin" | "signup";

const LoginBackground = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{
    background: "linear-gradient(145deg, hsl(200 76% 18%) 0%, hsl(200 76% 12%) 100%)",
  }}>
    <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
      backgroundImage: `
        linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
      `,
      backgroundSize: '40px 40px',
    }} />
    <div className="absolute top-20 right-20 w-64 h-64 border border-white/[0.03] rounded-full pointer-events-none" />
    <div className="absolute bottom-32 left-16 w-48 h-48 border border-white/[0.03] rounded-full pointer-events-none" />
    <div className="absolute top-1/2 left-1/3 w-96 h-96 border border-white/[0.02] rounded-full pointer-events-none" />
    {children}
    <p className="absolute bottom-6 left-0 right-0 text-center text-[10px] text-white/30 tracking-wide">
      © 2026 Godrej Aerospace – Internal Confidential System
    </p>
  </div>
);

const LogoHeader = () => (
  <div className="text-center mb-6">
    <div className="inline-flex items-center justify-center bg-white/10 backdrop-blur-sm p-3 mb-4">
      <img src={godrejLogo} alt="Godrej Aerospace" className="h-10" />
    </div>
    <h1 className="text-lg font-semibold text-white tracking-wide">Godrej Aerospace</h1>
    <p className="text-xs text-white/50 mt-1 tracking-wider uppercase">Internal Management System</p>
  </div>
);

/** System Initialization Screen – shown when no users exist */
const SystemInitForm = () => {
  const { initializeSystem } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", mobile: "", employeeId: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");

  if (!form.name || !form.email || !form.password || !form.confirm) {
    setError("Please fill in all required fields.");
    return;
  }

  if (form.password !== form.confirm) {
    setError("Passwords do not match.");
    return;
  }

  if (form.password.length < 6) {
    setError("Password must be at least 6 characters.");
    return;
  }

  const result = await initializeSystem({
  full_name: form.name,
  email: form.email,
  password: form.password,
});

  if (result.success) {
    setSuccess(true);
  } else {
    setError(result.message);
  }
};

  if (success) {
    return (
      <LoginBackground>
        <div className="w-full max-w-md relative z-10 px-4">
          <LogoHeader />
          <div className="bg-white border-l-4 border-l-primary shadow-2xl shadow-black/30 p-6 text-center space-y-3">
            <ShieldCheck className="h-8 w-8 text-success mx-auto" />
            <p className="text-sm font-medium text-foreground">System Initialized Successfully</p>
            <p className="text-xs text-muted-foreground">High Authority account has been created. You can now sign in.</p>
            <Button size="sm" onClick={() => window.location.reload()}>Proceed to Sign In</Button>
          </div>
        </div>
      </LoginBackground>
    );
  }

  return (
    <LoginBackground>
      <div className="w-full max-w-md relative z-10 px-4">
        <LogoHeader />
        <div className="bg-white border-l-4 border-l-primary shadow-2xl shadow-black/30">
          <div className="bg-warning/10 border-b border-warning/30 px-6 py-3">
            <p className="text-xs font-semibold text-warning">System Not Initialized</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Create the High Authority account to initialize the system.</p>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-3">
            <div>
              <Label className="text-xs">Full Name <span className="text-destructive">*</span></Label>
              <Input className="mt-1" placeholder="Enter full name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Company Email <span className="text-destructive">*</span></Label>
              <Input className="mt-1" type="email" placeholder="name@godrej.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Mobile Number</Label>
              <Input className="mt-1" placeholder="+91 XXXXX XXXXX" value={form.mobile} onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Employee ID</Label>
              <Input className="mt-1" placeholder="EMP-XXXX" value={form.employeeId} onChange={e => setForm(p => ({ ...p, employeeId: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1.5">
                <Lock className="h-3 w-3 text-muted-foreground" />
                Password <span className="text-destructive">*</span>
              </Label>
              <Input className="mt-1" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1.5">
                <Lock className="h-3 w-3 text-muted-foreground" />
                Confirm Password <span className="text-destructive">*</span>
              </Label>
              <Input className="mt-1" type="password" placeholder="••••••••" value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button type="submit" className="w-full">
              <ShieldCheck className="h-3.5 w-3.5 mr-2" />
              Initialize System
            </Button>
          </form>
        </div>
      </div>
    </LoginBackground>
  );
};



const Login = () => {
  const { isInitialized, login, register } = useAuth();
  const navigate = useNavigate();

  const [authTab, setAuthTab] = useState<AuthTab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");

  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupMobile, setSignupMobile] = useState("");
  const [signupRole, setSignupRole] = useState("");
  const [signupEmpId, setSignupEmpId] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [signupSuccess, setSignupSuccess] = useState(false);

  if (isInitialized === null) return null;

if (!isInitialized) return <SystemInitForm />;

  const handleSignIn = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");

  if (!email || !password) {
    setError("Please fill in all fields.");
    return;
  }

  const result = await login(email, password);

  if (result.success) {
    navigate("/inventory");
  } else {
    setError(result.message);
  }
};

  const handleSignUp = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");

  if (
    !signupName ||
    !signupEmail ||
    !signupPassword ||
    !signupConfirm ||
    !signupRole
  ) {
    setError("Please fill in all required fields.");
    return;
  }

  if (signupPassword !== signupConfirm) {
    setError("Passwords do not match.");
    return;
  }

  if (signupPassword.length < 6) {
    setError("Password must be at least 6 characters.");
    return;
  }

  const result = await register({
    name: signupName.trim(),
    email: signupEmail.trim(),
    password: signupPassword,
    role: signupRole as "Operator" | "Admin",
    mobile: signupMobile.trim(),
    employeeId: signupEmpId.trim(),
  });

  if (result.success) {
    setSignupSuccess(true);
  } else {
    setError(result.message);
  }
};

  return (
    <LoginBackground>
      <div className="w-full max-w-md relative z-10 px-4">
        <LogoHeader />

        <div className="bg-white border-l-4 border-l-primary shadow-2xl shadow-black/30">
          {/* Tab Switch */}
          <div className="flex border-b border-border">
            <button
              onClick={() => { setAuthTab("signin"); setError(""); setSignupSuccess(false); }}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                authTab === "signin"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setAuthTab("signup"); setError(""); }}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                authTab === "signup"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign Up
            </button>
          </div>

          <div className="p-6">
            {authTab === "signin" && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-xs">Company Email</Label>
                  <Input id="email" type="email" placeholder="name@godrej.com" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="password" className="text-xs flex items-center gap-1.5">
                    <Lock className="h-3 w-3 text-muted-foreground" />
                    Password
                  </Label>
                  <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox id="remember" checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
                    <Label htmlFor="remember" className="text-xs text-muted-foreground cursor-pointer">Remember Me</Label>
                  </div>
                  <button type="button" className="text-xs text-primary hover:underline">Forgot Password?</button>
                </div>
                {error && <p className="text-xs text-destructive">{error}</p>}
                <Button type="submit" className="w-full flex items-center justify-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Login
                </Button>
                <p className="text-center text-[10px] text-muted-foreground mt-2">
                  Authorized Access Only – Godrej Aerospace
                </p>
              </form>
            )}

            {authTab === "signup" && !signupSuccess && (
              <form onSubmit={handleSignUp} className="space-y-3">
                <div>
                  <Label className="text-xs">Full Name <span className="text-destructive">*</span></Label>
                  <Input className="mt-1" placeholder="Enter full name" value={signupName} onChange={e => setSignupName(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Company Email <span className="text-destructive">*</span></Label>
                  <Input className="mt-1" type="email" placeholder="name@godrej.com" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Mobile Number</Label>
                  <Input className="mt-1" placeholder="+91 XXXXX XXXXX" value={signupMobile} onChange={e => setSignupMobile(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Role <span className="text-destructive">*</span></Label>
                  <Select value={signupRole} onValueChange={setSignupRole}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Operator">Operator</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Employee ID</Label>
                  <Input className="mt-1" placeholder="EMP-XXXX" value={signupEmpId} onChange={e => setSignupEmpId(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs flex items-center gap-1.5">
                    <Lock className="h-3 w-3 text-muted-foreground" />
                    Password <span className="text-destructive">*</span>
                  </Label>
                  <Input className="mt-1" type="password" placeholder="••••••••" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs flex items-center gap-1.5">
                    <Lock className="h-3 w-3 text-muted-foreground" />
                    Confirm Password <span className="text-destructive">*</span>
                  </Label>
                  <Input className="mt-1" type="password" placeholder="••••••••" value={signupConfirm} onChange={e => setSignupConfirm(e.target.value)} />
                </div>
                {error && <p className="text-xs text-destructive">{error}</p>}
                <Button type="submit" className="w-full">
                  <ShieldCheck className="h-3.5 w-3.5 mr-2" />
                  Sign Up
                </Button>
                <p className="text-center text-[10px] text-muted-foreground border border-border bg-muted/50 px-3 py-2 mt-2">
                  Registration subject to administrative approval.
                </p>
              </form>
            )}

            {authTab === "signup" && signupSuccess && (
              <div className="text-center py-6 space-y-3">
                <ShieldCheck className="h-8 w-8 text-success mx-auto" />
                <p className="text-sm font-medium text-foreground">Registration Submitted</p>
                <p className="text-xs text-muted-foreground">Your registration is pending approval from High Authority. You will be notified once your account is activated.</p>
                <Button variant="outline" size="sm" onClick={() => { setAuthTab("signin"); setSignupSuccess(false); }}>
                  Back to Sign In
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </LoginBackground>
  );
};

export default Login;
