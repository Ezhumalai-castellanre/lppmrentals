# CoApplicants otherIncomeFrequency Mapping Test

## Summary of Changes Made

I've successfully updated the webhook service to properly map coApplicants otherIncomeFrequency field to the form data that gets sent to the webhook.

### Changes Made:

1. **Added otherIncomeFrequency to coApplicant interface** in `webhook-service.ts`
2. **Updated coApplicants array mapping** to include otherIncomeFrequency from both flat and nested structures
3. **Enhanced coApplicants array handling** to properly map all coApplicant fields including otherIncomeFrequency

### Implementation Details:

**1. Interface Update:**
```typescript
coApplicant?: {
  // ... other fields ...
  otherIncome?: string;
  otherIncomeFrequency?: string;  // ← Added this field
  otherIncomeSource?: string;
  // ... rest of fields ...
};
```

**2. CoApplicants Array Mapping:**
```typescript
coApplicants: formData.coApplicants ? formData.coApplicants.map((coApplicant: any) => ({
  // ... other fields ...
  otherIncome: coApplicant.otherIncome || "",
  otherIncomeSource: coApplicant.otherIncomeSource || "",
  otherIncomeFrequency: coApplicant.otherIncomeFrequency || "monthly",  // ← Properly mapped
  // ... rest of fields ...
})) : (formData.hasCoApplicant ? [{
  // ... single coApplicant fallback ...
  otherIncomeFrequency: formData.coApplicantOtherIncomeFrequency || formData.coApplicant?.otherIncomeFrequency || "monthly",
  // ... rest of fields ...
}] : [])
```

**3. Single CoApplicant Fallback:**
```typescript
otherIncomeFrequency: formData.coApplicantOtherIncomeFrequency || formData.coApplicant?.otherIncomeFrequency || "monthly",
```

## Data Flow:

1. **Form Data Collection**: CoApplicants otherIncomeFrequency is collected in the form
2. **Form Submission**: The field is included in the completeWebhookData payload
3. **Webhook Service**: The transformFormDataToWebhookFormat method now properly maps otherIncomeFrequency
4. **Webhook Payload**: The field is included in the final webhook payload sent to external systems

## Testing Instructions:

To test the otherIncomeFrequency mapping:

1. **Fill out the application form** with coApplicant information
2. **Set otherIncomeFrequency** for coApplicants (e.g., "monthly", "yearly", "weekly")
3. **Submit the form**
4. **Check browser console** for logs showing the webhook payload
5. **Verify** that otherIncomeFrequency is included in the coApplicants data
6. **Confirm** the webhook receives the otherIncomeFrequency field

## Expected Webhook Payload Structure:

```json
{
  "reference_id": "...",
  "application_id": "...",
  "form_data": {
    "coApplicants": [
      {
        "name": "John Doe",
        "email": "john@example.com",
        "otherIncome": "500",
        "otherIncomeFrequency": "monthly",  // ← This should now be included
        "otherIncomeSource": "Freelance work",
        // ... other fields ...
      }
    ]
  }
}
```

## Benefits:

- ✅ **Complete data mapping**: All coApplicant financial fields are now properly mapped
- ✅ **Consistent structure**: Both single and multiple coApplicants are handled
- ✅ **Fallback support**: Handles both flat and nested data structures
- ✅ **Default values**: Provides sensible defaults ("monthly") when field is empty
- ✅ **Type safety**: Interface includes the field for better TypeScript support

## Files Modified:

- `client/src/lib/webhook-service.ts` (lines 98, 1075-1111)

The implementation is complete and ready for testing!
