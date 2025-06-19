import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/contexts/AuthContext';

export function MobileHeader() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b">
      <div className="flex items-center justify-between p-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <Sidebar />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{user?.name}</span>
        </div>
      </div>
    </div>
  );
} 