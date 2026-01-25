import { io, Socket } from 'socket.io-client';
import { Platform, DeviceEventEmitter } from 'react-native';

// Android Emulator uses 10.0.2.2 for localhost
const SOCKET_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3102' : 'http://localhost:3102';

class SocketService {
  private socket: Socket | null = null;
  private token: string | null = null;

  init(token: string) {
    if (this.token === token && this.socket?.connected) {
      return;
    }
    
    this.token = token;
    this.connect();
  }

  private connect() {
    if (this.socket) {
      this.socket.disconnect();
    }

    console.log(`🔌 Connecting to Socket Gateway at ${SOCKET_URL}...`);

    this.socket = io(SOCKET_URL, {
      auth: { token: this.token },
      transports: ['websocket'], // Prefer WebSocket
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log(`✅ Socket Connected: ${this.socket?.id}`);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket Disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Token invalid or server kicked
        this.socket = null;
      }
    });

    this.socket.on('connect_error', (err) => {
      console.warn('⚠️ Socket Connection Error:', err.message);
    });

    // Listen for backend notifictions
    this.socket.on('notification:new', (payload: any) => {
      console.log('🔔 Received Realtime Notification:', payload);
      // Emit to React Native UI
      DeviceEventEmitter.emit('notification_received', payload);
    });

    // Listen for OCR completion specifically
    this.socket.on('ocr.completed', (payload: any) => {
      console.log('🧾 Received OCR Completion Event:', payload);
      
      const notification = {
        title: 'OCR Hoàn tất',
        body: `Đã quét xong hóa đơn: ${payload.expenseData?.amount?.toLocaleString()} đ`,
        data: { type: 'ocr_result', jobId: payload.jobId },
        createdAt: new Date().toISOString()
      };

      // Emit as notification locally
      DeviceEventEmitter.emit('notification_received', notification);
    });
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting Socket...');
      this.socket.disconnect();
      this.socket = null;
      this.token = null;
    }
  }
}

export const socketService = new SocketService();
