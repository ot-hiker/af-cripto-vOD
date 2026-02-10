import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Newspaper, MessageSquare, Bell, Zap } from 'lucide-react';
import { BtcTicker } from './BtcTicker';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/news', label: 'Notícias', icon: Newspaper },
  { to: '/chat', label: 'Chat IA', icon: MessageSquare },
  { to: '/alerts', label: 'Alertas', icon: Bell },
];

export function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen border-r border-border bg-card/50 backdrop-blur-sm fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <Zap className="w-4 h-4 text-primary" />
        </div>
        <div>
          <span className="font-bold text-foreground tracking-tight">CryptoHub</span>
          <p className="text-xs text-muted-foreground leading-none">Cripto & Startups</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-primary/15 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('w-4 h-4 shrink-0', isActive && 'text-primary')} />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <Separator />

      {/* BTC Price Widget */}
      <div className="p-4">
        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">
          Cotação ao vivo
        </p>
        <BtcTicker compact />
      </div>
    </aside>
  );
}

// Bottom nav for mobile
export function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-t border-border safe-area-inset-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('w-5 h-5', isActive && 'text-primary')} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
