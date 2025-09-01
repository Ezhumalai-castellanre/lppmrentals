import { ChatMessage } from '@/components/ui/chatbot'

export interface ChatbotResponse {
  message: string
  type: 'text' | 'quick_reply' | 'document_info' | 'status_info' | 'action'
  metadata?: {
    quickReplies?: string[]
    applicationId?: string
    documentType?: string
    status?: string
    action?: string
    url?: string
  }
}

export interface RentalApplicationData {
  id: string
  status: string
  progress: number
  missingDocuments: string[]
  applicantName: string
  propertyAddress: string
  submittedDate: string
}

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

export class ChatbotService {
  private static instance: ChatbotService
  private messageHistory: ChatMessage[] = []

  static getInstance(): ChatbotService {
    if (!ChatbotService.instance) {
      ChatbotService.instance = new ChatbotService()
    }
    return ChatbotService.instance
  }

  async processMessage(userMessage: string, context?: any): Promise<ChatbotResponse> {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
    
    const lowerMessage = userMessage.toLowerCase()
    
    // Document-related queries
    if (lowerMessage.includes('document') || lowerMessage.includes('documents')) {
      return this.handleDocumentQueries(lowerMessage)
    }

    // Status-related queries
    if (lowerMessage.includes('status') || lowerMessage.includes('check')) {
      return this.handleStatusQueries(lowerMessage, context)
    }

    // Timeline queries
    if (lowerMessage.includes('how long') || lowerMessage.includes('timeline') || lowerMessage.includes('time')) {
      return this.handleTimelineQueries()
    }

    // Credit score queries
    if (lowerMessage.includes('credit') || lowerMessage.includes('score')) {
      return this.handleCreditQueries(lowerMessage)
    }

    // Income queries
    if (lowerMessage.includes('income') || lowerMessage.includes('salary') || lowerMessage.includes('earn')) {
      return this.handleIncomeQueries()
    }

    // Co-applicant queries
    if (lowerMessage.includes('co-applicant') || lowerMessage.includes('co applicant') || lowerMessage.includes('roommate')) {
      return this.handleCoApplicantQueries()
    }

    // Fee queries
    if (lowerMessage.includes('fee') || lowerMessage.includes('cost') || lowerMessage.includes('pay') || lowerMessage.includes('payment')) {
      return this.handleFeeQueries()
    }

    // Criteria queries
    if (lowerMessage.includes('criteria') || lowerMessage.includes('requirements') || lowerMessage.includes('qualify')) {
      return this.handleCriteriaQueries()
    }

    // Default response
    return this.handleDefaultResponse()
  }

  private handleDocumentQueries(message: string): ChatbotResponse {
    if (message.includes('need') || message.includes('required')) {
      return {
        message: `Here are the required documents for your rental application:\n\n**Required Documents:**\n${RENTAL_KNOWLEDGE_BASE.documents.required.map(doc => `• ${doc}`).join('\n')}\n\n**Optional Documents:**\n${RENTAL_KNOWLEDGE_BASE.documents.optional.map(doc => `• ${doc}`).join('\n')}\n\nYou can upload these documents through the application form. Make sure they're clear and legible!`,
        type: 'document_info',
        metadata: {
          quickReplies: [
            "How do I submit documents?",
            "What if I'm missing documents?",
            "Check my application status"
          ]
        }
      }
    }
    
    if (message.includes('submit') || message.includes('upload')) {
      return {
        message: "To submit documents:\n\n1. Go to your application form\n2. Navigate to the 'Supporting Documents' section\n3. Click 'Upload Files' for each document type\n4. Select your files (PDF, JPG, PNG accepted)\n5. Click 'Submit' to upload\n\nDocuments are processed within 24-48 hours. You'll receive an email confirmation once they're verified.",
        type: 'text',
        metadata: {
          action: 'navigate_to_documents',
          url: '/application'
        }
      }
    }

    return {
      message: "I can help you with document requirements and submission. What specific information do you need?",
      type: 'text',
      metadata: {
        quickReplies: [
          "What documents do I need?",
          "How do I submit documents?",
          "What if I'm missing documents?"
        ]
      }
    }
  }

