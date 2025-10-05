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

  afterInit(server: Server) {
    console.log('✅ Socket.IO initialized');
    console.log('⚠️  Running without Redis adapter (single instance mode)');
    console.log('   To enable PM2 cluster mode, install Redis and the adapter package');
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    // Remove user from connected users
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        this.connectedUsers.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('register')
  handleRegister(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    this.connectedUsers.set(data.userId, client.id);
    console.log(`User ${data.userId} registered with socket ${client.id}`);
    return { status: 'registered', userId: data.userId };
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { senderId: string; receiverId: string; content: string },
  ) {
    try {
      // Save message to database
      const message = await this.chatService.saveMessage(
        data.senderId,
        data.receiverId,
        data.content,
      );

      // Send to receiver if online
      const receiverSocketId = this.connectedUsers.get(data.receiverId);
      if (receiverSocketId) {
        this.server.to(receiverSocketId).emit('newMessage', message);
      }

      // Send back to sender for confirmation
      client.emit('messageConfirmed', message);

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
}
