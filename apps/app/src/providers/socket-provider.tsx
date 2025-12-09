import { createContext, useContext, ReactNode } from 'react';
import { Socket } from 'socket.io-client';
import useSocket from '@/hooks/useSocket';

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
});

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
  enabled?: boolean;
}

/**
 * Socket.IO Provider
 * Provides centralized Socket.IO connection to all components
 */
export const SocketProvider = ({ children, enabled = true }: SocketProviderProps) => {
  const { socket, isConnected } = useSocket({
    enabled,
    onConnect: () => {
      console.log('[SocketProvider] Connected to Socket.IO');
    },
    onDisconnect: () => {
      console.log('[SocketProvider] Disconnected from Socket.IO');
    },
    onError: (error) => {
      console.error('[SocketProvider] Socket.IO error:', error);
    },
  });

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
