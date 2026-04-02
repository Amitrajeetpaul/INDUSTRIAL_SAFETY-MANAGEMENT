import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  ShieldAlert,
  LayoutDashboard,
  FileText,
  LogOut,
  Menu,
  X,
  HardHat,
  Briefcase,
  Wrench,
  ShieldCheck,
  School,
  Leaf
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function Navigation() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const NavItem = ({ href, icon: Icon, children }: { href: string, icon: any, children: React.ReactNode }) => (
    <Link href={href}>
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 cursor-pointer group",
          location === href
            ? "bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/30"
            : "text-muted-foreground hover:bg-secondary/10 hover:text-foreground"
        )}
        onClick={() => setIsOpen(false)}
      >
        <Icon className={cn("w-5 h-5", location === href ? "text-primary-foreground" : "text-primary group-hover:scale-110 transition-transform")} />
        <span className="uppercase tracking-wider text-sm">{children}</span>
      </div>
    </Link>
  );

  if (!user) return null;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 border-r bg-background/95 backdrop-blur z-50">
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg">
              <ShieldAlert className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-foreground leading-none">INDU<span className="text-primary">SAFE</span></h1>
              <p className="text-xs text-muted-foreground font-medium mt-1">INDUSTRIAL CONTROL</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavItem href="/" icon={LayoutDashboard}>Dashboard</NavItem>

          {(user.role === 'admin' || user.role === 'manager') && (
            <NavItem href="/incidents" icon={FileText}>Incidents Log</NavItem>
          )}

          {(user.role === 'admin' || user.role === 'manager') && (
            <NavItem href="/risks" icon={ShieldAlert}>Risk Assessment</NavItem>
          )}

          {user.role === 'worker' && (
            <NavItem href="/report" icon={HardHat}>Report Hazard</NavItem>
          )}

          {(user.role === 'admin' || user.role === 'manager') && (
            <div className="pt-4 pb-2 border-t border-border/20 mx-2">
              <p className="text-[10px] font-black uppercase text-muted-foreground px-2 tracking-widest mb-2">Operations</p>
              <NavItem href="/ppe" icon={Briefcase}>PPE Inventory</NavItem>
              <NavItem href="/safety-improvements" icon={ShieldCheck}>Improvements</NavItem>
              <NavItem href="/training" icon={School}>Training</NavItem>
              <NavItem href="/sustainability" icon={Leaf}>Sustainability</NavItem>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-border/50 bg-secondary/5">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/20">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 border-primary/20 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
            onClick={() => logout()}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 border-b bg-background/95 backdrop-blur z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-primary" />
          <span className="font-black text-xl tracking-tighter">INDU<span className="text-primary">SAFE</span></span>
        </div>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex flex-col h-full">
              <div className="p-6 border-b">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-6 h-6 text-primary" />
                  <span className="font-black text-xl">INDUSAFE</span>
                </div>
              </div>
              <nav className="flex-1 p-4 space-y-2">
                <NavItem href="/" icon={LayoutDashboard}>Dashboard</NavItem>
                {(user.role === 'admin' || user.role === 'manager') && (
                  <NavItem href="/incidents" icon={FileText}>Incidents</NavItem>
                )}
                {(user.role === 'admin' || user.role === 'manager') && (
                  <NavItem href="/risks" icon={ShieldAlert}>Risk Assessment</NavItem>
                )}
                {user.role === 'worker' && (
                  <NavItem href="/report" icon={HardHat}>Report Hazard</NavItem>
                )}
                {(user.role === 'admin' || user.role === 'manager') && (
                  <>
                    <NavItem href="/ppe" icon={Briefcase}>PPE Inventory</NavItem>
                    <NavItem href="/safety-improvements" icon={ShieldCheck}>Improvements</NavItem>
                    <NavItem href="/training" icon={School}>Training</NavItem>
                    <NavItem href="/sustainability" icon={Leaf}>Sustainability</NavItem>
                  </>
                )}
              </nav>
              <div className="p-4 border-t">
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => logout()}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </header>


    </>
  );
}
