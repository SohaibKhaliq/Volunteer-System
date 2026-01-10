import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { useQueryClient } from '@tanstack/react-query';
import { NotificationFormatter } from '@/lib/notification-formatter';



interface UseSocketOptions {
  enabled?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Centralized Socket.IO hook for real-time events
 * Handles authentication, reconnection, and event routing
 */
export const useSocket = (options: UseSocketOptions = {}) => {
  const { enabled = true, onConnect, onDisconnect, onError } = options;
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    // Get auth token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('[Socket.IO] No auth token found, skipping connection');
      return;
    }

    // Determine Socket.IO server URL
    const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:3333';

    console.log('[Socket.IO] Connecting to:', socketUrl);

    // Create Socket.IO connection with JWT auth
    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socketRef.current = socket;

    // Connection handlers
    socket.on('connect', () => {
      console.log('[Socket.IO] Connected:', socket.id);
      setIsConnected(true);
      onConnect?.();
    });

    socket.on('disconnect', () => {
      console.log('[Socket.IO] Disconnected');
      setIsConnected(false);
      onDisconnect?.();
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket.IO] Connection error:', error);
      onError?.(error);
    });

    // ==========================================
    // REAL-TIME EVENT HANDLERS
    // ==========================================

    /**
     * New application received
     * Organization → Applications page
     */
    socket.on('new-application', (data: any) => {
      console.log('[Socket.IO] New application:', data);
      toast.success('New Application', {
        description: `${data.volunteer?.name || 'A volunteer'} applied for ${data.opportunity?.title || 'an opportunity'}`
      });

      // Invalidate applications query to refresh list
      queryClient.invalidateQueries({ queryKey: ['organization', 'applications'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'summary'] });

      // Play notification sound
      playNotificationSound();
    });

    /**
     * Application status changed
     * Volunteer → Applications page
     */
    socket.on('application-status-change', (data: any) => {
      console.log('[Socket.IO] Application status change:', data);
      const status = data.status?.toLowerCase();

      if (status === 'approved') {
        toast.success('Application Approved! 🎉', {
          description: `Your application for ${data.opportunity?.title || 'the opportunity'} has been approved!`
        });
      } else if (status === 'rejected') {
        toast.error('Application Rejected', {
          description: data.notes || 'Your application was not accepted this time.'
        });
      }

      // Invalidate volunteer applications
      queryClient.invalidateQueries({ queryKey: ['volunteer', 'applications'] });
    });

    /**
     * Hours approved
     * Volunteer → Hours, Organization → Hours Approval
     */
    socket.on('hours-approved', (data: any) => {
      console.log('[Socket.IO] Hours approved:', data);
      toast.success('Hours Approved! ✓', {
        description: `${data.hours || 0} hours approved${data.notes ? `: ${data.notes}` : ''}`
      });

      // Invalidate hours queries
      queryClient.invalidateQueries({ queryKey: ['volunteer', 'hours'] });
      queryClient.invalidateQueries({ queryKey: ['hours'] });

      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    });

    /**
     * Hours rejected
     * Volunteer → Hours
     */
    socket.on('hours-rejected', (data: any) => {
      console.log('[Socket.IO] Hours rejected:', data);
      toast.error('Hours Rejected', {
        description: data.reason || 'Your hours were not approved.'
      });

      // Invalidate hours queries
      queryClient.invalidateQueries({ queryKey: ['volunteer', 'hours'] });
      queryClient.invalidateQueries({ queryKey: ['hours'] });
    });

    /**
     * New notification
     * Global notification center
     */
    socket.on('new-notification', (data: any) => {
      console.log('[Socket.IO] New notification:', data);
      toast.info(data.title || 'New Notification', {
        description: data.message || ''
      });

      // Invalidate notifications
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      // Increment notification badge (handled by notification bell component)
      playNotificationSound();
    });

    // Unified notification event from server-side Notification model
    socket.on('notification', (raw: any) => {
      try {
        console.log('[Socket.IO] Received notification:', raw);
        const type: string = (raw && raw.type) || '';

        // payload is often a stringified JSON inside `payload`
        let p: any = raw && raw.payload ? raw.payload : undefined;
        if (typeof p === 'string') {
          try {
            p = JSON.parse(p);
          } catch (e) {
            // keep string if parsing fails
          }
        }

        // Use formatter for title and description
        const title = NotificationFormatter.formatType(type);
        const description = NotificationFormatter.getSummary(type, p);

        // ALWAYS use the same ID to prevent stacking ("sird aik toast show karo")
        const TOAST_ID = 'latest-notification';

        // Helper to show the single toast
        const showToast = (variant: 'success' | 'error' | 'info' | 'message' = 'info') => {
            const opts = {
                id: TOAST_ID,
                description: description || ''
            };
            
            if (variant === 'success') toast.success(title, opts);
            else if (variant === 'error') toast.error(title, opts);
            else if (variant === 'info') toast.info(title, opts);
            else toast(title, opts);
        };

        const typeLower = (type || '').toLowerCase();

        if (typeLower.includes('new_application') || typeLower.includes('new-application')) {
            showToast('success');
            queryClient.invalidateQueries({ queryKey: ['organization', 'applications'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'summary'] });
            playNotificationSound();
        } 
        else if (typeLower.includes('accept') || typeLower.includes('approve')) {
             showToast('success');
             if (typeLower.includes('hours')) {
                queryClient.invalidateQueries({ queryKey: ['volunteer', 'hours'] });
                queryClient.invalidateQueries({ queryKey: ['hours'] });
                confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
             } else {
                queryClient.invalidateQueries({ queryKey: ['volunteer', 'applications'] });
             }
        }
        else if (typeLower.includes('reject')) {
             showToast('error');
             if (typeLower.includes('hours')) {
                queryClient.invalidateQueries({ queryKey: ['volunteer', 'hours'] });
                queryClient.invalidateQueries({ queryKey: ['hours'] });
             } else {
                queryClient.invalidateQueries({ queryKey: ['volunteer', 'applications'] });
             }
        }
        else if (typeLower.includes('check') && (typeLower.includes('in') || typeLower.includes('live'))) {
            showToast('info');
            queryClient.invalidateQueries({ queryKey: ['organization', 'attendances'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'monitoring'] });
        }
        else if (typeLower.includes('achievement')) {
            showToast('success');
            confetti({
                particleCount: 200,
                spread: 100,
                origin: { y: 0.5 },
                colors: ['#FFD700', '#FFA500', '#FF6347']
            });
            queryClient.invalidateQueries({ queryKey: ['volunteer', 'achievements'] });
        }
        else if (typeLower.includes('system')) {
             // System announcements might warrant a warning or staying longer
             toast.warning(title || 'System Announcement', {
                 id: TOAST_ID,
                 description: p?.message || raw?.message || '',
                 duration: 10000
             });
        }
        else {
            // Default handler
            showToast('info');
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            playNotificationSound();
        }

      } catch (err) {
        console.warn('[Socket.IO] failed to handle notification event', err);
      }
    });

    /**
     * Live check-in
     * Admin → Monitoring, Organization → Attendance
     */
    socket.on('live-checkin', (data: any) => {
      console.log('[Socket.IO] Live check-in:', data);
      toast.info('New Check-in', {
        id: 'latest-notification',
        description: `${data.volunteer?.name || 'A volunteer'} checked in${data.opportunity?.title ? ` to ${data.opportunity.title}` : ''}`
      });

      // Invalidate attendance queries
      queryClient.invalidateQueries({ queryKey: ['organization', 'attendances'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'monitoring'] });
    });

    /**
     * Achievement earned
     * Volunteer → Profile
     */
    socket.on('achievement-earned', (data: any) => {
      console.log('[Socket.IO] Achievement earned:', data);

      // Show confetti + modal
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#FFD700', '#FFA500', '#FF6347']
      });

      toast.success('Achievement Unlocked! 🏆', {
        id: 'latest-notification',
        description: data.achievement?.name || 'You earned a new achievement!',
        duration: 5000
      });

      // Invalidate achievements
      queryClient.invalidateQueries({ queryKey: ['volunteer', 'achievements'] });
    });

    /**
     * System announcement
     * All logged-in users
     */
    socket.on('system-announcement', (data: any) => {
      console.log('[Socket.IO] System announcement:', data);
      toast.warning('System Announcement', {
        id: 'latest-notification',
        description: data.message || '',
        duration: 10000
      });
    });

    // Cleanup on unmount
    return () => {
      console.log('[Socket.IO] Disconnecting');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, onConnect, onDisconnect, onError, queryClient]);

  return {
    socket: socketRef.current,
    isConnected,
  };
};

/**
 * Play notification sound
 * Uses Web Audio API for cross-browser support
 */
function playNotificationSound() {
  try {
    // Simple beep using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    // Fail silently if audio is not supported
    console.debug('[Socket.IO] Audio not supported:', error);
  }
}

export default useSocket;
