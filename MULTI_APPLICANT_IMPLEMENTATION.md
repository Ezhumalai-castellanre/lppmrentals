# Multi-Co-Applicant and Guarantor Implementation

This document explains how to implement support for multiple co-applicants and guarantors (up to 4 each) in the existing application form.

## Overview

The implementation adds:
- **Co-Applicants**: Up to 4 co-applicants with individual forms
- **Guarantors**: Up to 4 guarantors with individual forms
- **Dynamic Form Generation**: Forms are generated based on user selection
- **Dropdown Selection**: Users can choose how many co-applicants/guarantors to add

## Key Features

### 1. Co-Applicant Section
- Checkbox to enable/disable co-applicants
- Dropdown to select number of co-applicants (1-4)
- Individual form cards for each co-applicant
- All co-applicant forms share the same field structure

### 2. Guarantor Section
- Checkbox to enable/disable guarantors
- Dropdown to select number of guarantors (1-4)
- Individual form cards for each guarantor
- All guarantor forms share the same field structure

### 3. Dynamic Form Management
- Forms are added/removed based on count selection
- State is properly managed for all form instances
- Data is stored in arrays for easy processing

## Implementation Steps

### Step 1: Update Schema
Update the Zod schema to support arrays of co-applicants and guarantors:

```typescript
const applicationSchema = z.object({
  // ... existing fields ...
  
  // Co-Applicants (Array of up to 4)
  coApplicants: z.array(z.object({
    name: z.string().min(1, "Full name is required"),
    relationship: z.string().optional(),
    dob: z.date({
      required_error: "Date of birth is required",
      invalid_type_error: "Please select a valid date of birth",
    }),
    // ... other fields ...
  })).max(4, "Maximum 4 co-applicants allowed"),

  // Guarantors (Array of up to 4)
  guarantors: z.array(z.object({
    name: z.string().min(1, "Full name is required"),
    relationship: z.string().optional(),
    dob: z.date({
      required_error: "Date of birth is required",
      invalid_type_error: "Please select a valid date of birth",
    }),
    // ... other fields ...
  })).max(4, "Maximum 4 guarantors allowed"),

  // Count fields for UI
  coApplicantCount: z.number().min(0).max(4).default(0),
  guarantorCount: z.number().min(0).max(4).default(0),
});
```

### Step 2: Update Form State
Initialize the form state with arrays:

```typescript
const [formData, setFormData] = useState<any>({
  // ... existing fields ...
  
  // Co-Applicants (Array of up to 4)
  coApplicants: [
    {
      name: '',
      relationship: '',
      dob: undefined,
      // ... initialize all fields ...
    }
  ],

  // Guarantors (Array of up to 4)
  guarantors: [
    {
      name: '',
      relationship: '',
      dob: undefined,
      // ... initialize all fields ...
    }
  ],

  // Count fields
  coApplicantCount: 0,
  guarantorCount: 0,
});
```

### Step 3: Add Count Change Handlers
Implement handlers for when users change the count:

```typescript
const handleCoApplicantCountChange = (count: number) => {
  setFormData((prev: any) => {
    const currentCoApplicants = prev.coApplicants || [];
    if (count > currentCoApplicants.length) {
      // Add new co-applicants
      const newCoApplicants = [...currentCoApplicants];
      for (let i = currentCoApplicants.length; i < count; i++) {
        newCoApplicants.push({
          name: '',
          relationship: '',
          // ... initialize all fields ...
        });
      }
      return {
        ...prev,
        coApplicants: newCoApplicants,
        coApplicantCount: count
      };
    } else if (count < currentCoApplicants.length) {
      // Remove excess co-applicants
      return {
        ...prev,
        coApplicants: currentCoApplicants.slice(0, count),
        coApplicantCount: count
      };
    }
    return prev;
  });
};
```

### Step 4: Update Form Rendering
Replace the single co-applicant/guarantor forms with dynamic arrays:

