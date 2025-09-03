# Employment Type and Document Requirements Updates

## Overview
Updated the rental application system to support only 3 employment types with specific document requirements for each type.

## Employment Types

### 1. Student
- **Description**: Full-time student
- **Default Income Frequency**: Monthly
- **Document Requirements**:
  - Identity Documents: Driver's License (Photo ID), Social Security Card, W9 Form
  - Employment Documents: Employment Letter, Pay Stubs
  - Financial Documents: Tax Returns (Previous Year), Bank Statements
  - Additional Documents: Credit Report

### 2. Self-Employed
- **Description**: Self-employed individual or business owner
- **Default Income Frequency**: Monthly
- **Document Requirements**:
  - Identity Documents: Driver's License (Photo ID), Social Security Card, W9 Form
  - Employment Documents: No Pay Stubs or Employment Letter required
  - Financial Documents: Tax Returns (Previous Year), Bank Statements, Accountant Letter
  - Additional Documents: Credit Report

### 3. Salaried
- **Description**: Salaried employee
- **Default Income Frequency**: Yearly
- **Document Requirements**:
  - Identity Documents: Driver's License (Photo ID), Social Security Card, W9 Form
  - Employment Documents: Employment Letter, Pay Stubs
  - Financial Documents: Tax Returns (Previous Year), Bank Statements
  - Additional Documents: Credit Report

## Implementation Details

### Files Updated
1. **`client/src/components/financial-section.tsx`**
   - Updated employment type dropdown options
   - Updated auto-frequency logic for new employment types
   - Updated conditional rendering logic

2. **`client/src/components/supporting-documents.tsx`**
   - Updated document filtering logic
   - Updated employment type requirements display
   - Maintained existing document structure

3. **`client/src/components/application-form.tsx`**
   - Schema already supports string values (no changes needed)
   - Uses FinancialSection component for employment type selection

### Document Structure
The system maintains the same document categories but dynamically shows/hides documents based on employment type:

- **Identity Documents**: Always required for all employment types
- **Employment Documents**: Conditionally shows Employment Letter based on type
- **Financial Documents**: Always required for all employment types
- **Additional Documents**: Always required for all employment types

### Key Features
- **Dynamic Document Filtering**: Documents are automatically filtered based on selected employment type
- **Conditional Requirements**: 
  - Employment Letter is only required for Student and Salaried types
  - Accountant Letter is required for Self-Employed, removed for Student and Salaried
- **Auto-Frequency Setting**: Automatically sets appropriate income frequency based on employment type
- **Clear User Guidance**: Shows specific requirements for each employment type in the documents section

## User Experience
1. User selects employment type in Financial Information section
2. System automatically sets appropriate income frequency
3. Document requirements are dynamically updated
4. Clear guidance is shown for each employment type
5. Only relevant documents are displayed and marked as required

## Employment Types Summary
- **Student**: Monthly frequency, Employment Letter + Pay Stubs required
- **Self-Employed**: Monthly frequency, No Pay Stubs or Employment Letter required, Accountant Letter required
- **Salaried**: Yearly frequency, Employment Letter + Pay Stubs required (no Accountant Letter)

## Backward Compatibility
- Existing applications with old employment types will continue to work
- New applications will use the updated employment type options
- Document filtering gracefully handles undefined employment types
