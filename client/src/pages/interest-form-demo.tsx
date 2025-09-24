import React, { useEffect } from 'react'
import { InterestForm } from '../components/interest-form'

export default function InterestFormDemo() {
  // Initialize Meta Pixel and fire PageView on Interest page
  useEffect(() => {
    if (typeof window === 'undefined') return
    const win = window as any

    if (win.fbq && typeof win.fbq === 'function') {
      try { win.fbq('track', 'PageView') } catch {}
    } else {
      const bootstrap = document.createElement('script')
      bootstrap.type = 'text/javascript'
      bootstrap.async = true
      bootstrap.text = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '730476173284501');
      fbq('track', 'PageView');`
      document.head.appendChild(bootstrap)
    }
  }, [])

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
