import { useState } from 'react';
import NestedDrawer from './NestedDrawer';

export default function NestedDrawerExample() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button 
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Open Parent Drawer
      </button>

      <NestedDrawer
        trigger={
          <button className="px-4 py-2 bg-green-500 text-white rounded">
            Open Nested Drawer
          </button>
        }
        header={
          <div className="p-4">
            <h2 className="text-xl font-bold">Nested Drawer Header</h2>
          </div>
        }
        content={
          <div className="p-4">
            <p>This is the content of the nested drawer.</p>
            <p>You can add any content here, including another nested drawer if needed.</p>
            <NestedDrawer
                trigger={
                <button className="px-4 py-2 bg-green-500 text-white rounded">
                    Open Nested Drawer
                </button>
                }
                header={
                <div className="p-4">
                    <h2 className="text-xl font-bold">Nested Drawer Header</h2>
                </div>
                }
                content={
                <div className="p-4">
                    <p>This is the content of the nested drawer.</p>
                    <p>You can add any content here, including another nested drawer if needed.</p>
                </div>
                }
            />
          </div>
        }
      />
    </div>
  );
} 