import React from 'react';
import { Map, CalendarDays, MessageSquare, Users, User } from 'lucide-react';

export type NavTab = 'mapa' | 'calendario' | 'foro' | 'comunidad' | 'perfil';

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activitiesCount?: number;
  attendingCount?: number;
  unreadForumCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  activitiesCount = 0,
  attendingCount = 0,
}) => {
  const tabs = [
    {
      id: 'mapa' as NavTab,
      label: 'Mapa',
      icon: Map,
      badge: activitiesCount > 0 ? `${activitiesCount}` : undefined,
    },
    {
      id: 'calendario' as NavTab,
      label: 'Calendario',
      icon: CalendarDays,
      badge: attendingCount > 0 ? `${attendingCount}` : undefined,
    },
    {
      id: 'foro' as NavTab,
      label: 'Foro',
      icon: MessageSquare,
      badge: 'Nuevo',
    },
    {
      id: 'comunidad' as NavTab,
      label: 'Comunidad',
      icon: Users,
    },
    {
      id: 'perfil' as NavTab,
      label: 'Perfil',
      icon: User,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200/90 shadow-2xl safe-area-pb">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all duration-150 touch-manipulation active:scale-95 ${
                isActive
                  ? 'text-emerald-700 font-bold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
              style={{ minHeight: '52px' }}
            >
              {/* Active pill background effect */}
              {isActive && (
                <span className="absolute inset-x-2 inset-y-1 bg-emerald-50 rounded-xl -z-10 border border-emerald-200/50" />
              )}

              <div className="relative">
                <Icon
                  className={`w-6 h-6 transition-transform duration-200 ${
                    isActive ? 'scale-110 text-emerald-600 stroke-[2.5]' : 'stroke-[1.8]'
                  }`}
                />
                {tab.badge && !isActive && (
                  <span className="absolute -top-1 -right-2.5 px-1.5 py-0.2 bg-orange-500 text-white text-[10px] font-black rounded-full shadow-sm">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span className={`nav-label text-xs mt-1 leading-none ${isActive ? 'font-extrabold text-emerald-800' : 'font-medium'}`}>
                {tab.label}
              </span>

              {isActive && (
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
