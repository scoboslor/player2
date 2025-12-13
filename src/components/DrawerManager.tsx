import React, { useState, ReactNode, useCallback } from 'react';
import { Drawer } from 'vaul';
import NestedDrawer from './NestedDrawer';

export type DrawerData = {
  title: string;
  header: ReactNode;
  content: ReactNode;
  id?: string;
  onScrollToBottom?: () => Promise<void>;
  isLoading?: boolean;
};

type DrawerManagerProps = {
  drawers: DrawerData[];
  onClose: () => void;
};

type DrawerContextType = {
  openDrawer: (data: DrawerData) => void;
  closeDrawer: () => void;
  updateDrawer: (id: string, data: Partial<DrawerData>) => void;
};

export const DrawerContext = React.createContext<DrawerContextType | null>(null);

export function useDrawer() {
  const context = React.useContext(DrawerContext);
  if (!context) {
    throw new Error('useDrawer must be used within a DrawerProvider');
  }
  return context;
}

export function DrawerProvider({ children }: { children: ReactNode }) {
  const [drawers, setDrawers] = useState<DrawerData[]>([]);

  let start: number;
  const drag = (x: { clientX: number }) => {
    if (!start) {
      start = x.clientX;
    }
    document.body.style.setProperty("--x", String(start - x.clientX));
  };

  React.useEffect(() => {
    if (drawers.length === 0) {
      document.body.style.removeProperty("--x");
    }
  }, [drawers]);

  const openDrawer = (data: DrawerData) => {
    const id = data.id || Math.random().toString(36).substr(2, 9);
    setDrawers((prev) => [...prev, { ...data, id }]);
    return id;
  };

  const closeDrawer = () => {
    setDrawers((prev) => prev.slice(0, -1));
  };

  const updateDrawer = (id: string, data: Partial<DrawerData>) => {
    setDrawers((prev) => 
      prev.map(drawer => 
        drawer.id === id ? { ...drawer, ...data } : drawer
      )
    );
  };

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>, drawer: DrawerData) => {
    if (!drawer.onScrollToBottom) return;
    
    const target = e.target as HTMLDivElement;
    const { scrollTop, scrollHeight, clientHeight } = target;
    
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && !drawer.isLoading) {
      drawer.onScrollToBottom();
    }
  }, []);

  function renderNestedDrawers(drawers: DrawerData[], index: number) {
    if (index >= drawers.length) return null;
    
    const currentDrawer = drawers[index];
    
    return (
      <NestedDrawer
        trigger={<button></button>}
        header={currentDrawer.header}
        content={
          <div 
            className="overflow-y-auto flex-1"
            onScroll={(e) => handleScroll(e, currentDrawer)}
          >
            {currentDrawer.content}
            {currentDrawer.isLoading && (
              <div className="flex justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            )}
            {renderNestedDrawers(drawers, index + 1)}
          </div>
        }
        removeDrawer={closeDrawer}
        isModal={false}
        drag={index === 0 ? drag : null}
      />
    );
  }

  return (
    <DrawerContext.Provider value={{ openDrawer, closeDrawer, updateDrawer }}>
      {children}
      {drawers.length > 0 && (
        <Drawer.Root open direction='right' modal={false} onOpenChange={closeDrawer} onDrag={drag}>
          <Drawer.Portal>
            <Drawer.Content
              className="right-2 top-2 bottom-2 fixed z-50 outline-none w-96 flex"
              style={{ '--initial-transform': 'calc(100% + 8px)' } as React.CSSProperties}
            >
              {renderNestedDrawers(drawers, 0)}
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      )}
    </DrawerContext.Provider>
  );
} 