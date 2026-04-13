import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ProfileSettings = () => {
  const { user, logout } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [mobile, setMobile] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [reportFormat, setReportFormat] = useState("pdf");
  const [inAppNotifs, setInAppNotifs] = useState(true);

  return (
    <AppLayout>
      <div className="max-w-2xl">
        <h1 className="page-title mb-6">Profile Settings</h1>

        {/* Section A – Basic Information */}
        <div className="bg-card border border-border p-5 mb-4">
          <h3 className="section-title">Basic Information</h3>
          <div className="form-grid">
            <div>
              <Label className="text-xs">Full Name</Label>
              <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Email ID</Label>
              <Input className="mt-1" value={user?.email || ""} disabled />
            </div>
            <div>
              <Label className="text-xs">Mobile Number</Label>
              <Input className="mt-1" placeholder="+91 XXXXX XXXXX" value={mobile} onChange={(e) => setMobile(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Role</Label>
              <Input className="mt-1" value={user?.role || ""} disabled />
            </div>
            <div>
              <Label className="text-xs">Employee ID</Label>
              <Input className="mt-1" placeholder="EMP-XXXX" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} />
            </div>
          </div>
          <Button className="mt-4" size="sm">Save Changes</Button>
        </div>

        {/* Section B – Security */}
        <div className="bg-card border border-border p-5 mb-4">
          <h3 className="section-title">Security</h3>
          <div className="space-y-3 max-w-sm">
            <div>
              <Label className="text-xs">Current Password</Label>
              <Input className="mt-1" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">New Password</Label>
              <Input className="mt-1" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Confirm Password</Label>
              <Input className="mt-1" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button size="sm">Change Password</Button>
              <Button size="sm" variant="outline" onClick={logout}>Logout from All Sessions</Button>
            </div>
          </div>
        </div>

        {/* Section C – Preferences */}
        <div className="bg-card border border-border p-5">
          <h3 className="section-title">Preferences</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between max-w-sm">
              <Label className="text-xs">Default Report Format</Label>
              <Select value={reportFormat} onValueChange={setReportFormat}>
                <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between max-w-sm">
              <Label className="text-xs">In-App Notifications</Label>
              <Switch checked={inAppNotifs} onCheckedChange={setInAppNotifs} />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ProfileSettings;
