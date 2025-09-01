import React from 'react'
import { InterestForm } from '../components/interest-form'

export default function InterestFormDemo() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              LPPM Interest Form
            </h1>
          </div>
          
          <InterestForm className="shadow-lg" />
        </div>
      </main>
    </div>
  )
}
