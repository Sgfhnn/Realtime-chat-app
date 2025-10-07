import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId

  constructor(private chatService: ChatService) {}

  async afterInit(server: Server) {
    console.log('✅ Socket.IO initialized');

    try {
      const redisHost = process.env.REDIS_HOST || 'localhost';
      const redisPort = Number(process.env.REDIS_PORT || 6379);

      const pubClient = createClient({ url: `redis://${redisHost}:${redisPort}` });
      const subClient = pubClient.duplicate();

      await Promise.all([pubClient.connect(), subClient.connect()]);

      server.adapter(createAdapter(pubClient, subClient));
      console.log('✅ Socket.IO Redis adapter connected');
    } catch (error) {
      console.warn('⚠️  Redis adapter unavailable. Falling back to single-instance mode.');
      if (error instanceof Error) {
        console.warn(`   Reason: ${error.message}`);
      }
      console.warn('   Ensure Redis is running for PM2 cluster support.');
    }
  }

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }


  @SubscribeMessage('register')
  async handleRegister(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    this.connectedUsers.set(data.userId, client.id);
    // Update user status to online
    await this.chatService.updateUserStatus(data.userId, true);
    // Broadcast status change to all connected users
    this.server.emit('userStatusChanged', { userId: data.userId, isOnline: true });
    console.log(`User ${data.userId} registered with socket ${client.id}`);
    return { status: 'registered', userId: data.userId };
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { senderId: string; receiverId: string; content: string },
  ) {
    console.log('Received message:', data);
    try {
      // Save message to database
      const message = await this.chatService.saveMessage(
        data.senderId,
        data.receiverId,
        data.content,
      );
      console.log('Message saved:', message);

      // Send to receiver if online
      const receiverSocketId = this.connectedUsers.get(data.receiverId);
      console.log('Receiver socket ID:', receiverSocketId);
      if (receiverSocketId) {
        this.server.to(receiverSocketId).emit('newMessage', message);
        console.log('Message sent to receiver');
      } else {
        console.log('Receiver not online');
      }

      // Send back to sender for confirmation
      client.emit('messageConfirmed', message);
      console.log('Message confirmed to sender');

      return { status: 'sent', message };
    } catch (error) {
      console.error('Error sending message:', error);
      return { status: 'error', error: error.message };
    }
  }

  @SubscribeMessage('getMessages')
  async handleGetMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId1: string; userId2: string },
  ) {
    try {
      const messages = await this.chatService.getMessagesBetweenUsers(
        data.userId1,
        data.userId2,
      );
      return { status: 'success', messages };
    } catch (error) {
      console.error('Error getting messages:', error);
      return { status: 'error', error: error.message };
    }
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    
    // Find and remove user from connected users
    let disconnectedUserId: string | null = null;
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        disconnectedUserId = userId;
        this.connectedUsers.delete(userId);
        break;
      }
    }

    if (disconnectedUserId) {
      try {
        // Update user status in database
        await this.chatService.updateUserStatus(disconnectedUserId, false);
        
        // Broadcast status change to all connected users
        this.server.emit('userStatusChanged', { 
          userId: disconnectedUserId, 
          isOnline: false, 
          lastSeen: new Date() 
        });
        
        console.log(`User ${disconnectedUserId} went offline`);
      } catch (error) {
        console.error('Error updating user offline status:', error);
      }
    }
  }
}