  private handleStatusQueries(message: string, context?: any): ChatbotResponse {
    return {
      message: "To check your application status:\n\n1. Go to your dashboard\n2. Look for the 'Overview' tab\n3. Your application status will be displayed there\n\nCommon statuses:\n• **Draft** - Application in progress\n• **Submitted** - Application submitted, under review\n• **Pending Documents** - Additional documents needed\n• **Approved** - Application approved\n• **Rejected** - Application not approved\n\nIf you need specific help, please provide your application ID.",
      type: 'status_info',
      metadata: {
        action: 'navigate_to_dashboard',
        url: '/dashboard',
        quickReplies: [
          "Check my application status",
          "What does my status mean?",
          "How long until approval?"
        ]
      }
    }
  }

  private handleTimelineQueries(): ChatbotResponse {
    return {
      message: `Here's the typical timeline for rental applications:\n\n**Application Processing:** ${RENTAL_KNOWLEDGE_BASE.timeline.application}\n**Document Verification:** ${RENTAL_KNOWLEDGE_BASE.timeline.documents}\n**Final Approval:** ${RENTAL_KNOWLEDGE_BASE.timeline.approval}\n\n**Total Time:** 5-7 business days\n\nNote: This timeline may vary based on document completeness and verification requirements. Incomplete applications may take longer to process.`,
      type: 'text',
      metadata: {
        quickReplies: [
          "What if my application takes longer?",
          "How can I speed up the process?",
          "Check my application status"
        ]
      }
    }
  }

  private handleCreditQueries(message: string): ChatbotResponse {
    if (message.includes('low') || message.includes('bad')) {
      return {
        message: "Don't worry about a low credit score! Here are your options:\n\n**Minimum Credit Score:** ${RENTAL_KNOWLEDGE_BASE.criteria.credit}\n\n**If your score is below 650:**\n• Add a co-applicant with better credit\n• Provide a guarantor\n• Show strong income and employment history\n• Provide additional references\n• Pay a higher security deposit\n\n**We evaluate applications holistically** - credit score is just one factor. Strong income, good references, and clean background can offset lower credit scores.",
        type: 'text',
        metadata: {
          quickReplies: [
            "Can I add a co-applicant?",
            "What if I have a guarantor?",
            "How much is the security deposit?"
          ]
        }
      }
    }

    return {
      message: `Credit requirements for rental applications:\n\n**Preferred Credit Score:** ${RENTAL_KNOWLEDGE_BASE.criteria.credit}\n\n**What we look for:**\n• Payment history\n• Credit utilization\n• Length of credit history\n• Types of credit used\n\n**Credit check is included** in your application fee. We use a soft pull that won't affect your credit score.\n\n**Good news:** We evaluate applications holistically, so other factors can help offset lower credit scores.`,
      type: 'text',
      metadata: {
        quickReplies: [
          "What if my credit score is low?",
          "How much is the application fee?",
          "What other factors matter?"
        ]
      }
    }
  }

  private handleIncomeQueries(): ChatbotResponse {
    return {
      message: `Income requirements for rental applications:\n\n**Income Requirement:** ${RENTAL_KNOWLEDGE_BASE.criteria.income}\n\n**What counts as income:**\n• Regular employment salary\n• Self-employment income\n• Social security benefits\n• Disability benefits\n• Investment income\n• Child support/alimony\n\n**Documentation needed:**\n• Pay stubs (last 3 months)\n• W-2 forms\n• Tax returns\n• Bank statements\n• Employment verification letter\n\n**Multiple income sources:** We can combine income from multiple sources to meet the requirement.`,
      type: 'text',
      metadata: {
        quickReplies: [
          "What documents prove my income?",
          "Can I combine income sources?",
          "What if I don't meet the requirement?"
        ]
      }
    }
  }

  private handleCoApplicantQueries(): ChatbotResponse {
    return {
      message: "Yes, you can add co-applicants to your rental application!\n\n**Co-applicant benefits:**\n• Combined income to meet requirements\n• Better credit scores\n• Shared responsibility\n• Higher approval chances\n\n**Co-applicant requirements:**\n• Must complete full application\n• Provide all required documents\n• Pay application fee\n• Undergo background check\n\n**How to add:**\n1. Go to your application form\n2. Navigate to 'Additional Applicants' section\n3. Click 'Add Co-applicant'\n4. Fill in their information\n5. Upload their documents\n\n**Note:** Co-applicants are equally responsible for rent and lease terms.",
      type: 'text',
      metadata: {
        action: 'navigate_to_application',
        url: '/application',
        quickReplies: [
          "How do I add a co-applicant?",
          "What documents do co-applicants need?",
          "How much is the application fee?"
        ]
      }
    }
  }

