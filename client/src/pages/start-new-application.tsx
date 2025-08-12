import React from 'react';
import { StartNewApplicationSidebar } from '@/components/start-new-application-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function StartNewApplicationPage() {
  return (
    <SidebarProvider>
      <StartNewApplicationSidebar />
      <main className="flex-1">
        <div className="flex h-16 items-center gap-2 border-b bg-background px-4">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">Start New Application</h1>
          </div>
        </div>
        <div className="flex-1 p-4" style={{ backgroundColor: '#f2f8fe' }}>
          <div className="container mx-auto max-w-4xl">
            <div className="text-center py-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to Your Rental Application
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Use the sidebar to navigate through the application steps or start a fresh application.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                <div className="bg-white p-6 rounded-lg shadow-md border">
                  <div className="text-blue-600 text-4xl mb-4">📋</div>
                  <h3 className="text-xl font-semibold mb-2">Step-by-Step Process</h3>
                  <p className="text-gray-600">
                    Complete your application one section at a time with clear guidance.
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-md border">
                  <div className="text-green-600 text-4xl mb-4">💾</div>
                  <h3 className="text-xl font-semibold mb-2">Auto-Save Progress</h3>
                  <p className="text-gray-600">
                    Your progress is automatically saved, so you can continue anytime.
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-md border">
                  <div className="text-purple-600 text-4xl mb-4">🔒</div>
                  <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
                  <p className="text-gray-600">
                    All your information is encrypted and securely stored.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </SidebarProvider>
  );
}
