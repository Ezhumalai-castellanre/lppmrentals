"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, FileText, UserCircle2, CreditCard, Shield } from "lucide-react"
import { StatusBadge } from "./status-badge"

type Status = "verified" | "pending" | "failed" | "not_started"

export type VerificationCardProps = {
  role: "Applicant" | "Co-Applicant" | "Guarantor"
  personName?: string
  creditStatus: Status
  incomeStatus: Status
  creditScore?: number
  monthlyIncome?: number
  updatedAt?: string
  className?: string
}

export function VerificationCard({ 
  role, 
  personName, 
  creditStatus, 
  incomeStatus, 
  creditScore, 
  monthlyIncome, 
  updatedAt,
  className 
}: VerificationCardProps) {
  const titleId = `${role.toLowerCase().replace(/\s/g, "-")}-title`

  // Determine credit score quality
  const getCreditScoreQuality = (score: number) => {
    if (score >= 750) return "Excellent"
    if (score >= 700) return "Good"
    if (score >= 650) return "Fair"
    return "Poor"
  }

  const getCreditScoreColor = (score: number) => {
    if (score >= 750) return "text-green-600"
    if (score >= 700) return "text-blue-600"
    if (score >= 650) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <Card role="region" aria-labelledby={titleId} className={className}>
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-2 text-blue-600">
          {role === "Applicant" ? (
            <UserCircle2 className="size-5" aria-hidden="true" />
          ) : role === "Co-Applicant" ? (
            <UserCircle2 className="size-5" aria-hidden="true" />
          ) : (
            <Shield className="size-5" aria-hidden="true" />
          )}
          <span className="text-sm font-medium">{role}</span>
        </div>
        <CardTitle id={titleId} className="text-pretty text-lg">
          {personName || "Unassigned"}
        </CardTitle>
        {updatedAt ? <p className="text-xs text-gray-500">Updated {updatedAt}</p> : null}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Credit Verification Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="size-4 text-gray-500" aria-hidden="true" />
              <span className="text-sm font-medium text-gray-700">Credit Verification</span>
            </div>
            <StatusBadge status={creditStatus} />
          </div>
          
          {creditScore && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-center">
                <div className={`text-2xl font-bold ${getCreditScoreColor(creditScore)}`}>
                  {creditScore}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {getCreditScoreQuality(creditScore)}
                </div>
                <div className="text-xs text-gray-500 mt-1">Range: 300-850</div>
              </div>
            </div>
          )}
        </div>

        {/* Income Verification Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="size-4 text-gray-500" aria-hidden="true" />
              <span className="text-sm font-medium text-gray-700">Income Verification</span>
            </div>
            <StatusBadge status={incomeStatus} />
          </div>
          

        </div>
      </CardContent>
    </Card>
  )
}