  private handleFeeQueries(): ChatbotResponse {
    return {
      message: `Application fees and costs:\n\n**Application Fee:** ${RENTAL_KNOWLEDGE_BASE.fees.application}\n**Credit Check:** ${RENTAL_KNOWLEDGE_BASE.fees.credit}\n**Background Check:** ${RENTAL_KNOWLEDGE_BASE.fees.background}\n\n**Payment methods:**\n• Credit card\n• Debit card\n• Bank transfer\n\n**When to pay:**\n• Payment is required when submitting application\n• Fee is non-refundable\n• Covers processing costs\n\n**Additional costs:**\n• Security deposit (1-2 months rent)\n• First month's rent\n• Pet deposit (if applicable)\n• Parking fee (if applicable)\n\n**Fee covers:**\n• Application processing\n• Credit check\n• Background check\n• Document verification`,
      type: 'text',
      metadata: {
        quickReplies: [
          "How do I pay the fee?",
          "What's included in the fee?",
          "Is the fee refundable?"
        ]
      }
    }
  }

  private handleCriteriaQueries(): ChatbotResponse {
    return {
      message: `Rental application criteria:\n\n**Income:** ${RENTAL_KNOWLEDGE_BASE.criteria.income}\n**Credit:** ${RENTAL_KNOWLEDGE_BASE.criteria.credit}\n**Background:** ${RENTAL_KNOWLEDGE_BASE.criteria.background}\n**References:** ${RENTAL_KNOWLEDGE_BASE.criteria.references}\n\n**We evaluate:**\n• Income stability and amount\n• Credit history and score\n• Rental history\n• Employment history\n• Background check results\n• References from previous landlords\n\n**Flexible evaluation:** We consider each application individually. Strong factors can offset weaker ones.\n\n**Need help qualifying?** Consider adding a co-applicant or guarantor!`,
      type: 'text',
      metadata: {
        quickReplies: [
          "What if I don't meet the criteria?",
          "Can I add a co-applicant?",
          "What documents do I need?"
        ]
      }
    }
  }

  private handleDefaultResponse(): ChatbotResponse {
    return {
      message: "I understand you're asking about rental applications. Let me help you with that! Could you please be more specific about what you'd like to know? For example:\n\n• Document requirements\n• Application status\n• Credit requirements\n• Income requirements\n• Timeline\n• Fees\n• Co-applicants\n\nOr you can use the quick reply buttons below for common questions!",
      type: 'text',
      metadata: {
        quickReplies: [
          "What documents do I need?",
          "Check my application status",
          "How long does approval take?",
          "What if my credit score is low?",
          "Can I add a co-applicant?",
          "How do I pay the application fee?",
          "What's the rental criteria?"
        ]
      }
    }
  }

  // Method to get application data for context-aware responses
  async getApplicationData(userId: string): Promise<RentalApplicationData[]> {
    // This would integrate with your existing DynamoDB service
    // For now, return mock data
    return []
  }

  // Method to handle actions from chatbot responses
  handleAction(action: string, metadata?: any): void {
    switch (action) {
      case 'navigate_to_dashboard':
        window.location.href = '/dashboard'
        break
      case 'navigate_to_application':
        window.location.href = '/application'
        break
      case 'navigate_to_documents':
        window.location.href = '/application'
        break
      default:
        console.log('Unknown action:', action)
    }
  }

  // Method to save message history
  saveMessageHistory(messages: ChatMessage[]): void {
    this.messageHistory = messages
    localStorage.setItem('chatbot-message-history', JSON.stringify(messages))
  }

  // Method to load message history
  loadMessageHistory(): ChatMessage[] {
    const saved = localStorage.getItem('chatbot-message-history')
    if (saved) {
      try {
        this.messageHistory = JSON.parse(saved)
      } catch (error) {
        console.error('Failed to load message history:', error)
      }
    }
    return this.messageHistory
  }

  // Method to clear message history
  clearMessageHistory(): void {
    this.messageHistory = []
    localStorage.removeItem('chatbot-message-history')
  }
}

export const chatbotService = ChatbotService.getInstance()
