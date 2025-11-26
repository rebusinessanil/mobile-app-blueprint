import { BarChart3, Users, Coins } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserManagement from "@/components/admin/UserManagement";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import TokenManagement from "@/components/admin/TokenManagement";
import AdminLayout from "@/components/admin/AdminLayout";
import { AdminGuard } from "@/components/AdminGuard";

export default function AdminDashboard() {
  return (
    <AdminGuard>
      <AdminLayout>
      <div className="space-y-6">
        {/* Tabs for different sections */}
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-card border-2 border-primary/20 rounded-2xl p-1">
            <TabsTrigger 
              value="analytics"
              className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger 
              value="tokens"
              className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Coins className="w-4 h-4 mr-2" />
              Tokens
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-4">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <UserManagement />
          </TabsContent>

          <TabsContent value="tokens" className="space-y-4">
            <TokenManagement />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
    </AdminGuard>
  );
}
