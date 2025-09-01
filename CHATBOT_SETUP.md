# LPPM Rentals Chatbot Setup

## Overview

The LPPM Rentals application now includes a comprehensive AI-powered chatbot system designed to help users with rental application questions, document requirements, status checks, and general support. The chatbot provides intelligent responses based on rental industry knowledge and integrates seamlessly with the existing application workflow.

## Features

### 🤖 AI-Powered Responses
- **Intelligent Query Processing**: Understands natural language questions about rental applications
- **Context-Aware Responses**: Provides relevant information based on user queries
- **Knowledge Base Integration**: Built-in rental industry knowledge and LPPM-specific information
- **Quick Reply Buttons**: Pre-defined common questions for easy interaction

### 💬 Chat Interface
- **Modern UI Design**: Clean, professional chat interface matching the application design
- **Message History**: Persistent chat history saved to localStorage
- **Typing Indicators**: Visual feedback when the bot is processing responses
- **Avatar System**: Distinct avatars for user and bot messages
- **Responsive Design**: Works on desktop and mobile devices

### 🔧 Advanced Features
- **Minimize/Maximize**: Floating chat window that can be minimized
- **Notification System**: Badge notifications for unread messages
- **Settings Panel**: Sound controls and chat history management
- **Action Integration**: Can navigate users to specific pages in the application
- **Message Persistence**: Chat history survives page refreshes

### 📋 Rental-Specific Knowledge
- **Document Requirements**: Complete list of required and optional documents
- **Application Status**: Information about different application statuses
- **Timeline Information**: Processing times and approval timelines
- **Credit Requirements**: Credit score requirements and alternatives
- **Income Requirements**: Income verification and documentation needs
- **Fee Structure**: Application fees and payment information
- **Co-Applicant Support**: Information about adding co-applicants

## Components

### 1. Chatbot Context (`contexts/chatbot-context.tsx`)
- **Global State Management**: Manages chatbot open/close state across the application
- **Message Persistence**: Handles saving and loading chat history
- **Notification System**: Tracks unread messages and provides notifications
- **Provider Pattern**: Wraps the application to provide chatbot functionality

### 2. Chatbot Button (`components/ui/chatbot-button.tsx`)
- **Floating Action Button**: Always-visible chat button in the bottom-right corner
- **Notification Badge**: Shows when there are unread messages
- **Position Customization**: Can be positioned in different corners
- **Visual Feedback**: Changes appearance based on state

### 3. Enhanced Chatbot (`components/ui/chatbot-enhanced.tsx`)
- **Main Chat Interface**: Full-featured chat window
- **Settings Panel**: Sound controls and chat management
- **Quick Reply System**: Pre-defined response buttons
- **Message Formatting**: Rich text formatting for responses
- **Action Integration**: Can trigger navigation and other actions

### 4. Chatbot Service (`lib/chatbot-service.ts`)
- **AI Response Logic**: Handles message processing and response generation
- **Knowledge Base**: Contains rental industry information
- **Action Handler**: Manages navigation and other actions
- **Message History**: Manages chat history persistence

## Installation & Setup

### 1. Dependencies
The chatbot uses existing dependencies from your project:
- React hooks and context
- Tailwind CSS for styling
- Lucide React for icons
- Existing UI components (Button, Card, Input, etc.)

### 2. Integration
The chatbot is automatically integrated into your application through:

