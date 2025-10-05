import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @UseGuards(JwtAuthGuard)
  @Get('messages')
  async getMessages(
    @Query('userId') otherUserId: string,
    @Request() req,
  ) {
    const currentUserId = req.user.userId;
    return this.chatService.getMessagesBetweenUsers(currentUserId, otherUserId);
  }
}
