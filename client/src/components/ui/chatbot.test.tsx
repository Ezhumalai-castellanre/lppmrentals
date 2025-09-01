"use client"

import React from 'react'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { useChatbot } from '@/contexts/chatbot-context'

export function ChatbotTest() {
  const { 
    isOpen, 
    isMinimized, 
    messages, 
    toggleChatbot, 
    openChatbot, 
    closeChatbot, 
    minimizeChatbot,
    addMessage,
    clearMessages,
    hasUnreadMessages
  } = useChatbot()

  const testMessage = {
    id: Date.now().toString(),
    content: "This is a test message from the chatbot test component!",
    role: 'assistant' as const,
    timestamp: new Date(),
    type: 'text' as const
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Chatbot Test Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={toggleChatbot} variant="outline">
            Toggle Chatbot
          </Button>
          <Button onClick={openChatbot} variant="outline">
            Open Chatbot
          </Button>
          <Button onClick={closeChatbot} variant="outline">
            Close Chatbot
          </Button>
          <Button onClick={minimizeChatbot} variant="outline">
            Minimize Chatbot
          </Button>
        </div>
        
        <div className="space-y-2">
          <Button 
            onClick={() => addMessage(testMessage)} 
            variant="secondary"
            className="w-full"
          >
            Add Test Message
          </Button>
          <Button 
            onClick={clearMessages} 
            variant="destructive"
            className="w-full"
          >
            Clear Messages
          </Button>
        </div>
        
        <div className="text-sm space-y-2">
          <div className="flex justify-between">
            <span>Chatbot Open:</span>
            <span className={isOpen ? 'text-green-600' : 'text-red-600'}>
              {isOpen ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Chatbot Minimized:</span>
            <span className={isMinimized ? 'text-green-600' : 'text-red-600'}>
              {isMinimized ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Has Unread Messages:</span>
            <span className={hasUnreadMessages ? 'text-green-600' : 'text-red-600'}>
              {hasUnreadMessages ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Message Count:</span>
            <span>{messages.length}</span>
          </div>
        </div>
        
        {messages.length > 0 && (
          <div className="border rounded p-2 max-h-32 overflow-y-auto">
            <div className="text-xs font-medium mb-2">Recent Messages:</div>
            {messages.slice(-3).map((msg) => (
              <div key={msg.id} className="text-xs mb-1">
                <span className="font-medium">{msg.role}:</span> {msg.content.substring(0, 50)}...
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
