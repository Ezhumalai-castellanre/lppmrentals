import React from "react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, UserCheck, Shield } from "lucide-react";

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

interface Guarantor {
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

export function MultiApplicantForm() {
  const [hasCoApplicant, setHasCoApplicant] = useState(false);
  const [hasGuarantor, setHasGuarantor] = useState(false);
  const [coApplicantCount, setCoApplicantCount] = useState(1);
  const [guarantorCount, setGuarantorCount] = useState(1);
  
  const [coApplicants, setCoApplicants] = useState<CoApplicant[]>([
    {
      name: '',
      relationship: '',
      dob: '',
      ssn: '',
      phone: '',
      email: '',
      license: '',
      licenseState: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      lengthAtAddressYears: 0,
      lengthAtAddressMonths: 0,
      landlordName: '',
      landlordAddressLine1: '',
      landlordAddressLine2: '',
      landlordCity: '',
      landlordState: '',
      landlordZipCode: '',
      landlordPhone: '',
      landlordEmail: '',
      currentRent: 0,
      reasonForMoving: '',
      employmentType: '',
      employer: '',
      position: '',
      employmentStart: '',
      income: '',
      incomeFrequency: 'yearly',
      businessName: '',
      businessType: '',
      yearsInBusiness: '',
      otherIncome: '',
      otherIncomeFrequency: 'monthly',
      otherIncomeSource: '',
      bankRecords: []
    }
  ]);

  const [guarantors, setGuarantors] = useState<Guarantor[]>([
    {
      name: '',
      relationship: '',
      dob: '',
      ssn: '',
      phone: '',
      email: '',
      license: '',
      licenseState: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      lengthAtAddressYears: 0,
      lengthAtAddressMonths: 0,
      landlordName: '',
      landlordAddressLine1: '',
      landlordAddressLine2: '',
      landlordCity: '',
      landlordState: '',
      landlordZipCode: '',
      landlordPhone: '',
      landlordEmail: '',
      currentRent: 0,
      reasonForMoving: '',
      employmentType: '',
      employer: '',
      position: '',
      employmentStart: '',
      income: '',
      incomeFrequency: 'yearly',
      businessName: '',
      businessType: '',
      yearsInBusiness: '',
      otherIncome: '',
      otherIncomeFrequency: 'monthly',
      otherIncomeSource: '',
      bankRecords: []
    }
  ]);

  const updateCoApplicant = (index: number, field: keyof CoApplicant, value: any) => {
    const updated = [...coApplicants];
    updated[index] = { ...updated[index], [field]: value };
    setCoApplicants(updated);
  };

  const updateGuarantor = (index: number, field: keyof Guarantor, value: any) => {
    const updated = [...guarantors];
    updated[index] = { ...updated[index], [field]: value };
    setGuarantors(updated);
  };

  const handleCoApplicantCountChange = (count: number) => {
    setCoApplicantCount(count);
    
    if (count > coApplicants.length) {
      // Add new co-applicants
      const newCoApplicants = [...coApplicants];
      for (let i = coApplicants.length; i < count; i++) {
        newCoApplicants.push({
          name: '',
          relationship: '',
          dob: '',
          ssn: '',
          phone: '',
          email: '',
          license: '',
          licenseState: '',
          address: '',
          city: '',
          state: '',
          zip: '',
          lengthAtAddressYears: 0,
          lengthAtAddressMonths: 0,
          landlordName: '',
          landlordAddressLine1: '',
          landlordAddressLine2: '',
          landlordCity: '',
          landlordState: '',
          landlordZipCode: '',
          landlordPhone: '',
          landlordEmail: '',
          currentRent: 0,
          reasonForMoving: '',
          employmentType: '',
          employer: '',
          position: '',
          employmentStart: '',
          income: '',
          incomeFrequency: 'yearly',
          businessName: '',
          businessType: '',
          yearsInBusiness: '',
          otherIncome: '',
          otherIncomeFrequency: 'monthly',
          otherIncomeSource: '',
          bankRecords: []
        });
      }
      setCoApplicants(newCoApplicants);
    } else if (count < coApplicants.length) {
      // Remove excess co-applicants
      setCoApplicants(coApplicants.slice(0, count));
    }
  };

  const handleGuarantorCountChange = (count: number) => {
    setGuarantorCount(count);
    
    if (count > guarantors.length) {
      // Add new guarantors
      const newGuarantors = [...guarantors];
      for (let i = guarantors.length; i < count; i++) {
        newGuarantors.push({
          name: '',
          relationship: '',
          dob: '',
          ssn: '',
          phone: '',
          email: '',
          license: '',
          licenseState: '',
          address: '',
          city: '',
          state: '',
          zip: '',
          lengthAtAddressYears: 0,
          lengthAtAddressMonths: 0,
          landlordName: '',
          landlordAddressLine1: '',
          landlordAddressLine2: '',
          landlordCity: '',
          landlordState: '',
          landlordZipCode: '',
          landlordPhone: '',
          landlordEmail: '',
          currentRent: 0,
          reasonForMoving: '',
          employmentType: '',
          employer: '',
          position: '',
          employmentStart: '',
          income: '',
          incomeFrequency: 'yearly',
          businessName: '',
          businessType: '',
          yearsInBusiness: '',
          otherIncome: '',
          otherIncomeFrequency: 'monthly',
          otherIncomeSource: '',
          bankRecords: []
        });
      }
      setGuarantors(newGuarantors);
    } else if (count < guarantors.length) {
      // Remove excess guarantors
      setGuarantors(guarantors.slice(0, count));
    }
  };

  return (
    <div className="space-y-8 p-6">
      {/* Co-Applicant Section */}
      <Card className="form-section border-l-4 border-l-green-500">
        <CardHeader>
          <CardTitle className="flex items-center text-green-700 dark:text-green-400">
            <Users className="w-5 h-5 mr-2" />
            Co-Applicant Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-3">
            <Checkbox 
              id="hasCoApplicant"
              checked={hasCoApplicant}
              onCheckedChange={(checked) => {
                setHasCoApplicant(checked as boolean);
              }}
            />
            <Label htmlFor="hasCoApplicant" className="text-base font-medium">
              Add Co-Applicant
            </Label>
          </div>

          {hasCoApplicant && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Label className="text-sm font-medium">How many Co-Applicants?</Label>
                <Select
                  value={coApplicantCount.toString()}
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

              {/* Render co-applicant forms based on count */}
              {Array.from({ length: coApplicantCount }, (_, index) => (
                <Card key={index} className="form-section border-l-4 border-l-blue-500">
                  <CardHeader>
                    <CardTitle className="flex items-center text-blue-700 dark:text-blue-400">
                      <UserCheck className="w-5 h-5 mr-2" />
                      Co-Applicant {index + 1}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      <div className="col-span-1 md:col-span-2">
                        <Label className="mb-0.5">Full Name *</Label>
                        <Input 
                          placeholder="Enter full name" 
                          value={coApplicants[index]?.name || ''}
                          className="w-full mt-1"
                          onChange={(e) => updateCoApplicant(index, 'name', e.target.value)}
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <Label className="mb-0.5">Relationship</Label>
                        <Select
                          value={coApplicants[index]?.relationship || ''}
                          onValueChange={(value) => updateCoApplicant(index, 'relationship', value)}
                        >
                          <SelectTrigger className="w-full mt-1">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="spouse">Spouse</SelectItem>
                            <SelectItem value="partner">Partner</SelectItem>
                            <SelectItem value="parent">Parent</SelectItem>
                            <SelectItem value="child">Child</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="mb-0.5">Date of Birth *</Label>
                        <Input 
                          type="date"
                          value={coApplicants[index]?.dob || ''}
                          className="w-full mt-1"
                          onChange={(e) => updateCoApplicant(index, 'dob', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="mb-0.5">Social Security Number</Label>
                        <Input 
                          placeholder="XXX-XX-XXXX"
                          value={coApplicants[index]?.ssn || ''}
                          className="w-full mt-1"
                          onChange={(e) => updateCoApplicant(index, 'ssn', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="mb-0.5">Phone Number</Label>
                        <Input 
                          placeholder="(555) 555-5555"
                          value={coApplicants[index]?.phone || ''}
                          className="w-full mt-1"
                          onChange={(e) => updateCoApplicant(index, 'phone', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="mb-0.5">Email Address</Label>
                        <Input 
                          type="email"
                          placeholder="you@email.com"
                          value={coApplicants[index]?.email || ''}
                          className="w-full mt-1"
                          onChange={(e) => updateCoApplicant(index, 'email', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="mb-0.5">Driver's License</Label>
                        <Input 
                          placeholder="Enter license number"
                          value={coApplicants[index]?.license || ''}
                          className="w-full mt-1"
                          onChange={(e) => updateCoApplicant(index, 'license', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="mb-0.5">License State</Label>
                        <Input 
                          placeholder="State"
                          value={coApplicants[index]?.licenseState || ''}
                          className="w-full mt-1"
                          onChange={(e) => updateCoApplicant(index, 'licenseState', e.target.value)}
                        />
                      </div>
                      
                      <h5 className="col-span-2">Current Address</h5>
                      <div className="col-span-2">
                        <Label className="mb-0.5">Street Address</Label>
                        <Input 
                          placeholder="Enter street address" 
                          value={coApplicants[index]?.address || ''}
                          className="w-full mt-1"
                          onChange={(e) => updateCoApplicant(index, 'address', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="mb-0.5">ZIP Code *</Label>
                        <Input 
                          placeholder="ZIP code"
                          value={coApplicants[index]?.zip || ''}
                          className="w-full mt-1"
                          onChange={(e) => updateCoApplicant(index, 'zip', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="mb-0.5">State</Label>
                        <Input 
                          placeholder="State"
                          value={coApplicants[index]?.state || ''}
                          className="w-full mt-1"
                          onChange={(e) => updateCoApplicant(index, 'state', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="mb-0.5">City</Label>
                        <Input 
                          placeholder="City"
                          value={coApplicants[index]?.city || ''}
                          className="w-full mt-1"
                          onChange={(e) => updateCoApplicant(index, 'city', e.target.value)}
                        />
                      </div>
                      
                      <div className="col-span-2 grid grid-cols-2 gap-x-6 gap-y-4">
                        <Label className="mb-0.5 col-span-2">Length of Stay at Current Address</Label>
                        <Input
                          type="number"
                          min={0}
                          placeholder="Years"
                          value={coApplicants[index]?.lengthAtAddressYears || ''}
                          onChange={e => updateCoApplicant(index, 'lengthAtAddressYears', parseInt(e.target.value) || 0)}
                          className="w-full mt-1"
                        />
                        <Input
                          type="number"
                          min={0}
                          max={11}
                          placeholder="Months"
                          value={coApplicants[index]?.lengthAtAddressMonths || ''}
                          onChange={e => updateCoApplicant(index, 'lengthAtAddressMonths', parseInt(e.target.value) || 0)}
                          className="w-full mt-1"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Guarantor Section */}
      <Card className="form-section border-l-4 border-l-orange-500">
        <CardHeader>
          <CardTitle className="flex items-center text-orange-700 dark:text-orange-400">
            <Shield className="w-5 h-5 mr-2" />
            Guarantor Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-3">
            <Checkbox 
              id="hasGuarantor"
              checked={hasGuarantor}
              onCheckedChange={(checked) => {
                setHasGuarantor(checked as boolean);
              }}
            />
            <Label htmlFor="hasGuarantor" className="text-base font-medium">
              Add Guarantor
            </Label>
          </div>

          {hasGuarantor && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Label className="text-sm font-medium">How many Guarantors?</Label>
                <Select
                  value={guarantorCount.toString()}
                  onValueChange={(value) => handleGuarantorCountChange(parseInt(value))}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select number" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Guarantor</SelectItem>
                    <SelectItem value="2">2 Guarantors</SelectItem>
                    <SelectItem value="3">3 Guarantors</SelectItem>
                    <SelectItem value="4">4 Guarantors</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Render guarantor forms based on count */}
              {Array.from({ length: guarantorCount }, (_, index) => (
                <Card key={index} className="form-section border-l-4 border-l-orange-500">
                  <CardHeader>
                    <CardTitle className="flex items-center text-orange-700 dark:text-orange-400">
                      <Shield className="w-5 h-5 mr-2" />
                      Guarantor {index + 1}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      <div className="col-span-1 md:col-span-2">
                        <Label className="mb-0.5">Full Name *</Label>
                        <Input 
                          placeholder="Enter full name" 
                          value={guarantors[index]?.name || ''}
                          className="w-full mt-1"
                          onChange={(e) => updateGuarantor(index, 'name', e.target.value)}
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <Label className="mb-0.5">Relationship</Label>
                        <Select
                          value={guarantors[index]?.relationship || ''}
                          onValueChange={(value) => updateGuarantor(index, 'relationship', value)}
                        >
                          <SelectTrigger className="w-full mt-1">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="spouse">Spouse</SelectItem>
                            <SelectItem value="partner">Partner</SelectItem>
                            <SelectItem value="parent">Parent</SelectItem>
                            <SelectItem value="child">Child</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="mb-0.5">Date of Birth *</Label>
                        <Input 
                          type="date"
                          value={guarantors[index]?.dob || ''}
                          className="w-full mt-1"
                          onChange={(e) => updateGuarantor(index, 'dob', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="mb-0.5">Social Security Number</Label>
                        <Input 
                          placeholder="XXX-XX-XXXX"
                          value={guarantors[index]?.ssn || ''}
                          className="w-full mt-1"
                          onChange={(e) => updateGuarantor(index, 'ssn', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="mb-0.5">Phone Number</Label>
                        <Input 
                          placeholder="(555) 555-5555"
                          value={guarantors[index]?.phone || ''}
                          className="w-full mt-1"
                          onChange={(e) => updateGuarantor(index, 'phone', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="mb-0.5">Email Address</Label>
                        <Input 
                          type="email"
                          placeholder="you@email.com"
                          value={guarantors[index]?.email || ''}
                          className="w-full mt-1"
                          onChange={(e) => updateGuarantor(index, 'email', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="mb-0.5">Driver's License</Label>
                        <Input 
                          placeholder="Enter license number"
                          value={guarantors[index]?.license || ''}
                          className="w-full mt-1"
                          onChange={(e) => updateGuarantor(index, 'license', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="mb-0.5">License State</Label>
                        <Input 
                          placeholder="State"
                          value={guarantors[index]?.licenseState || ''}
                          className="w-full mt-1"
                          onChange={(e) => updateGuarantor(index, 'licenseState', e.target.value)}
                        />
                      </div>
                      
                      <h5 className="col-span-2">Current Address</h5>
                      <div className="col-span-2">
                        <Label className="mb-0.5">Street Address</Label>
                        <Input 
                          placeholder="Enter street address" 
                          value={guarantors[index]?.address || ''}
                          className="w-full mt-1"
                          onChange={(e) => updateGuarantor(index, 'address', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="mb-0.5">ZIP Code *</Label>
                        <Input 
                          placeholder="ZIP code"
                          value={guarantors[index]?.zip || ''}
                          className="w-full mt-1"
                          onChange={(e) => updateGuarantor(index, 'zip', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="mb-0.5">State</Label>
                        <Input 
                          placeholder="State"
                          value={guarantors[index]?.state || ''}
                          className="w-full mt-1"
                          onChange={(e) => updateGuarantor(index, 'state', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="mb-0.5">City</Label>
                        <Input 
                          placeholder="City"
                          value={guarantors[index]?.city || ''}
                          className="w-full mt-1"
                          onChange={(e) => updateGuarantor(index, 'city', e.target.value)}
                        />
                      </div>
                      
                      <div className="col-span-2 grid grid-cols-2 gap-x-6 gap-y-4">
                        <Label className="mb-0.5 col-span-2">Length of Stay at Current Address</Label>
                        <Input
                          type="number"
                          min={0}
                          placeholder="Years"
                          value={guarantors[index]?.lengthAtAddressYears || ''}
                          onChange={e => updateGuarantor(index, 'lengthAtAddressYears', parseInt(e.target.value) || 0)}
                          className="w-full mt-1"
                        />
                        <Input
                          type="number"
                          min={0}
                          max={11}
                          placeholder="Months"
                          value={guarantors[index]?.lengthAtAddressMonths || ''}
                          onChange={e => updateGuarantor(index, 'lengthAtAddressMonths', parseInt(e.target.value) || 0)}
                          className="w-full mt-1"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="form-section border-l-4 border-l-purple-500">
        <CardHeader>
          <CardTitle className="flex items-center text-purple-700 dark:text-purple-400">
            <Users className="w-5 h-5 mr-2" />
            Application Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Primary Applicant:</strong> 1</p>
            <p><strong>Co-Applicants:</strong> {hasCoApplicant ? coApplicantCount : 0}</p>
            <p><strong>Guarantors:</strong> {hasGuarantor ? guarantorCount : 0}</p>
            <p><strong>Total People:</strong> 1 + {hasCoApplicant ? coApplicantCount : 0} + {hasGuarantor ? guarantorCount : 0} = {1 + (hasCoApplicant ? coApplicantCount : 0) + (hasGuarantor ? guarantorCount : 0)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