```typescript
// App.tsx
import { ChatbotProvider } from "./contexts/chatbot-context";
import { ChatbotButton } from "./components/ui/chatbot-button";
import { ChatbotEnhanced } from "./components/ui/chatbot-enhanced";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ChatbotProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
            <ChatbotButton />
            <ChatbotEnhanced />
          </TooltipProvider>
        </ChatbotProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

### 3. Usage
The chatbot is automatically available throughout the application:
- **Floating Button**: Always visible in the bottom-right corner
- **Click to Open**: Click the button to open the chat interface
- **Minimize**: Click the X button to minimize the chat
- **Quick Replies**: Use pre-defined buttons for common questions
- **Type Messages**: Type custom questions in the input field

## Customization

### 1. Knowledge Base
Update the rental knowledge in `lib/chatbot-service.ts`:

```typescript
const RENTAL_KNOWLEDGE_BASE = {
  documents: {
    required: [
      "Government-issued photo ID",
      "Proof of income",
      // Add your specific requirements
    ],
    // ... other sections
  }
}
```

### 2. Quick Replies
Customize quick reply options in the chatbot components:

```typescript
const QUICK_REPLIES = [
  "How do I submit documents?",
  "What documents do I need?",
  // Add your custom quick replies
]
```

### 3. Styling
The chatbot uses Tailwind CSS classes. Customize the appearance by modifying:
- Color schemes in the Card components
- Button styles and hover effects
- Avatar images and fallbacks
- Typography and spacing

### 4. Actions
Add custom actions in `lib/chatbot-service.ts`:

```typescript
handleAction(action: string, metadata?: any): void {
  switch (action) {
    case 'custom_action':
      // Your custom action
      break
    // ... other cases
  }
}
```

## API Integration

### 1. Real AI Integration
Replace the mock AI responses with real AI service:

```typescript
// In chatbot-service.ts
async processMessage(userMessage: string, context?: any): Promise<ChatbotResponse> {
  // Replace with your AI service
  const response = await fetch('/api/chatbot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: userMessage, context })
  })
  
  return response.json()
}
```

### 2. Application Data Integration
Connect to your existing DynamoDB service:

```typescript
async getApplicationData(userId: string): Promise<RentalApplicationData[]> {
  // Use your existing dynamoDBService
  const applications = await dynamoDBService.getAllDrafts(userId)
  return applications.map(transformApplicationData)
}
```

## Features in Detail

### Message Types
- **Text**: Standard text responses
- **Document Info**: Special formatting for document requirements
- **Status Info**: Application status information
- **Quick Reply**: Messages with quick reply buttons
- **Action**: Messages that trigger actions

### Response Categories
1. **Document Queries**: Requirements, submission process, missing documents
2. **Status Queries**: Application status, progress tracking
3. **Timeline Queries**: Processing times, approval timelines
4. **Credit Queries**: Credit requirements, low credit options
5. **Income Queries**: Income requirements, documentation
6. **Co-Applicant Queries**: Adding co-applicants, requirements
7. **Fee Queries**: Application fees, payment methods
8. **Criteria Queries**: Overall qualification requirements

### Settings Options
- **Sound Notifications**: Toggle sound for new messages
- **Clear History**: Remove all chat history
- **Minimize**: Collapse chat to floating button

## Best Practices

### 1. Performance
- Messages are processed asynchronously
- Chat history is stored in localStorage for persistence
- Components are optimized for React rendering

### 2. User Experience
- Always provide helpful responses
- Include quick reply options for common questions
- Use clear, concise language
- Provide actionable information

### 3. Maintenance
- Regularly update the knowledge base
- Monitor user interactions for improvement opportunities
- Test new features thoroughly
- Keep the AI responses accurate and up-to-date

## Troubleshooting

### Common Issues
1. **Chatbot not appearing**: Check that ChatbotProvider is properly wrapped
2. **Messages not saving**: Verify localStorage is available
3. **Styling issues**: Ensure Tailwind CSS is properly configured
4. **Actions not working**: Check that action handlers are properly implemented

### Debug Mode
Enable debug logging by adding console.log statements in the chatbot service:

```typescript
async processMessage(userMessage: string, context?: any): Promise<ChatbotResponse> {
  console.log('Processing message:', userMessage)
  console.log('Context:', context)
  // ... rest of the method
}
```

## Future Enhancements

### Planned Features
1. **Voice Integration**: Speech-to-text and text-to-speech
2. **File Upload Support**: Allow users to upload documents through chat
3. **Multi-language Support**: Internationalization for different languages
4. **Advanced Analytics**: Track user interactions and improve responses
5. **Integration with External AI**: Connect to OpenAI, Claude, or other AI services
6. **Proactive Messaging**: Send notifications about application updates
7. **Escalation to Human**: Transfer complex queries to human support

### AI Service Integration
To integrate with external AI services:

```typescript
// Example OpenAI integration
async processMessage(userMessage: string, context?: any): Promise<ChatbotResponse> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful rental application assistant...' },
        { role: 'user', content: userMessage }
      ]
    })
  })
  
  const data = await response.json()
  return {
    message: data.choices[0].message.content,
    type: 'text'
  }
}
```

## Support

For questions or issues with the chatbot implementation:
1. Check the console for error messages
2. Verify all components are properly imported
3. Ensure the ChatbotProvider is wrapping your application
4. Test with different user scenarios
5. Review the knowledge base for accuracy

The chatbot is designed to be robust, user-friendly, and easily maintainable. It provides immediate value to users while being extensible for future enhancements.
