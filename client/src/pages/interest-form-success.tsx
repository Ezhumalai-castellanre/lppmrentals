import React, { useEffect } from 'react'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { CheckCircle, Home } from 'lucide-react'
import { useLocation } from 'wouter'

export default function InterestFormSuccess() {
  const [, setLocation] = useLocation()

  // Fire Meta Pixel conversion on thank-you page
  useEffect(() => {
    if (typeof window === 'undefined') return
    const win = window as any

    if (win.fbq && typeof win.fbq === 'function') {
      try { win.fbq('track', 'Lead') } catch {}
    } else {
      const bootstrap = document.createElement('script')
      bootstrap.type = 'text/javascript'
      bootstrap.async = true
      bootstrap.text = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?\n      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;\n      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;\n      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script',\n      'https://connect.facebook.net/en_US/fbevents.js');\n      fbq('init', '730476173284501');\n      fbq('track', 'PageView');\n      fbq('track', 'Lead');`
      document.head.appendChild(bootstrap)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto px-4">
        <Card className="shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Thank You!
                </h2>
                <p className="text-gray-600 mb-4">
                  Your interest form has been submitted successfully. We'll review your information and get back to you within 24-48 hours.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• We'll review your information</li>
                    <li>• Contact you to discuss availability</li>
                    <li>• Schedule a property viewing if interested</li>
                    <li>• Guide you through the application process</li>
                  </ul>
                </div>
              </div>
              <Button
                onClick={() => setLocation('/interest-form')}
                variant="outline"
                className="mt-4"
              >
                <Home className="w-4 h-4 mr-2" />
                Submit Another Interest Form
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
