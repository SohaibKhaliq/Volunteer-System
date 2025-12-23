
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HelpRequest } from '@/types/types';
import { format } from 'date-fns';

interface RequestDetailsModalProps {
  request: HelpRequest | null;
  open: boolean;
  onClose: () => void;
}

export function RequestDetailsModal({ request, open, onClose }: RequestDetailsModalProps) {
  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Request Details: {request.caseId || 'N/A'}</DialogTitle>
          <DialogDescription>
            Submitted on {request.createdAt ? format(new Date(request.createdAt), 'PPpp') : 'N/A'}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-bold">Name:</span>
              <span className="col-span-3">{request.name}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-bold">Contact:</span>
              <span className="col-span-3">
                {request.phone} <br /> {request.email}
              </span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-bold">Address:</span>
              <span className="col-span-3">{request.address}</span>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-bold">Severity:</span>
              <span className="col-span-3 uppercase">{request.severity}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-bold">Assistance:</span>
              <span className="col-span-3">
                {request.types?.map((t: any) => t.type).join(', ')}
              </span>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-bold">Description:</span>
              <p className="col-span-3 text-sm text-gray-700 whitespace-pre-wrap">
                {request.description || 'No description provided.'}
              </p>
            </div>
            {request.source && (
               <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-bold">Source:</span>
                <p className="col-span-3 text-sm text-gray-700">
                  {request.source}
                </p>
              </div>
            )}
            {request.metaData && (
              <div className="grid grid-cols-4 items-start gap-4">
                <span className="font-bold">Metadata:</span>
                <pre className="col-span-3 text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(request.metaData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
