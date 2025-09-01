import React from 'react'
import { InterestForm } from '../components/interest-form'

export default function InterestFormDemo() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <img 
              src="https://d33zzd4k5u0xj2.cloudfront.net/us-east-1/workforms-form-logos/55e47d03-6d95-446b-8112-19472c3b90e2_31dd51" 
              alt="LPPM Logo" 
              className="mx-auto mb-4 h-16 w-auto"
            />
          </div>
          
          <InterestForm className="shadow-lg" />
        </div>
      </main>
    </div>
  )
}
