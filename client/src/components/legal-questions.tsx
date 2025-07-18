import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";

interface LegalQuestionsProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
}

export function LegalQuestions({ formData, updateFormData }: LegalQuestionsProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Legal Questions</CardTitle>
        <p className="text-sm text-gray-600">
          Please answer all questions truthfully. False information may result in denial of application.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Landlord/Tenant Legal Action */}
        <div className="space-y-3">
          <Label htmlFor="landlordTenantLegalAction" className="text-sm font-medium">
             HAVE YOU EVER BEEN IN LANDLORD/TENANT LEGAL ACTION?
          </Label>
          <Select
            value={formData.landlordTenantLegalAction || ''}
            onValueChange={(value) => updateFormData('landlordTenantLegalAction', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Yes or No" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
          
          {formData.landlordTenantLegalAction === 'yes' && (
            <div className="mt-3">
              <Label htmlFor="landlordTenantLegalActionExplanation" className="text-sm font-medium">
                Please provide details:
              </Label>
              <Textarea
                value={formData.landlordTenantLegalActionExplanation || ''}
                onChange={(e) => updateFormData('landlordTenantLegalActionExplanation', e.target.value)}
                placeholder="Please explain the circumstances..."
                className="mt-1"
                rows={3}
              />
            </div>
          )}
        </div>

        {/* Broken Lease */}
        <div className="space-y-3">
          <Label htmlFor="brokenLease" className="text-sm font-medium">
            HAVE YOU EVER BROKEN A LEASE?
          </Label>
          <Select
            value={formData.brokenLease || ''}
            onValueChange={(value) => updateFormData('brokenLease', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Yes or No" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
          
          {formData.brokenLease === 'yes' && (
            <div className="mt-3">
              <Label htmlFor="brokenLeaseExplanation" className="text-sm font-medium">
                Please provide details:
              </Label>
              <Textarea
                value={formData.brokenLeaseExplanation || ''}
                onChange={(e) => updateFormData('brokenLeaseExplanation', e.target.value)}
                placeholder="Please explain the circumstances..."
                className="mt-1"
                rows={3}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}