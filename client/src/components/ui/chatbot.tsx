"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Input } from './input'
import { ScrollArea } from './scroll-area'
import { Badge } from './badge'
import { Avatar, AvatarFallback, AvatarImage } from './avatar'
import { 
  MessageCircle, 
  Send, 
  X, 
  Bot, 
  User, 
  Loader2, 
  HelpCircle,
  FileText,
  CreditCard,
  Home,
  Calendar,
  DollarSign,
  Shield,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ChatMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  type?: 'text' | 'quick_reply' | 'document_info' | 'status_info'
  metadata?: {
    applicationId?: string
    documentType?: string
    status?: string
    quickReplies?: string[]
  }
}

interface ChatbotProps {
  className?: string
  onClose?: () => void
  isOpen?: boolean
  onToggle?: () => void
}

const QUICK_REPLIES = [
  "How do I submit documents?",
  "What documents do I need?",
  "Check my application status",
  "How long does approval take?",
  "What if my credit score is low?",
  "Can I add a co-applicant?",
  "How do I pay the application fee?",
  "What's the rental criteria?"
]

const RENTAL_KNOWLEDGE_BASE = {
  documents: {
    required: [
      "Government-issued photo ID (driver's license, passport)",
      "Proof of income (pay stubs, W-2, tax returns)",
      "Bank statements (last 3 months)",
      "Employment verification letter",
      "Previous landlord references",
      "Credit report authorization"
    ],
    optional: [
      "Co-applicant information",
      "Guarantor information",
      "Pet documentation",
      "Vehicle registration"
    ]
  },
  criteria: {
    income: "Income should be at least 3x the monthly rent",
    credit: "Minimum credit score of 650 preferred",
    background: "Clean background check required",
    references: "Positive landlord references"
  },
  timeline: {
    application: "1-2 business days to process",
    approval: "3-5 business days for approval",
    documents: "24-48 hours to verify uploaded documents"
  },
  fees: {
    application: "$50 per applicant",
    credit: "Included in application fee",
    background: "Included in application fee"
  }
}

