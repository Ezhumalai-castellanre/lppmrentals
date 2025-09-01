"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CheckCircle2, Clock, AlertCircle } from "lucide-react"

type Status = "verified" | "pending" | "failed" | "not_started"

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: Status
  label?: string
  className?: string
}) {
  const isVerified = status === "verified"
  const isFailed = status === "failed"
  const isPending = status === "pending"
  
  return (
    <Badge
      variant="outline"
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 text-xs",
        isVerified ? "text-green-600 border-green-600" : 
        isFailed ? "text-red-600 border-red-600" :
        isPending ? "text-yellow-600 border-yellow-600" :
        "text-gray-600 border-gray-400",
        className,
      )}
      aria-label={label || (isVerified ? "Verified" : isFailed ? "Failed" : isPending ? "Pending" : "Not Started")}
    >
      {isVerified ? (
        <CheckCircle2 className="size-3.5" aria-hidden="true" />
      ) : isFailed ? (
        <AlertCircle className="size-3.5" aria-hidden="true" />
      ) : (
        <Clock className="size-3.5" aria-hidden="true" />
      )}
      <span className="leading-none">{label || (isVerified ? "Verified" : isFailed ? "Failed" : isPending ? "Pending" : "Not Started")}</span>
    </Badge>
  )
}
