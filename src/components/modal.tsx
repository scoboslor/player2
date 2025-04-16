import { Drawer } from 'vaul';
import { ReactNode, useEffect, useRef, useState } from 'react';

interface Props {
    header: ReactNode;
    content: ReactNode;
}

export let setOp: Function;

export default function InfoSheet({ header, content }: Props) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    setOp = (b: boolean) => {
        setOpen(b);
        ref.current?.scrollTo(0, 0);
    };

    return (
        <Drawer.Root open={open} onOpenChange={setOpen} modal={false} direction="right">
            <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 bg-black/40" />
            <Drawer.Content
                className="right-2 top-2 bottom-2 fixed z-50 outline-none w-96 flex"
                style={{ '--initial-transform': 'calc(100% + 8px)' } as React.CSSProperties}
            >
                {header}
                {content}
            </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}