export function Chatbot({ className, onClose, isOpen = false, onToggle }: ChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: "Hello! I'm your LPPM rental assistant. I can help you with your application, document requirements, status checks, and more. How can I assist you today?",
      role: 'assistant',
      timestamp: new Date(),
      type: 'text',
      metadata: {
        quickReplies: QUICK_REPLIES
      }
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const generateResponse = async (userMessage: string): Promise<ChatMessage> => {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
    
    const lowerMessage = userMessage.toLowerCase()
    
    // Document-related queries
    if (lowerMessage.includes('document') || lowerMessage.includes('documents')) {
      if (lowerMessage.includes('need') || lowerMessage.includes('required')) {
        return {
          id: Date.now().toString(),
          content: `Here are the required documents for your rental application:\n\n**Required Documents:**\n${RENTAL_KNOWLEDGE_BASE.documents.required.map(doc => `• ${doc}`).join('\n')}\n\n**Optional Documents:**\n${RENTAL_KNOWLEDGE_BASE.documents.optional.map(doc => `• ${doc}`).join('\n')}\n\nYou can upload these documents through the application form. Make sure they're clear and legible!`,
          role: 'assistant',
          timestamp: new Date(),
          type: 'document_info'
        }
      }
      if (lowerMessage.includes('submit') || lowerMessage.includes('upload')) {
        return {
          id: Date.now().toString(),
          content: "To submit documents:\n\n1. Go to your application form\n2. Navigate to the 'Supporting Documents' section\n3. Click 'Upload Files' for each document type\n4. Select your files (PDF, JPG, PNG accepted)\n5. Click 'Submit' to upload\n\nDocuments are processed within 24-48 hours. You'll receive an email confirmation once they're verified.",
          role: 'assistant',
          timestamp: new Date(),
          type: 'text'
        }
      }
    }

    // Status-related queries
    if (lowerMessage.includes('status') || lowerMessage.includes('check')) {
      return {
        id: Date.now().toString(),
        content: "To check your application status:\n\n1. Go to your dashboard\n2. Look for the 'Overview' tab\n3. Your application status will be displayed there\n\nCommon statuses:\n• **Draft** - Application in progress\n• **Submitted** - Application submitted, under review\n• **Pending Documents** - Additional documents needed\n• **Approved** - Application approved\n• **Rejected** - Application not approved\n\nIf you need specific help, please provide your application ID.",
        role: 'assistant',
        timestamp: new Date(),
        type: 'status_info'
      }
    }

    // Timeline queries
    if (lowerMessage.includes('how long') || lowerMessage.includes('timeline') || lowerMessage.includes('time')) {
      return {
        id: Date.now().toString(),
        content: `Here's the typical timeline for rental applications:\n\n**Application Processing:** ${RENTAL_KNOWLEDGE_BASE.timeline.application}\n**Document Verification:** ${RENTAL_KNOWLEDGE_BASE.timeline.documents}\n**Final Approval:** ${RENTAL_KNOWLEDGE_BASE.timeline.approval}\n\n**Total Time:** 5-7 business days\n\nNote: This timeline may vary based on document completeness and verification requirements. Incomplete applications may take longer to process.`,
        role: 'assistant',
        timestamp: new Date(),
        type: 'text'
      }
    }

    // Credit score queries
    if (lowerMessage.includes('credit') || lowerMessage.includes('score')) {
      if (lowerMessage.includes('low') || lowerMessage.includes('bad')) {
        return {
          id: Date.now().toString(),
          content: "Don't worry about a low credit score! Here are your options:\n\n**Minimum Credit Score:** ${RENTAL_KNOWLEDGE_BASE.criteria.credit}\n\n**If your score is below 650:**\n• Add a co-applicant with better credit\n• Provide a guarantor\n• Show strong income and employment history\n• Provide additional references\n• Pay a higher security deposit\n\n**We evaluate applications holistically** - credit score is just one factor. Strong income, good references, and clean background can offset lower credit scores.",
          role: 'assistant',
          timestamp: new Date(),
          type: 'text'
        }
      }
      return {
        id: Date.now().toString(),
        content: `Credit requirements for rental applications:\n\n**Preferred Credit Score:** ${RENTAL_KNOWLEDGE_BASE.criteria.credit}\n\n**What we look for:**\n• Payment history\n• Credit utilization\n• Length of credit history\n• Types of credit used\n\n**Credit check is included** in your application fee. We use a soft pull that won't affect your credit score.\n\n**Good news:** We evaluate applications holistically, so other factors can help offset lower credit scores.`,
        role: 'assistant',
        timestamp: new Date(),
        type: 'text'
      }
    }

    // Income queries
    if (lowerMessage.includes('income') || lowerMessage.includes('salary') || lowerMessage.includes('earn')) {
      return {
        id: Date.now().toString(),
        content: `Income requirements for rental applications:\n\n**Income Requirement:** ${RENTAL_KNOWLEDGE_BASE.criteria.income}\n\n**What counts as income:**\n• Regular employment salary\n• Self-employment income\n• Social security benefits\n• Disability benefits\n• Investment income\n• Child support/alimony\n\n**Documentation needed:**\n• Pay stubs (last 3 months)\n• W-2 forms\n• Tax returns\n• Bank statements\n• Employment verification letter\n\n**Multiple income sources:** We can combine income from multiple sources to meet the requirement.`,
        role: 'assistant',
        timestamp: new Date(),
        type: 'text'
      }
    }

    // Co-applicant queries
    if (lowerMessage.includes('co-applicant') || lowerMessage.includes('co applicant') || lowerMessage.includes('roommate')) {
      return {
        id: Date.now().toString(),
        content: "Yes, you can add co-applicants to your rental application!\n\n**Co-applicant benefits:**\n• Combined income to meet requirements\n• Better credit scores\n• Shared responsibility\n• Higher approval chances\n\n**Co-applicant requirements:**\n• Must complete full application\n• Provide all required documents\n• Pay application fee\n• Undergo background check\n\n**How to add:**\n1. Go to your application form\n2. Navigate to 'Additional Applicants' section\n3. Click 'Add Co-applicant'\n4. Fill in their information\n5. Upload their documents\n\n**Note:** Co-applicants are equally responsible for rent and lease terms.",
        role: 'assistant',
        timestamp: new Date(),
        type: 'text'
      }
    }

    // Fee queries
    if (lowerMessage.includes('fee') || lowerMessage.includes('cost') || lowerMessage.includes('pay') || lowerMessage.includes('payment')) {
      return {
        id: Date.now().toString(),
        content: `Application fees and costs:\n\n**Application Fee:** ${RENTAL_KNOWLEDGE_BASE.fees.application}\n**Credit Check:** ${RENTAL_KNOWLEDGE_BASE.fees.credit}\n**Background Check:** ${RENTAL_KNOWLEDGE_BASE.fees.background}\n\n**Payment methods:**\n• Credit card\n• Debit card\n• Bank transfer\n\n**When to pay:**\n• Payment is required when submitting application\n• Fee is non-refundable\n• Covers processing costs\n\n**Additional costs:**\n• Security deposit (1-2 months rent)\n• First month's rent\n• Pet deposit (if applicable)\n• Parking fee (if applicable)\n\n**Fee covers:**\n• Application processing\n• Credit check\n• Background check\n• Document verification`,
        role: 'assistant',
        timestamp: new Date(),
        type: 'text'
      }
    }

    // Criteria queries
    if (lowerMessage.includes('criteria') || lowerMessage.includes('requirements') || lowerMessage.includes('qualify')) {
      return {
        id: Date.now().toString(),
        content: `Rental application criteria:\n\n**Income:** ${RENTAL_KNOWLEDGE_BASE.criteria.income}\n**Credit:** ${RENTAL_KNOWLEDGE_BASE.criteria.credit}\n**Background:** ${RENTAL_KNOWLEDGE_BASE.criteria.background}\n**References:** ${RENTAL_KNOWLEDGE_BASE.criteria.references}\n\n**We evaluate:**\n• Income stability and amount\n• Credit history and score\n• Rental history\n• Employment history\n• Background check results\n• References from previous landlords\n\n**Flexible evaluation:** We consider each application individually. Strong factors can offset weaker ones.\n\n**Need help qualifying?** Consider adding a co-applicant or guarantor!`,
        role: 'assistant',
        timestamp: new Date(),
        type: 'text'
      }
    }

    // Default response
    return {
      id: Date.now().toString(),
      content: "I understand you're asking about rental applications. Let me help you with that! Could you please be more specific about what you'd like to know? For example:\n\n• Document requirements\n• Application status\n• Credit requirements\n• Income requirements\n• Timeline\n• Fees\n• Co-applicants\n\nOr you can use the quick reply buttons below for common questions!",
      role: 'assistant',
      timestamp: new Date(),
      type: 'text',
      metadata: {
        quickReplies: QUICK_REPLIES
      }
    }
  }

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: content.trim(),
      role: 'user',
      timestamp: new Date(),
      type: 'text'
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    try {
      const response = await generateResponse(content)
      setMessages(prev => [...prev, response])
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment or contact our support team directly.",
        role: 'assistant',
        timestamp: new Date(),
        type: 'text'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleQuickReply = (reply: string) => {
    handleSendMessage(reply)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(inputValue)
    }
  }

  const formatMessage = (content: string) => {
    return content.split('\n').map((line, index) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <strong key={index}>{line.slice(2, -2)}</strong>
      }
      if (line.startsWith('• ')) {
        return <li key={index}>{line.slice(2)}</li>
      }
      if (line.startsWith('**') && line.includes(':**')) {
        const [label, ...rest] = line.split(':**')
        return (
          <div key={index} className="font-semibold text-blue-600">
            {label.slice(2)}: {rest.join(':**')}
          </div>
        )
      }
      return <div key={index}>{line}</div>
    })
  }

  if (isMinimized) {
    return (
      <div className={cn("fixed bottom-4 right-4 z-50", className)}>
        <Button
          onClick={() => setIsMinimized(false)}
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg bg-blue-600 hover:bg-blue-700"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    )
  }

  return (
    <div className={cn("fixed bottom-4 right-4 z-50 w-96 h-[600px]", className)}>
      <Card className="h-full shadow-xl border-0">
        <CardHeader className="bg-blue-600 text-white pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <CardTitle className="text-lg">LPPM Rental Assistant</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(true)}
                className="text-white hover:bg-blue-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 h-full flex flex-col">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/bot-avatar.png" />
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg p-3",
                      message.role === 'user'
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    )}
                  >
                    <div className="space-y-2">
                      {formatMessage(message.content)}
                      
                      {message.metadata?.quickReplies && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {message.metadata.quickReplies.map((reply, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuickReply(reply)}
                              className="text-xs h-auto py-1 px-2"
                            >
                              {reply}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {message.role === 'user' && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/user-avatar.png" />
                      <AvatarFallback className="bg-gray-100 text-gray-600">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              
              {isTyping && (
                <div className="flex gap-3 justify-start">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/bot-avatar.png" />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-gray-600">Typing...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>
          
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1"
                disabled={isTyping}
              />
              <Button
                onClick={() => handleSendMessage(inputValue)}
                disabled={!inputValue.trim() || isTyping}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
