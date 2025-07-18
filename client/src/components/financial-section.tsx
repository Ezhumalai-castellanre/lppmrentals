import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { DatePicker } from "./ui/date-picker";
import { IncomeWithFrequencyInput } from "./ui/validated-input";
import { Plus, Trash2 } from "lucide-react";

interface FinancialSectionProps {
  title: string;
  person: "applicant" | "coApplicant" | "guarantor";
  formData: any;
  updateFormData: (person: string, field: string, value: any) => void;
}

export function FinancialSection({ title, person, formData, updateFormData }: FinancialSectionProps) {
  const personData = formData[person] || {};

  const handleChange = (field: string, value: string) => {
    updateFormData(person, field, value);
  };

  const handleDateChange = (field: string, date: Date | undefined) => {
    updateFormData(person, field, date?.toISOString());
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Employer Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-field">
            <Label htmlFor={`${person}-employer`}>Current Employer *</Label>
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
        </div>

        {/* Income Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {/* Other Income Source */}
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const bankRecords = formData[person]?.bankRecords || [];
                const newRecord = { bankName: '', accountType: '', accountNumber: '' };
                updateFormData(person, 'bankRecords', [...bankRecords, newRecord]);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Bank Account
            </Button>
          </div>

          {(formData[person]?.bankRecords || [{ bankName: '', accountType: '', accountNumber: '' }]).map((record: any, index: number) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Bank Account {index + 1}</h4>
                {index > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const bankRecords = formData[person]?.bankRecords || [];
                      const updated = bankRecords.filter((_: any, i: number) => i !== index);
                      updateFormData(person, 'bankRecords', updated);
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
                      const bankRecords = [...(formData[person]?.bankRecords || [])];
                      bankRecords[index] = { ...bankRecords[index], bankName: e.target.value };
                      updateFormData(person, 'bankRecords', bankRecords);
                    }}
                  />
                </div>
                <div className="form-field">
                  <Label>Account Type</Label>
                  <Select 
                    value={record.accountType || ''}
                    onValueChange={(value) => {
                      const bankRecords = [...(formData[person]?.bankRecords || [])];
                      bankRecords[index] = { ...bankRecords[index], accountType: value };
                      updateFormData(person, 'bankRecords', bankRecords);
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

              <div className="form-field">
                <Label>Account Number (Last 4 digits)</Label>
                <Input
                  placeholder="XXXX"
                  className="input-field"
                  maxLength={4}
                  value={record.accountNumber || ''}
                  onChange={(e) => {
                    const bankRecords = [...(formData[person]?.bankRecords || [])];
                    bankRecords[index] = { ...bankRecords[index], accountNumber: e.target.value };
                    updateFormData(person, 'bankRecords', bankRecords);
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}