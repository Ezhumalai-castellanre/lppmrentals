import React, { useEffect } from 'react'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { CheckCircle, Home } from 'lucide-react'
import { useLocation } from 'wouter'

export default function InterestFormSuccess() {
  const [, setLocation] = useLocation()

  // Fire TikTok Pixel conversion on thank-you page
  useEffect(() => {
    if (typeof window === 'undefined') return
    const win = window as any

    if (win.ttq && typeof win.ttq.track === 'function') {
      try { win.ttq.track('SubmitForm') } catch {}
      return
    }

    const bootstrap = document.createElement('script')
    bootstrap.type = 'text/javascript'
    bootstrap.async = true
    bootstrap.text = `!function (w, d, t) {\n  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(\nvar e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")\n;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};\n\n\n  ttq.load('D2R9TUBC77UCDUAMLM7G');\n  ttq.page();\n  ttq.track('SubmitForm');\n}(window, document, 'ttq');`
    document.head.appendChild(bootstrap)
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
