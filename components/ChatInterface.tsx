'use client'

import React, { useState, useEffect, useRef } from 'react'
import { getSupabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { User } from '@supabase/supabase-js'

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
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Scroll to bottom of messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Fetch users
    useEffect(() => {
        const fetchUsers = async () => {
            if (!currentUser) return

            try {
                const { data, error } = await getSupabase()
                    .from('users')
                    .select('*')
                    .neq('id', currentUser.id) // Don't show self

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

        // Realtime subscription
        const channel = getSupabase()
            .channel('chat_channel')
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
        } catch (error) {
            console.error('Error sending message:', error)
        }
    }

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
            {/* Sidebar - Users List */}
            <div className="w-1/3 border-r border-gray-200 bg-gray-50 flex flex-col">
                <div className="p-4 border-b border-gray-200 bg-white">
                    <h2 className="text-lg font-semibold text-gray-800">Chats</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {loadingUsers ? (
                        <div className="p-4 text-center text-gray-500">Loading users...</div>
                    ) : users.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">No other users found.</div>
                    ) : (
                        users.map((user) => (
                            <div
                                key={user.id}
                                onClick={() => setSelectedUser(user)}
                                className={`p-4 cursor-pointer hover:bg-gray-100 transition-colors border-b border-gray-100 ${selectedUser?.id === user.id ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : ''
                                    }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                            {user.username.charAt(0).toUpperCase()}
                                        </div>
                                        {user.is_online && (
                                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">{user.username}</h3>
                                        <p className="text-xs text-gray-500 truncate">
                                            {user.email}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-white">
                {selectedUser ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white shadow-sm z-10">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                    {selectedUser.username.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{selectedUser.username}</h3>
                                    <span className="text-xs text-green-500 flex items-center">
                                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                                        Online
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Messages List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                            {messages.length === 0 ? (
                                <div className="flex h-full items-center justify-center text-gray-400">
                                    <p>No messages yet. Say hello! 👋</p>
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
                                                className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${isMyMessage
                                                        ? 'bg-indigo-600 text-white rounded-br-none'
                                                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                                                    }`}
                                            >
                                                <p className="text-sm">{msg.content}</p>
                                                <p className={`text-[10px] mt-1 text-right ${isMyMessage ? 'text-indigo-200' : 'text-gray-400'}`}>
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
                        <div className="p-4 bg-white border-t border-gray-200">
                            <form onSubmit={handleSendMessage} className="flex space-x-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 rounded-full border border-gray-300 px-4 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="bg-indigo-600 text-white rounded-full p-2 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                                    </svg>
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-gray-50 flex-col text-gray-500">
                        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-gray-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700">Welcome to Chat App</h3>
                        <p className="mt-2">Select a user from the sidebar to start messaging</p>
                    </div>
                )}
            </div>
        </div>
    )
}
