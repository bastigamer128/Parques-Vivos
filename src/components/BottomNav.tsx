import React from 'react';

export type MainTab = 'mapa' | 'publicar';
export type NavTab = 'mapa' | 'calendario' | 'foro' | 'comunidad' | 'perfil';

interface BottomNavProps {
  currentTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
}) => {
  return (
    <nav
      aria-label="Principal"
      className="sticky bottom-0 left-0 right-0 z-30 bg-white border-t border-[#dfe6dd]"
    >
      <div className="grid grid-cols-2">
        <button
          type="button"
          onClick={() => onSelectTab('mapa')}
          aria-current={currentTab === 'mapa' ? 'page' : undefined}
          className={`relative min-h-[54px] py-3 text-sm transition-colors cursor-pointer ${
            currentTab === 'mapa'
              ? 'font-extrabold text-[#1f6a42]'
              : 'font-semibold text-[#5b6c60] hover:text-[#18261d]'
          }`}
        >
          {currentTab === 'mapa' ? (
            <span
              aria-hidden="true"
              className="absolute top-0 inset-x-0 h-[3px] bg-[#1f6a42]"
            />
          ) : null}
          Mapa
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('publicar')}
          aria-current={currentTab === 'publicar' ? 'page' : undefined}
          className={`relative min-h-[54px] py-3 text-sm transition-colors cursor-pointer ${
            currentTab === 'publicar'
              ? 'font-extrabold text-[#1f6a42]'
              : 'font-semibold text-[#5b6c60] hover:text-[#18261d]'
          }`}
        >
          {currentTab === 'publicar' ? (
            <span
              aria-hidden="true"
              className="absolute top-0 inset-x-0 h-[3px] bg-[#1f6a42]"
            />
          ) : null}
          Publicar
        </button>
      </div>
    </nav>
  );
};
