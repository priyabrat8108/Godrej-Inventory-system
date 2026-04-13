import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { Breadcrumbs } from "./Breadcrumbs";

export function AppLayout({ children, lowStockCount }: { children: ReactNode; lowStockCount?: number }) {
  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <AppHeader lowStockCount={lowStockCount} />
        <main className="flex-1 p-6 overflow-auto">
          <Breadcrumbs />
          {children}
        </main>
      </div>
    </div>
  );
}
