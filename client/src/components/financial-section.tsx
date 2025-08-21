import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { DatePicker } from "./ui/date-picker";
import { IncomeWithFrequencyInput } from "./ui/validated-input";
import { Plus, Trash2 } from "lucide-react";
import { useEffect } from "react";

interface FinancialSectionProps {
  title: string;
  person: "applicant" | "coApplicant" | "guarantor" | string; // Allow string for guarantors_0, guarantors_1, etc.
  formData: any;
  updateFormData: (section: string, indexOrField: string, fieldOrValue: any, value?: any) => void;
}

export function FinancialSection({ title, person, formData, updateFormData }: FinancialSectionProps) {
  // Handle guarantors_0, guarantors_1, etc. format
  let personData: any = {};
  
  if (person.startsWith('guarantors_')) {
    // Extract guarantor index and get data from guarantors array
    const guarantorIndex = parseInt(person.replace('guarantors_', ''), 10);
    personData = formData.guarantors?.[guarantorIndex] || {};
  } else if (person.startsWith('coApplicants_')) {
    // Extract co-applicant index and get data from coApplicants array
    const coApplicantIndex = parseInt(person.replace('coApplicants_', ''), 10);
    personData = formData.coApplicants?.[coApplicantIndex] || {};
  } else {
    // Handle applicant, coApplicant, guarantor (legacy format)
    personData = formData[person] || {};
  }
  
  // Debug logging for current person data
  console.log(`💰 Financial Section - ${person} current data:`, {
    income: personData.income,
    incomeFrequency: personData.incomeFrequency,
    otherIncome: personData.otherIncome,
    otherIncomeFrequency: personData.otherIncomeFrequency,
    otherIncomeSource: personData.otherIncomeSource,
    employmentType: personData.employmentType,
    bankRecords: personData.bankRecords,
    bankRecordsLength: personData.bankRecords?.length
  });

  // Auto-set default frequency values when component mounts or employment type changes
  useEffect(() => {
    if (personData.employmentType && !personData.incomeFrequency) {
      const defaultFrequency = personData.employmentType === 'salaried' ? 'yearly' : 'monthly';
      console.log(`💰 Auto-setting default income frequency for ${person}:`, defaultFrequency);
      handleChange('incomeFrequency', defaultFrequency);
    }
    if (!personData.otherIncomeFrequency) {
      console.log(`💰 Auto-setting default other income frequency for ${person}: monthly`);
      handleChange('otherIncomeFrequency', 'monthly');
    }
  }, [personData.employmentType, personData.incomeFrequency, personData.otherIncomeFrequency]);

  const handleChange = (field: string, value: string) => {
    console.log(`💰 Financial Section - ${person} ${field}:`, value);
    
    if (person.startsWith('guarantors_')) {
      // Handle guarantors array format
      const guarantorIndex = parseInt(person.replace('guarantors_', ''), 10);
      updateFormData('guarantors', guarantorIndex.toString(), field, value);
    } else if (person.startsWith('coApplicants_')) {
      // Handle co-applicants array format
      const coApplicantIndex = parseInt(person.replace('coApplicants_', ''), 10);
      updateFormData('coApplicants', coApplicantIndex.toString(), field, value);
    } else {
      // Handle legacy format
      updateFormData(person, field, value);
    }
  };

  const handleDateChange = (field: string, date: Date | undefined) => {
    if (person.startsWith('guarantors_')) {
      // Handle guarantors array format
      const guarantorIndex = parseInt(person.replace('guarantors_', ''), 10);
      updateFormData('guarantors', guarantorIndex.toString(), field, date?.toISOString());
    } else if (person.startsWith('coApplicants_')) {
      // Handle co-applicants array format
      const coApplicantIndex = parseInt(person.replace('coApplicants_', ''), 10);
      updateFormData('coApplicants', coApplicantIndex.toString(), field, date?.toISOString());
    } else {
      // Handle legacy format
      updateFormData(person, field, date?.toISOString());
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Employment Type Dropdown */}
        <div className="form-field">
          <Label htmlFor={`${person}-employmentType`}>Employment Type *</Label>
          <Select
            value={personData.employmentType || ''}
            onValueChange={(value) => {
              handleChange('employmentType', value);
                             // Auto-set default frequency values when employment type changes
               if (value === 'salaried' && !personData.incomeFrequency) {
                 handleChange('incomeFrequency', 'yearly');
               } else if (value === 'self-employed' && !personData.incomeFrequency) {
                 handleChange('incomeFrequency', 'monthly');
               } else if (value === 'student' && !personData.incomeFrequency) {
                 handleChange('incomeFrequency', 'monthly');
               }
              // Auto-set default other income frequency if not set
              if (!personData.otherIncomeFrequency) {
                handleChange('otherIncomeFrequency', 'monthly');
              }
            }}
          >
            <SelectTrigger className="input-field">
              <SelectValue placeholder="Select employment type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="self-employed">Self-Employed</SelectItem>
                             <SelectItem value="salaried">Salaried</SelectItem>
            </SelectContent>
          </Select>
        </div>

                 {/* Dynamic Fields Based on Employment Type */}
        {/* Debug: Show current employment type and available fields */}
        <div className="text-xs text-gray-500 mb-2">
          Debug: Current employment type: "{personData.employmentType}" (Type: {typeof personData.employmentType})
          <br />
          Available fields: {Object.keys(personData).join(', ')}
        </div>
        
        {/* Debug: Show conditional rendering status */}
        <div className="text-xs text-gray-500 mb-2">
          Salaried condition: {personData.employmentType === 'salaried' ? 'TRUE' : 'FALSE'}
          <br />
          Student condition: {personData.employmentType === 'student' ? 'TRUE' : 'FALSE'}
          <br />
          Self-employed condition: {personData.employmentType === 'self-employed' ? 'TRUE' : 'FALSE'}
        </div>
        
        {(personData.employmentType === 'salaried' || personData.employmentType?.trim() === 'salaried') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-field">
              <Label htmlFor={`${person}-employer`}>Employer Name *</Label>
              <Input
                id={`${person}-employer`}
                placeholder="Company name"
                value={personData.employer || ""}
                onChange={(e) => handleChange("employer", e.target.value)}
                className="input-field"
              />
            </div>
            <div className="form-field">
              <Label htmlFor={`${person}-position`}>Position/Title *</Label>
              <Input
                id={`${person}-position`}
                placeholder="Job title"
                value={personData.position || ""}
                onChange={(e) => handleChange("position", e.target.value)}
                className="input-field"
              />
            </div>
            <div className="form-field">
              <Label htmlFor={`${person}-employmentStart`}>Employment Start Date</Label>
              <DatePicker
                value={personData.employmentStart ? new Date(personData.employmentStart) : undefined}
                onChange={(date) => handleDateChange("employmentStart", date)}
                placeholder="Select employment start date"
                disabled={(date) => date > new Date()}
              />
            </div>
            <div className="form-field">
              <IncomeWithFrequencyInput
                name={`${person}-income`}
                label="Income ($) *"
                value={personData.income || ""}
                frequency={personData.incomeFrequency || "yearly"}
                onValueChange={(value) => handleChange("income", value)}
                onFrequencyChange={(frequency) => handleChange("incomeFrequency", frequency)}
                required={true}
              />
            </div>
          </div>
        )}
        {(personData.employmentType === 'student' || personData.employmentType?.trim() === 'student') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-field">
              <Label htmlFor={`${person}-schoolName`}>School/University Name *</Label>
              <Input
                id={`${person}-schoolName`}
                placeholder="School or university name"
                value={personData.schoolName || ""}
                onChange={(e) => handleChange("schoolName", e.target.value)}
                className="input-field"
              />
            </div>
            <div className="form-field">
              <Label htmlFor={`${person}-studentId`}>Student ID (Optional)</Label>
              <Input
                id={`${person}-studentId`}
                placeholder="Student ID number"
                value={personData.studentId || ""}
                onChange={(e) => handleChange("studentId", e.target.value)}
                className="input-field"
              />
            </div>
            <div className="form-field">
              <Label htmlFor={`${person}-expectedGraduation`}>Expected Graduation Date</Label>
              <DatePicker
                value={personData.expectedGraduation ? new Date(personData.expectedGraduation) : undefined}
                onChange={(date) => handleDateChange("expectedGraduation", date)}
                placeholder="Select expected graduation date"
                disabled={(date) => date < new Date()}
              />
            </div>
            <div className="form-field">
              <IncomeWithFrequencyInput
                name={`${person}-income`}
                label="Income ($) *"
                value={personData.income || ""}
                frequency={personData.incomeFrequency || "monthly"}
                onValueChange={(value) => handleChange("income", value)}
                onFrequencyChange={(frequency) => handleChange("incomeFrequency", frequency)}
                required={true}
              />
            </div>
          </div>
        )}

                 {(personData.employmentType === 'self-employed' || personData.employmentType?.trim() === 'self-employed') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-field">
              <Label htmlFor={`${person}-businessName`}>Business Name *</Label>
              <Input
                id={`${person}-businessName`}
                placeholder="Business name"
                value={personData.businessName || ""}
                onChange={(e) => handleChange("businessName", e.target.value)}
                className="input-field"
              />
            </div>
            <div className="form-field">
              <Label htmlFor={`${person}-businessType`}>Business Type *</Label>
              <Input
                id={`${person}-businessType`}
                placeholder="Type of business"
                value={personData.businessType || ""}
                onChange={(e) => handleChange("businessType", e.target.value)}
                className="input-field"
              />
            </div>
            {/* Custom row for Years in Business and  Income */}
            <div className="col-span-1 md:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-field flex flex-col justify-end">
                  <Label htmlFor={`${person}-yearsInBusiness`}>Years in Business *</Label>
                  <Input
                    id={`${person}-yearsInBusiness`}
                    placeholder="e.g., 5"
                    type="number"
                    min={0}
                    value={personData.yearsInBusiness || ""}
                    onChange={(e) => handleChange("yearsInBusiness", e.target.value)}
                    className="input-field"
                  />
                </div>
                <div className="form-field flex flex-col justify-end">
                  <IncomeWithFrequencyInput
                    name={`${person}-income`}
                    label=" Income ($) *"
                    value={personData.income || ""}
                    frequency={personData.incomeFrequency || "monthly"}
                    onValueChange={(value) => handleChange("income", value)}
                    onFrequencyChange={(frequency) => handleChange("incomeFrequency", frequency)}
                    required={true}
                    className=""
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other Income Section (shown for all types) */}
        <div className="form-field">
          <IncomeWithFrequencyInput
            name={`${person}-otherIncome`}
            label="Other Income ($)"
            value={personData.otherIncome || ""}
            frequency={personData.otherIncomeFrequency || "monthly"}
            onValueChange={(value) => handleChange("otherIncome", value)}
            onFrequencyChange={(frequency) => handleChange("otherIncomeFrequency", frequency)}
          />
        </div>
        <div className="form-field">
          <Label htmlFor={`${person}-otherIncomeSource`}>Other Income Source</Label>
          <Input
            id={`${person}-otherIncomeSource`}
            placeholder="e.g., investments, alimony, etc."
            value={personData.otherIncomeSource || ""}
            onChange={(e) => handleChange("otherIncomeSource", e.target.value)}
            className="input-field"
          />
        </div>

        {/* Bank Information */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Bank Information</Label>
            <div className="flex gap-2">
                             {(!personData?.bankRecords || personData?.bankRecords.length === 0) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log(`Initializing bank records for ${person}`);
                    const initialRecord = { bankName: '', accountType: '', accountNumber: '' };
                    if (person.startsWith('coApplicants_')) {
                      const coApplicantIndex = parseInt(person.replace('coApplicants_', ''), 10);
                      updateFormData('coApplicants', coApplicantIndex.toString(), 'bankRecords', [initialRecord]);
                    } else if (person.startsWith('guarantors_')) {
                      const guarantorIndex = parseInt(person.replace('guarantors_', ''), 10);
                      updateFormData('guarantors', guarantorIndex.toString(), 'bankRecords', [initialRecord]);
                    } else {
                      updateFormData(person, 'bankRecords', [initialRecord]);
                    }
                  }}
                >
                  Add First Bank Account
                </Button>
              )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                                 const bankRecords = personData?.bankRecords || [];
                   console.log(`Adding bank record for ${person}:`, {
                     currentBankRecords: bankRecords,
                     currentLength: bankRecords.length
                   });
                 const newRecord = { bankName: '', accountType: '', accountNumber: '' };
                   const updatedRecords = [...bankRecords, newRecord];
                   console.log(`Updated bank records for ${person}:`, {
                     updatedRecords,
                     newLength: updatedRecords.length
                   });
                   if (person.startsWith('coApplicants_')) {
                    const coApplicantIndex = parseInt(person.replace('coApplicants_', ''), 10);
                    updateFormData('coApplicants', coApplicantIndex.toString(), 'bankRecords', updatedRecords);
                  } else if (person.startsWith('guarantors_')) {
                    const guarantorIndex = parseInt(person.replace('guarantors_', ''), 10);
                    updateFormData('guarantors', guarantorIndex.toString(), 'bankRecords', updatedRecords);
                  } else {
                    updateFormData(person, 'bankRecords', updatedRecords);
                  }
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Bank Account
            </Button>
            </div>
          </div>

          {(personData?.bankRecords || []).map((record: any, index: number) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Bank Account {index + 1}</h4>
                {(personData?.bankRecords || []).length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const bankRecords = personData?.bankRecords || [];
                      console.log(`Removing bank record ${index} for ${person}:`, {
                        currentBankRecords: bankRecords,
                        currentLength: bankRecords.length
                      });
                      const updated = bankRecords.filter((_: any, i: number) => i !== index);
                      console.log(`Updated bank records after removal for ${person}:`, {
                        updatedRecords: updated,
                        newLength: updated.length
                      });
                      if (person.startsWith('coApplicants_')) {
                        const coApplicantIndex = parseInt(person.replace('coApplicants_', ''), 10);
                        updateFormData('coApplicants', coApplicantIndex.toString(), 'bankRecords', updated);
                      } else if (person.startsWith('guarantors_')) {
                        const guarantorIndex = parseInt(person.replace('guarantors_', ''), 10);
                        updateFormData('guarantors', guarantorIndex.toString(), 'bankRecords', updated);
                      } else {
                        updateFormData(person, 'bankRecords', updated);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-field">
                  <Label>Bank Name</Label>
                  <Input
                    placeholder="Enter bank name"
                    className="input-field"
                    value={record.bankName || ''}
                    onChange={(e) => {
                      const bankRecords = [...(personData?.bankRecords || [])];
                      bankRecords[index] = { ...bankRecords[index], bankName: e.target.value };
                      console.log(`Updating bank name for ${person} record ${index}:`, {
                        newValue: e.target.value,
                        updatedRecord: bankRecords[index]
                      });
                      if (person.startsWith('coApplicants_')) {
                        const coApplicantIndex = parseInt(person.replace('coApplicants_', ''), 10);
                        updateFormData('coApplicants', coApplicantIndex.toString(), 'bankRecords', bankRecords);
                      } else if (person.startsWith('guarantors_')) {
                        const guarantorIndex = parseInt(person.replace('guarantors_', ''), 10);
                        updateFormData('guarantors', guarantorIndex.toString(), 'bankRecords', bankRecords);
                      } else {
                        updateFormData(person, 'bankRecords', bankRecords);
                      }
                    }}
                  />
                </div>
                <div className="form-field">
                  <Label>Account Type</Label>
                  <Select 
                    value={record.accountType || ''}
                    onValueChange={(value) => {
                      const bankRecords = [...(personData?.bankRecords || [])];
                      bankRecords[index] = { ...bankRecords[index], accountType: value };
                      console.log(`Updating account type for ${person} record ${index}:`, {
                        newValue: value,
                        updatedRecord: bankRecords[index]
                      });
                      if (person.startsWith('coApplicants_')) {
                        const coApplicantIndex = parseInt(person.replace('coApplicants_', ''), 10);
                        updateFormData('coApplicants', coApplicantIndex.toString(), 'bankRecords', bankRecords);
                      } else if (person.startsWith('guarantors_')) {
                        const guarantorIndex = parseInt(person.replace('guarantors_', ''), 10);
                        updateFormData('guarantors', guarantorIndex.toString(), 'bankRecords', bankRecords);
                      } else {
                        updateFormData(person, 'bankRecords', bankRecords);
                      }
                    }}
                  >
                    <SelectTrigger className="input-field">
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checking">Checking</SelectItem>
                      <SelectItem value="savings">Savings</SelectItem>
                      <SelectItem value="money-market">Money Market</SelectItem>
                      <SelectItem value="cd">Certificate of Deposit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
          
          {/* Show current bank records count for debugging */}
          <div className="text-sm text-gray-500">
            Current bank records for {person}: {personData?.bankRecords?.length || 0}
            {personData?.bankRecords && (
              <div className="mt-1">
                {personData.bankRecords.map((record: any, index: number) => (
                  <div key={index} className="text-xs">
                    Record {index + 1}: {record.bankName || 'No name'} - {record.accountType || 'No type'}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}