```typescript
{/* Render co-applicant forms based on count */}
{Array.from({ length: formData.coApplicantCount || 1 }, (_, index) => (
  <Card key={index} className="form-section border-l-4 border-l-blue-500">
    <CardHeader>
      <CardTitle className="flex items-center text-blue-700 dark:text-blue-400">
        <UserCheck className="w-5 h-5 mr-2" />
        Co-Applicant {index + 1}
      </CardTitle>
    </CardHeader>
    <CardContent className="p-4 sm:p-8">
      {/* Form fields using index */}
      <Input 
        value={formData.coApplicants[index]?.name || ''}
        onChange={(e) => updateFormData('coApplicants', index.toString(), 'name', e.target.value)}
      />
      {/* ... other fields ... */}
    </CardContent>
  </Card>
))}
```

### Step 5: Update Data Processing
Modify the form submission logic to handle arrays:

```typescript
const submitData = {
  // ... existing fields ...
  
  // Co-Applicants
  coApplicants: formData.coApplicants.map((coApplicant: any) => ({
    name: coApplicant.name,
    relationship: coApplicant.relationship,
    // ... map all fields ...
  })),
  
  // Guarantors
  guarantors: formData.guarantors.map((guarantor: any) => ({
    name: guarantor.name,
    relationship: guarantor.relationship,
    // ... map all fields ...
  })),
};
```

## UI Components

### Dropdown Selection
```typescript
<div className="flex items-center space-x-4">
  <Label className="text-sm font-medium">How many Co-Applicants?</Label>
  <Select
    value={formData.coApplicantCount?.toString() || '1'}
    onValueChange={(value) => handleCoApplicantCountChange(parseInt(value))}
  >
    <SelectTrigger className="w-64">
      <SelectValue placeholder="Select number" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="1">1 Co-Applicant</SelectItem>
      <SelectItem value="2">2 Co-Applicants</SelectItem>
      <SelectItem value="3">3 Co-Applicants</SelectItem>
      <SelectItem value="4">4 Co-Applicants</SelectItem>
    </SelectContent>
  </Select>
</div>
```

### Dynamic Form Cards
Each co-applicant/guarantor gets their own card with:
- Unique title (e.g., "Co-Applicant 1", "Guarantor 2")
- Color-coded borders for easy identification
- Individual form fields with proper indexing

## Data Structure

### Co-Applicant Object
```typescript
interface CoApplicant {
  name: string;
  relationship: string;
  dob: string;
  ssn: string;
  phone: string;
  email: string;
  license: string;
  licenseState: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  lengthAtAddressYears: number;
  lengthAtAddressMonths: number;
  landlordName: string;
  landlordAddressLine1: string;
  landlordAddressLine2: string;
  landlordCity: string;
  landlordState: string;
  landlordZipCode: string;
  landlordPhone: string;
  landlordEmail: string;
  currentRent: number;
  reasonForMoving: string;
  employmentType: string;
  employer: string;
  position: string;
  employmentStart: string;
  income: string;
  incomeFrequency: string;
  businessName: string;
  businessType: string;
  yearsInBusiness: string;
  otherIncome: string;
  otherIncomeFrequency: string;
  otherIncomeSource: string;
  bankRecords: any[];
}
```

### Guarantor Object
Same structure as CoApplicant with all the same fields.

## Benefits

1. **Scalability**: Easy to add more co-applicants/guarantors
2. **User Experience**: Clear visual separation between different people
3. **Data Management**: Structured arrays make data processing easier
4. **Validation**: Can validate each individual's data separately
5. **Flexibility**: Users can choose exactly how many they need

## Integration Notes

- Update the existing `updateFormData` function to handle array updates
- Modify form validation to check all co-applicants/guarantors
- Update PDF generation to include all co-applicants/guarantors
- Ensure webhook submissions include all data
- Update any existing co-applicant/guarantor logic to work with arrays

## Example Usage

```typescript
// Import the component
import { MultiApplicantForm } from './components/multi-applicant-form';

// Use in your application
function ApplicationPage() {
  return (
    <div>
      <h1>Rental Application</h1>
      <MultiApplicantForm />
    </div>
  );
}
```

This implementation provides a clean, scalable solution for handling multiple co-applicants and guarantors while maintaining the existing form structure and validation.
