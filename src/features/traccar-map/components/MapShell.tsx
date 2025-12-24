import { ReactNode, useState } from 'react';
import { ChevronLeft, ChevronRight, Car, LucideIcon } from 'lucide-react';

interface MapShellProps {
  sidebar: ReactNode;
  map: ReactNode;
  /** Count shown when collapsed (default: 0) */
  itemCount?: number;
  /** Icon shown when collapsed (default: Car) */
  CollapsedIcon?: LucideIcon;
}

export function MapShell({ 
  sidebar, 
  map, 
  itemCount = 0, 
  CollapsedIcon = Car 
}: MapShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-88px)] -m-6 bg-background overflow-hidden">
      {/* Sidebar - collapsible on desktop */}
      <div 
        className={`
          relative flex-shrink-0 border-b md:border-b-0 transition-all duration-300 ease-in-out
          ${isCollapsed 
            ? 'w-full md:w-0 h-0 md:h-full overflow-hidden' 
            : 'w-full md:w-80 h-64 md:h-full'
          }
        `}
      >
        {sidebar}
      </div>
      
      {/* Toggle Button - only visible on desktop */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden md:flex absolute md:relative z-[500] items-center justify-center w-6 h-16 bg-surface hover:bg-background border border-border rounded-r-lg shadow-lg transition-all duration-200 hover:w-8 group"
        style={{ marginLeft: isCollapsed ? 0 : -1 }}
        title={isCollapsed ? 'Expandir panel' : 'Colapsar panel'}
      >
        <div className="flex flex-col items-center gap-1">
          {isCollapsed ? (
            <>
              <ChevronRight size={16} className="text-text-muted group-hover:text-primary transition-colors" />
              <div className="flex flex-col items-center">
                <CollapsedIcon size={14} className="text-text-muted" />
                {itemCount > 0 && (
                  <span className="text-[10px] font-medium text-text-muted">{itemCount}</span>
                )}
              </div>
            </>
          ) : (
            <ChevronLeft size={16} className="text-text-muted group-hover:text-primary transition-colors" />
          )}
        </div>
      </button>
      
      {/* Map - takes remaining space */}
      <div className="flex-1 h-full min-h-[300px]">
        {map}
      </div>
    </div>
  );
}
