import {
  FileCode,
  Terminal,
  Settings,
  Search,
  ChevronRight,
  Home,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Category } from '@/types';

interface SidebarProps {
  activeView: 'home' | 'scripts' | 'logs' | 'settings';
  onViewChange: (view: 'home' | 'scripts' | 'logs' | 'settings') => void;
  categories: Category[];
  activeCategory: string | null;
  onCategoryChange: (categoryId: string) => void;
  scriptTab: 'default' | 'user';
  onScriptTabChange: (tab: 'default' | 'user') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const navItems = [
  { id: 'home' as const, icon: Home, label: 'Anasayfa' },
  { id: 'scripts' as const, icon: FileCode, label: 'Scriptler' },
  { id: 'logs' as const, icon: Terminal, label: 'Loglar' },
  { id: 'settings' as const, icon: Settings, label: 'Ayarlar' },
];

export function Sidebar({
  activeView,
  onViewChange,
  categories,
  activeCategory,
  onCategoryChange,
  scriptTab,
  onScriptTabChange,
  searchQuery,
  onSearchChange,
}: SidebarProps) {
  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="w-[var(--sidebar-width)] h-full flex flex-col glass-surface border-r border-border/30 select-none">
      {/* ─── Nav Items ─── */}
      <nav className="flex flex-col gap-1 p-3 pt-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                'nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'active text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ─── Script Section ─── */}
      {activeView === 'scripts' && (
        <div className="flex-1 flex flex-col overflow-hidden border-t border-border/30 mt-1">
          {/* Script source toggle */}
          <div className="flex gap-1 p-3 pb-2">
            <button
              onClick={() => onScriptTabChange('default')}
              className={cn(
                'flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-all duration-200',
                scriptTab === 'default'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
              )}
            >
              Default
            </button>
            <button
              onClick={() => onScriptTabChange('user')}
              className={cn(
                'flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-all duration-200',
                scriptTab === 'user'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
              )}
            >
              Benim
            </button>
          </div>

          {/* Search */}
          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
              <input
                type="text"
                placeholder="Kategori ara..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full h-8 pl-8 pr-3 text-xs rounded-md bg-background/60 border border-border/40 placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
              />
            </div>
          </div>

          {/* Category List */}
          <div className="flex-1 overflow-y-auto px-2 pb-3">
            <div className="space-y-0.5">
              {filteredCategories.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => onCategoryChange(cat.id)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 group',
                      isActive
                        ? 'bg-primary/10 text-primary glow-border'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    )}
                  >
                    <span className="text-sm shrink-0">{cat.icon}</span>
                    <span className="flex-1 text-left truncate">{cat.name}</span>
                    <span
                      className={cn(
                        'text-[10px] tabular-nums px-1.5 py-0.5 rounded-full transition-colors',
                        isActive
                          ? 'bg-primary/20 text-primary'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {cat.scripts.length}
                    </span>
                    <ChevronRight
                      className={cn(
                        'h-3 w-3 shrink-0 transition-all duration-200',
                        isActive
                          ? 'text-primary opacity-100'
                          : 'opacity-0 -translate-x-1 group-hover:opacity-50 group-hover:translate-x-0'
                      )}
                    />
                  </button>
                );
              })}

              {filteredCategories.length === 0 && categories.length > 0 && (
                <p className="text-xs text-muted-foreground/50 text-center py-4">
                  Eşleşen kategori yok
                </p>
              )}

              {categories.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/40">
                  <FileCode className="h-6 w-6 mb-2" />
                  <p className="text-[11px]">Yükleniyor...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
