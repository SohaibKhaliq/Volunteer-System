import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

interface Org {
  id: number;
  name: string;
}

interface Props {
  open: boolean;
  organizations: Org[];
  onClose: () => void;
  onSelect: (name: string) => void;
}

export default function OrganizationSelectorModal({ open, organizations, onClose, onSelect }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (open && organizations?.length > 0) setSelected(organizations[0].name);
    if (!open) setSelected(null);
  }, [open, organizations]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Select an organization</DialogTitle>
          <DialogDescription>
            You belong to multiple organizations. Choose which organization you'd like to manage in the organization
            panel.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-2">
            {organizations.map((org) => (
              <label key={org.id} className="flex items-center gap-3 p-3 border rounded hover:bg-slate-50">
                <input
                  type="radio"
                  name="organization"
                  value={org.name}
                  checked={selected === org.name}
                  onChange={() => setSelected(org.name)}
                />
                <div className="font-medium">{org.name}</div>
              </label>
            ))}
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => selected && onSelect(selected)}>Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
