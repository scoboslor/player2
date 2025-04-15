import { Drawer } from 'vaul';
import { ReactNode, useState } from 'react';

interface Props {
    header: ReactNode;
    content: ReactNode;
}

export let setOp: Function;

export default function InfoSheet({ header, content }: Props) {
    const [open, setOpen] = useState(false);

    setOp = setOpen;

    return (
        <Drawer.Root open={open} onOpenChange={setOpen} modal={false} direction="right">
            <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 bg-black/40" />
            <Drawer.Content
                className="right-2 top-2 bottom-2 fixed z-50 outline-none w-96 flex"
                style={{ '--initial-transform': 'calc(100% + 8px)' } as React.CSSProperties}
            >
                <div className="backdrop-blur-[300px] bg-[#0000001a] h-full w-full grow flex flex-col flex-1 rounded-[16px] overflow-x-hidden overflow-y-auto shadow-lg">
                    <div className="max-w-md mx-auto flex flex-col flex-1">
                        <Drawer.Title className="font-medium text-zinc-900 sticky top-[-330px]">
                            {header}
                            <button className='absolute right-0 top-0 m-3 mix-blend-overlay' onClick={() => setOpen(false)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20.746 3.329a1 1 0 0 0-1.415 0l-7.294 7.294-7.294-7.294a1 1 0 1 0-1.414 1.414l7.294 7.294-7.294 7.294a1 1 0 0 0 1.414 1.415l7.294-7.295 7.294 7.295a1 1 0 0 0 1.415-1.415l-7.295-7.294 7.295-7.294a1 1 0 0 0 0-1.414" fill="#000000"/></svg>
                            </button>
                        </Drawer.Title>
                        {content}
                    </div>
                </div>
            </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}