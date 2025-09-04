"use client"

import React from 'react'
import { Button } from './button'
import { Badge } from './badge'
import { MessageCircle, X } from 'lucide-react'
import { useChatbot } from '@/contexts/chatbot-context'
import { cn } from '@/lib/utils'

interface ChatbotButtonProps {
  className?: string
  showNotification?: boolean
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

export function ChatbotButton({ 
  className, 
  showNotification = true, 
  position = 'bottom-right' 
}: ChatbotButtonProps) {
  const { 
    isOpen, 
    isMinimized, 
    hasUnreadMessages, 
    toggleChatbot, 
    openChatbot 
  } = useChatbot()

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  }

  if (isOpen) {
    return null // Don't show button when chatbot is open
  }

  return (
    <div className={cn("fixed z-50", positionClasses[position], className)}>
      <div className="relative">
        <Button
          onClick={isMinimized ? openChatbot : toggleChatbot}
          size="lg"
          className={cn(
            "rounded-full h-14 w-14 shadow-lg transition-all duration-200",
            hasUnreadMessages 
              ? "bg-red-600 hover:bg-red-700 animate-pulse" 
              : "bg-blue-600 hover:bg-blue-700"
          )}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
        
        {showNotification && hasUnreadMessages && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-bold animate-bounce"
          >
            !
          </Badge>
        )}
        
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
          {hasUnreadMessages ? 'New message' : 'Chat with us'}
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    </div>
  )
}
