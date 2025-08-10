'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Receipt, 
  BarChart3, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

const menuItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Invoices',
    href: '/dashboard/invoices',
    icon: FileText,
    badge: 'new',
  },
  {
    title: 'Clients',
    href: '/dashboard/clients',
    icon: Users,
  },
  {
    title: 'Expenses',
    href: '/dashboard/expenses',
    icon: Receipt,
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleCollapsed = () => setIsCollapsed(!isCollapsed);
  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-50"
        onClick={toggleMobile}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={toggleMobile}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed left-0 top-0 z-40 h-full bg-background border-r transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64',
          'md:relative md:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          className
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center border-b px-4">
            {!isCollapsed && (
              <Link href="/dashboard" className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <FileText className="h-5 w-5" />
                </div>
                <span className="text-lg font-semibold">Invoice Manager</span>
              </Link>
            )}
            
            {/* Collapse toggle - Desktop only */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'hidden md:flex ml-auto',
                isCollapsed && 'mx-auto'
              )}
              onClick={toggleCollapsed}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-2">
              {menuItems.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/dashboard' && pathname.startsWith(item.href));
                
                return (
                  <Link key={item.href} href={item.href} onClick={() => setIsMobileOpen(false)}>
                    <div
                      className={cn(
                        'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        'hover:bg-accent hover:text-accent-foreground',
                        isActive 
                          ? 'bg-accent text-accent-foreground' 
                          : 'text-muted-foreground',
                        isCollapsed ? 'justify-center' : 'justify-start'
                      )}
                    >
                      <item.icon className={cn('h-5 w-5', !isCollapsed && 'mr-3')} />
                      {!isCollapsed && (
                        <>
                          <span className="flex-1">{item.title}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="ml-auto">
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t p-4">
            {!isCollapsed && (
              <div className="text-xs text-muted-foreground">
                <p className="font-medium">Invoice Manager v2.0</p>
                <p>Built with Next.js & Supabase</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
