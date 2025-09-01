"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ChatMessage } from '@/components/ui/chatbot'

interface ChatbotContextType {
  isOpen: boolean
  isMinimized: boolean
  messages: ChatMessage[]
  toggleChatbot: () => void
  openChatbot: () => void
  closeChatbot: () => void
  minimizeChatbot: () => void
  restoreChatbot: () => void
  addMessage: (message: ChatMessage) => void
  clearMessages: () => void
  hasUnreadMessages: boolean
  markAsRead: () => void
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined)

interface ChatbotProviderProps {
  children: ReactNode
}

export function ChatbotProvider({ children }: ChatbotProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false)

  // Load messages from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('chatbot-messages')
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages)
        setMessages(parsedMessages)
      } catch (error) {
        console.error('Failed to load chatbot messages:', error)
      }
    }
  }, [])

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('chatbot-messages', JSON.stringify(messages))
  }, [messages])

  // Check for unread messages when chatbot is closed
  useEffect(() => {
    if (!isOpen && !isMinimized && messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.role === 'assistant') {
        setHasUnreadMessages(true)
      }
    }
  }, [messages, isOpen, isMinimized])

  const toggleChatbot = () => {
    if (isMinimized) {
      setIsMinimized(false)
      setIsOpen(true)
    } else {
      setIsOpen(!isOpen)
    }
    if (hasUnreadMessages) {
      setHasUnreadMessages(false)
    }
  }

  const openChatbot = () => {
    setIsOpen(true)
    setIsMinimized(false)
    if (hasUnreadMessages) {
      setHasUnreadMessages(false)
    }
  }

  const closeChatbot = () => {
    setIsOpen(false)
    setIsMinimized(false)
  }

  const minimizeChatbot = () => {
    setIsMinimized(true)
    setIsOpen(false)
  }

  const restoreChatbot = () => {
    setIsMinimized(false)
    setIsOpen(true)
  }

  const addMessage = (message: ChatMessage) => {
    setMessages(prev => [...prev, message])
  }

  const clearMessages = () => {
    setMessages([])
    localStorage.removeItem('chatbot-messages')
  }

  const markAsRead = () => {
    setHasUnreadMessages(false)
  }

  const value: ChatbotContextType = {
    isOpen,
    isMinimized,
    messages,
    toggleChatbot,
    openChatbot,
    closeChatbot,
    minimizeChatbot,
    restoreChatbot,
    addMessage,
    clearMessages,
    hasUnreadMessages,
    markAsRead,
  }

  return (
    <ChatbotContext.Provider value={value}>
      {children}
    </ChatbotContext.Provider>
  )
}

export function useChatbot() {
  const context = useContext(ChatbotContext)
  if (context === undefined) {
    throw new Error('useChatbot must be used within a ChatbotProvider')
  }
  return context
}
