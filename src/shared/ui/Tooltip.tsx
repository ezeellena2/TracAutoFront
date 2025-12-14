import React from 'react';
import { LucideIcon, Info } from 'lucide-react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  return (
    <div className="relative group">
      {children}
      <div className="absolute z-50 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-lg whitespace-nowrap">
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
          <div className="border-4 border-transparent border-t-gray-900" />
        </div>
      </div>
    </div>
  );
}

interface PermissionTooltipProps {
  hasPermission: boolean;
  permissionName: string;
  children: React.ReactNode;
}

export function PermissionTooltip({ hasPermission, permissionName, children }: PermissionTooltipProps) {
  if (hasPermission) {
    return <>{children}</>;
  }

  return (
    <Tooltip content={`Requiere permiso: ${permissionName}`}>
      <div className="opacity-50 cursor-not-allowed">
        {children}
      </div>
    </Tooltip>
  );
}
