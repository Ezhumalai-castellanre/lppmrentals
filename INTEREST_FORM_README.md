# Interest Form Component

A comprehensive property interest form component for LPPM Rentals that allows potential tenants to express interest in properties.

## Features

- **Complete Form Fields**: All required fields as specified
- **Form Validation**: Built-in validation using Zod schema
- **Thank You Card**: Shows after successful submission
- **Responsive Design**: Works on all device sizes
- **Modern UI**: Uses shadcn/ui components with Tailwind CSS
- **TypeScript**: Fully typed for better development experience

## Form Fields

### Required Fields (*)
- **Full Name** - Applicant's complete name
- **Property Name** - Name of the property of interest
- **Phone** - Contact phone number
- **Email** - Contact email address
- **Ideal Move-In Date** - Preferred move-in date
- **Current Address** - Current residential address
- **Do you have a co-applicant?** - Yes/No selection
- **Guarantor?** - Yes/No selection
- **Message** - Additional information or questions

### Optional Fields
- **Unit #** - Specific unit number (if applicable)
- **Annual Income [Applicant]** - Annual income information
- **Credit Score [Applicant]** - Credit score information

## Usage

### Basic Usage

```tsx
import { InterestForm } from './components/interest-form'

function MyPage() {
  return (
    <div className="container mx-auto p-4">
      <InterestForm />
    </div>
  )
}
```

### With Custom Styling

```tsx
import { InterestForm } from './components/interest-form'

function MyPage() {
  return (
    <div className="container mx-auto p-4">
      <InterestForm className="shadow-lg max-w-2xl mx-auto" />
    </div>
  )
}
```

## Demo Page

A demo page is available at `/interest-form` route that showcases the component with proper layout and styling.

## Form Submission

The form includes:

1. **Client-side validation** using Zod schema
2. **Loading state** during submission
3. **Success toast notification**
4. **Thank you card** with next steps information
5. **Error handling** with user-friendly messages

## Customization

### Styling
The component uses Tailwind CSS classes and can be customized by passing a `className` prop.

### Form Schema
The validation schema can be modified in the `interestFormSchema` object within the component.

### Submission Logic
The `onSubmit` function can be customized to integrate with your backend API.

## Dependencies

- React Hook Form
- Zod (validation)
- Lucide React (icons)
- shadcn/ui components
- Tailwind CSS

## File Structure

```
client/src/
├── components/
│   └── interest-form.tsx          # Main component
└── pages/
    └── interest-form-demo.tsx     # Demo page
```

## Integration with Backend

To integrate with your backend, modify the `onSubmit` function in the component:

```tsx
const onSubmit = async (data: InterestFormData) => {
  try {
    const response = await fetch('/api/interest-form', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (response.ok) {
      toast({
        title: "Interest Form Submitted!",
        description: "Thank you for your interest. We'll be in touch soon!",
      })
      setIsSubmitted(true)
    } else {
      throw new Error('Submission failed')
    }
  } catch (error) {
    toast({
      title: "Error",
      description: "There was an error submitting your form. Please try again.",
      variant: "destructive",
    })
  }
}
```

## Accessibility

The component includes:
- Proper form labels
- ARIA attributes
- Keyboard navigation
- Screen reader support
- Focus management

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers
- Requires JavaScript enabled
