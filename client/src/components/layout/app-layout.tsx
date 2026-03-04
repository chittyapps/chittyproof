import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Shield, 
  FileJson, 
  Key, 
  TerminalSquare, 
  Settings, 
  Bell, 
  Search,
  Menu,
  LogOut,
  Hexagon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Integrity Hub", href: "/", icon: Shield },
    { name: "FACT v2 Bundles", href: "/bundles", icon: FileJson },
    { name: "Key Registry (JWKS)", href: "/keys", icon: Key },
    { name: "Audit Logs", href: "/logs", icon: TerminalSquare },
  ];

  const Sidebar = () => (
    <div className="flex h-full flex-col gap-y-5 bg-card/80 backdrop-blur-xl border-r border-border/50 px-6 pb-4">
      <div className="flex h-16 shrink-0 items-center gap-3 pt-4">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/20 border border-primary/50 text-primary">
          <Hexagon className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-lg tracking-tight leading-none text-foreground">ChittyProof</span>
          <span className="text-[10px] text-primary uppercase tracking-widest mt-1">Tier 0 Anchor</span>
        </div>
      </div>
      <nav className="flex flex-1 flex-col mt-4">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => {
                const isActive = location === item.href;
                return (
                  <li key={item.name}>
                    <Link href={item.href}>
                      <a
                        className={`
                          group flex items-center gap-x-3 rounded-md p-2.5 text-sm leading-6 font-medium transition-all
                          ${isActive 
                            ? 'bg-primary/10 text-primary border border-primary/20' 
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50 border border-transparent'
                          }
                        `}
                      >
                        <item.icon
                          className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}
                          aria-hidden="true"
                        />
                        {item.name}
                      </a>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>
          <li className="mt-auto">
            <a
              href="#"
              className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-medium leading-6 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors border border-transparent"
            >
              <Settings className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground" aria-hidden="true" />
              System Config
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      {/* Mobile sidebar */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-72 bg-background border-r-border">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <Sidebar />
      </div>

      <div className="lg:pl-64 flex flex-col min-h-screen">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-border/50 bg-background/80 backdrop-blur-md px-4 sm:gap-x-6 sm:px-6 lg:px-8">
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="-m-2.5 p-2.5 text-muted-foreground lg:hidden">
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
          </SheetTrigger>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <form className="relative flex flex-1 items-center" action="#" method="GET">
              <Search
                className="pointer-events-none absolute left-0 h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                id="search-field"
                className="block h-full w-full border-0 py-0 pl-8 pr-0 text-foreground placeholder:text-muted-foreground focus:ring-0 sm:text-sm bg-transparent outline-none font-mono"
                placeholder="Search tx_hash, bundle_id, or public_key..."
                type="search"
                name="search"
              />
            </form>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                SYSTEM ONLINE
              </div>
              
              <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                <span className="sr-only">View notifications</span>
                <Bell className="h-4 w-4" aria-hidden="true" />
              </Button>

              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border" aria-hidden="true" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="-m-1.5 flex items-center p-1.5 hover:bg-accent/50 rounded-md">
                    <span className="sr-only">Open user menu</span>
                    <Avatar className="h-7 w-7 rounded bg-muted border border-border">
                      <AvatarImage src="" alt="Admin" />
                      <AvatarFallback className="rounded bg-accent text-xs font-mono">AD</AvatarFallback>
                    </Avatar>
                    <span className="hidden lg:flex lg:items-center">
                      <span className="ml-3 text-sm font-medium leading-6 text-foreground" aria-hidden="true">
                        Root Admin
                      </span>
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 border-border/50 bg-card/95 backdrop-blur">
                  <DropdownMenuLabel className="font-mono text-xs text-muted-foreground">Session: x8f2a...9b1</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border/50" />
                  <DropdownMenuItem>Access Tokens</DropdownMenuItem>
                  <DropdownMenuItem>Security Policies</DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/50" />
                  <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Disconnect</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}