import React from "react";
import { Button } from "../components/ui/button";

interface ApplicationInstructionsProps {
  onNext: () => void;
}

export const ApplicationInstructions: React.FC<ApplicationInstructionsProps> = ({
  onNext,
}) => (
  <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-8 mt-8">
    {/* Header with Logo and Contact Information */}
    <div className="flex flex-col items-center mb-8">
      <div className="header-logo mb-4">
        <img
          src="https://www.jotform.com/uploads/CRP_Affordable/form_files/image_686d7ef15b36a.png?nc=1"
          alt="122 East 42nd Street, Suite 1903 New York, NY 10168 Tel: (646) 545-6700 Fax: (646) 304-2255 Leasing Direct Line: (646)545-6700"
          width="200.04"
          className="header-logo-top"
          style={{ objectFit: "contain" }}
        />
      </div>
      <div className="header-text text-center">
        <h3 className="text-lg font-medium text-gray-900">
          122 East 42nd Street, Suite 1903 New York, NY 10168
          <br />
          Tel: (646) 545-6700 <br/>Fax: (646) 304-2255
          <br />
          Leasing Direct Line: (646)545-6700
        </h3>
      </div>
    </div>

    {/* Main Content */}
    <div className="text-gray-900 space-y-4">
      <p>Thank you for choosing a Liberty Place Property Management apartment.</p>
      
      <ol className="list-decimal pl-5 space-y-2">
        <li>Applicants must show income of <span style={{ fontSize: '18px', fontWeight: 500 }}>40 TIMES THE MONTHLY RENT.</span> (may be combined among applicants)</li>
        <li>Guarantors must show income of <span style={{ fontSize: '18px', fontWeight: 500 }}>80 TIMES THE MONTHLY RENT.</span> (may NOT be combined with applicants)</li>
        <li>Application packages must be submitted in full as detailed below. Only complete applications will be reviewed and considered for tenancy.</li>
        <li>Applications will not remove apartments from the market.</li>
        <li>Lease signings must be scheduled within three (3) days of approval or the backup applicant will be considered.</li>
      </ol>
      
      <p>We look forward to servicing your residential needs.</p>
      
      <div className="font-bold">
        YOUR APPLICATION PACKAGE MUST INCLUDE:
      </div>
      
      <ul className="list-disc pl-5 space-y-1">
        <li>Completed and Signed application by applicants and guarantors.</li>
        <li>Driver's License or Photo ID (18 & over)</li>
        <li>Social Security Card </li>
        
        <li>Financial Statement First Page (Checking, Savings and/or other assets)</li>
        <li>Previous year tax returns First Page</li>
      </ul>
      
      <div className="font-bold">
        Proof of Employment if you work for a company:
      </div>
      <ol className="list-decimal pl-5 space-y-1">
        <li>Letter on company letterhead From current employerincluding length of employment, salary & position</li>
        <li>Last 4 paystubs (If paid weekly) - or - Last 2 paystubs (if paid every weeks or semi-monthly)</li>
      </ol>
      
      <div className="font-bold">
        Proof of Employment if you are self-employed:
      </div>
      <ol className="list-decimal pl-5 space-y-1">
        <li>Previous year 1099</li>
        <li>Notarized Letter from your accountant on his/her company letterhead verifying:</li>
      </ol>
      <ul className="list-disc pl-8 space-y-1">
        <li>A. Nature of the business</li>
        <li>B. Length of employment</li>
        <li>C. Income holdings</li>
        <li>D. Projected annual income expected for the current year and upcoming year.</li>
      </ul>
      
      <div className="font-bold">
        CORPORATE APPLICANTS MUST SUBMIT A SEPARATE APPLICATION ALONG WITH:
      </div>
      <ul className="list-disc pl-5 space-y-1">
        <li>$150.00 Non-refundable application fee</li>
        <li>Corporate officer as a guarantor</li>
        <li>Information of the company employee that will occupy the apartment</li>
        <li>Certified Financial Statements</li>
        <li>Corporate Tax Returns (two (2) most recent consecutive returns)</li>
      </ul>
    </div>

  
  </div>
);

export default ApplicationInstructions; 