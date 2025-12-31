'use client'

import React, { useState, useEffect, useRef } from 'react'
import { getSupabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { RealtimeChannel } from '@supabase/supabase-js'

interface ChatUser {
    id: string
    username: string
    email: string
    is_online: boolean
    last_seen: string
    avatar_url?: string
}

interface Message {
    id: string
    content: string
    sender_id: string
    receiver_id: string
    created_at: string
    is_read: boolean
}

export default function ChatInterface() {
    const { user: currentUser } = useAuth()
    const [users, setUsers] = useState<ChatUser[]>([])
    const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loadingUsers, setLoadingUsers] = useState(true)
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const channelRef = useRef<RealtimeChannel | null>(null)
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const [showSidebar, setShowSidebar] = useState(true)

    // Scroll to bottom of messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, typingUsers])

    // Handle user selection for mobile
    const handleSelectUser = (user: ChatUser) => {
        setSelectedUser(user)
        setShowSidebar(false)
    }

    // Fetch users
    useEffect(() => {
        const fetchUsers = async () => {
            if (!currentUser) return

            try {
                const { data, error } = await getSupabase()
                    .from('users')
                    .select('*')
                    .neq('id', currentUser.id)

                if (error) throw error
                setUsers(data || [])
            } catch (error) {
                console.error('Error fetching users:', error)
            } finally {
                setLoadingUsers(false)
            }
        }

        fetchUsers()
    }, [currentUser])

    // Presence & Typing Subscription
    useEffect(() => {
        if (!currentUser) return

        const channel = getSupabase().channel('global_presence')

        channel
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState()
                const onlineIds = new Set<string>()

                for (const id in newState) {
                    // @ts-ignore
                    if (newState[id][0]?.user_id) {
                        // @ts-ignore
                        onlineIds.add(newState[id][0].user_id)
                    }
                }
                setOnlineUsers(onlineIds)
            })
            .on('broadcast', { event: 'typing' }, (payload) => {
                const { user_id, is_typing } = payload.payload
                setTypingUsers((prev) => {
                    const newSet = new Set(prev)
                    if (is_typing) {
                        newSet.add(user_id)
                    } else {
                        newSet.delete(user_id)
                    }
                    return newSet
                })
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({ user_id: currentUser.id, online_at: new Date().toISOString() })
                }
            })

        channelRef.current = channel

        return () => {
            channel.unsubscribe()
        }
    }, [currentUser])

    // Fetch messages and subscribe to realtime updates
    useEffect(() => {
        if (!currentUser || !selectedUser) return

        const fetchMessages = async () => {
            try {
                const { data, error } = await getSupabase()
                    .from('messages')
                    .select('*')
                    .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${currentUser.id})`)
                    .order('created_at', { ascending: true })

                if (error) throw error
                setMessages(data || [])
            } catch (error) {
                console.error('Error fetching messages:', error)
            }
        }

        fetchMessages()

        const channel = getSupabase()
            .channel(`chat:${currentUser.id}:${selectedUser.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `or(and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${currentUser.id}))`
                },
                (payload) => {
                    const newMessage = payload.new as Message
                    setMessages((prev) => [...prev, newMessage])
                }
            )
            .subscribe()

        return () => {
            getSupabase().removeChannel(channel)
        }
    }, [currentUser, selectedUser])

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value)

        if (!channelRef.current || !currentUser) return

        // Send typing event
        channelRef.current.send({
            type: 'broadcast',
            event: 'typing',
            payload: { user_id: currentUser.id, is_typing: true }
        })

        // Clear previous timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
        }

        // Stop typing after 2 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
            channelRef.current?.send({
                type: 'broadcast',
                event: 'typing',
                payload: { user_id: currentUser.id, is_typing: false }
            })
        }, 2000)
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || !currentUser || !selectedUser) return

        try {
            const { error } = await getSupabase()
                .from('messages')
                .insert({
                    content: newMessage.trim(),
                    sender_id: currentUser.id,
                    receiver_id: selectedUser.id,
                })

            if (error) throw error
            setNewMessage('')

            // Stop typing immediately when sent
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
            channelRef.current?.send({
                type: 'broadcast',
                event: 'typing',
                payload: { user_id: currentUser.id, is_typing: false }
            })

        } catch (error) {
            console.error('Error sending message:', error)
        }
    }

    return (
        <div className="flex h-[calc(100vh-8rem)] bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700 relative">
            {/* Sidebar - Users List */}
            <div className={`${showSidebar ? 'flex' : 'hidden'} md:flex w-full md:w-1/3 border-r border-gray-700 bg-gray-900 flex-col`}>
                <div className="p-4 border-b border-gray-700 bg-gray-800">
                    <h2 className="text-lg font-semibold text-white">Chats</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {loadingUsers ? (
                        <div className="p-4 text-center text-gray-400">Loading users...</div>
                    ) : users.length === 0 ? (
                        <div className="p-4 text-center text-gray-400">No other users found.</div>
                    ) : (
                        users.map((user) => {
                            const isUserOnline = onlineUsers.has(user.id)
                            return (
                                <div
                                    key={user.id}
                                    onClick={() => handleSelectUser(user)}
                                    className={`p-4 cursor-pointer hover:bg-gray-800 transition-colors border-b border-gray-800 ${selectedUser?.id === user.id ? 'bg-gray-800 border-l-4 border-l-blue-500' : ''
                                        }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center text-blue-300 font-bold border border-blue-700">
                                                {user.username.charAt(0).toUpperCase()}
                                            </div>
                                            {isUserOnline && (
                                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900 shadow-sm shadow-green-500/50"></div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline">
                                                <h3 className="font-medium text-gray-200 truncate">{user.username}</h3>
                                                {isUserOnline && <span className="text-[10px] text-green-400">Online</span>}
                                            </div>
                                            <p className="text-xs text-gray-400 truncate">
                                                {typingUsers.has(user.id) ? (
                                                    <span className="text-blue-400 animate-pulse font-medium">Typing...</span>
                                                ) : (
                                                    user.email
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className={`${!showSidebar ? 'flex' : 'hidden'} md:flex flex-1 flex-col bg-gray-900`}>
                {selectedUser ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-gray-700 flex items-center justify-between bg-gray-800 shadow-sm z-10">
                            <div className="flex items-center space-x-3">
                                {/* Back button for mobile */}
                                <button
                                    onClick={() => setShowSidebar(true)}
                                    className="md:hidden p-2 -ml-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                    </svg>
                                </button>
                                <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center text-blue-300 font-bold border border-blue-700">
                                    {selectedUser.username.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">{selectedUser.username}</h3>
                                    <div className="flex items-center space-x-2">
                                        {onlineUsers.has(selectedUser.id) ? (
                                            <span className="text-xs text-green-400 flex items-center">
                                                <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                                                Online
                                            </span>
                                        ) : (
                                            <span className="text-xs text-gray-400">Offline</span>
                                        )}
                                        {typingUsers.has(selectedUser.id) && (
                                            <span className="text-xs text-blue-400 italic animate-pulse">
                                                • is typing...
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Messages List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900">
                            {messages.length === 0 ? (
                                <div className="flex h-full items-center justify-center text-gray-500 flex-col space-y-2">
                                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-600">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                                        </svg>
                                    </div>
                                    <p>No messages yet.</p>
                                    <p className="text-sm">Say hello to <span className="text-blue-400 font-semibold">{selectedUser.username}</span>! 👋</p>
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isMyMessage = msg.sender_id === currentUser?.id
                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2 shadow-md ${isMyMessage
                                                    ? 'bg-blue-600 text-white rounded-br-none'
                                                    : 'bg-gray-700 text-gray-200 border border-gray-600 rounded-bl-none'
                                                    }`}
                                            >
                                                <p className="text-sm">{msg.content}</p>
                                                <p className={`text-[10px] mt-1 text-right ${isMyMessage ? 'text-blue-200' : 'text-gray-400'}`}>
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <div className="p-4 bg-gray-800 border-t border-gray-700">
                            <form onSubmit={handleSendMessage} className="flex space-x-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={handleTyping}
                                    placeholder="Type a message..."
                                    className="flex-1 rounded-full border border-gray-600 bg-gray-700 text-white px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-gray-400 transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-600/20"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                                    </svg>
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-gray-900 flex-col text-gray-500 p-4">
                        <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6 border border-gray-700 shadow-xl">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-blue-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2 text-center">Welcome to ChatApp</h3>
                        <p className="text-gray-400 max-w-sm text-center">Select a user from the sidebar to start messaging instantly.</p>
                        <button
                            onClick={() => setShowSidebar(true)}
                            className="md:hidden mt-8 bg-blue-600 text-white px-6 py-2 rounded-full font-bold"
                        >
                            View Chats
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
