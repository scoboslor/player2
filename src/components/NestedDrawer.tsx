import { Drawer } from 'vaul';
import { ReactNode, useState } from 'react';

interface NestedDrawerProps {
  trigger: ReactNode;
  header: ReactNode;
  content: ReactNode;
  removeDrawer?: Function;
  isModal?: boolean;
  drag?: Function | null;
}

export default function NestedDrawer({ trigger, header, content, removeDrawer, isModal, drag }: NestedDrawerProps) {
  const [open, setOpen] = useState(true);

  return (
    <Drawer.NestedRoot open={open} modal={isModal} onOpenChange={setOpen} direction='right' onAnimationEnd={removeDrawer} onDrag={drag}>
      <Drawer.Trigger asChild>
        {trigger}
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0" />
        <Drawer.Content
          className="right-2 top-2 bottom-2 fixed z-50 outline-none w-96 flex"
          style={{ '--initial-transform': 'calc(100% + 8px)' } as React.CSSProperties}
        >
          <div className="backdrop-blur-[300px] bg-[#0000001a] h-full w-full grow flex flex-col flex-1 rounded-[16px] overflow-x-hidden overflow-y-auto shadow-lg [scrollbar-width:_none]">
            <div className="w-full mx-auto flex flex-col flex-1 min-h-[1300px]">
              <div className="font-medium text-zinc-900 sticky top-[-330px]">
                {header}
                <Drawer.Close className='absolute right-0 top-0 m-3 mix-blend-overlay'>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20.746 3.329a1 1 0 0 0-1.415 0l-7.294 7.294-7.294-7.294a1 1 0 1 0-1.414 1.414l7.294 7.294-7.294 7.294a1 1 0 0 0 1.414 1.415l7.294-7.295 7.294 7.295a1 1 0 0 0 1.415-1.415l-7.295-7.294 7.295-7.294a1 1 0 0 0 0-1.414" fill="#000000"/></svg>
                </Drawer.Close>
              </div>
              {content}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.NestedRoot>
  );
} 