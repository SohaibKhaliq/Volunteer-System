import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/atoms/use-toast';
import api from '@/lib/api';
import { useState, useEffect } from 'react';

interface Org {
  id: number;
  name: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  organization: Org | null;
  onSuccess: (org: any) => void;
}

export default function OrganizationModal({ open, onClose, organization, onSuccess }: Props) {
  const isEdit = !!organization;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (open && organization) {
      setName(organization.name || '');
      setDescription(organization.description || '');
      setContactEmail((organization as any).contactEmail ?? (organization as any).contact_email ?? '');
      setContactPhone((organization as any).contactPhone ?? (organization as any).contact_phone ?? '');
    }
    if (!open) {
      setName('');
      setDescription('');
      setContactEmail('');
      setContactPhone('');
    }
  }, [open, organization]);

  const handleSubmit = async () => {
    try {
      // Build payload or FormData if a logo file is present
      let res;
      if (logoFile) {
        const fd = new FormData();
        fd.append('name', name.trim());
        fd.append('description', description.trim());
        fd.append('contact_email', contactEmail.trim());
        fd.append('contact_phone', contactPhone.trim());
        fd.append('logo', logoFile);

        if (isEdit && organization) {
          res = await api.updateOrganization(organization.id, fd);
          toast({ title: 'Organization updated', variant: 'success' });
        } else {
          res = await api.createOrganization(fd);
          toast({ title: 'Organization created', variant: 'success' });
        }
      } else {
        const payload = {
          name: name.trim(),
          description: description.trim(),
          contact_email: contactEmail.trim(),
          contact_phone: contactPhone.trim()
        } as any;

        if (isEdit && organization) {
          res = await api.updateOrganization(organization.id, payload);
          toast({ title: 'Organization updated', variant: 'success' });
        } else {
          res = await api.createOrganization(payload);
          toast({ title: 'Organization created', variant: 'success' });
        }
      }

      onSuccess(res);
    } catch (err) {
      toast({ title: isEdit ? 'Update failed' : 'Create failed', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Organization' : 'Create Organization'}</DialogTitle>
          <DialogDescription>{isEdit ? 'Modify organization details' : 'Add a new organization'}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Input placeholder="Organization name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Input placeholder="Contact email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          <Input placeholder="Contact phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files && e.target.files[0];
                setLogoFile(f ?? null);
                if (f) {
                  const reader = new FileReader();
                  reader.onload = () => setLogoPreview(String(reader.result));
                  reader.readAsDataURL(f);
                } else setLogoPreview(null);
              }}
            />
            {logoPreview && (
              <img src={logoPreview} alt="logo preview" className="mt-2 h-20 w-20 object-cover rounded" />
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>{isEdit ? 'Save changes' : 'Create'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
