import React from "react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-cyan-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <img
              src="https://supportingdocuments-storage-2025.s3.us-east-1.amazonaws.com/image+(1).png"
              alt="Company Logo"
              className="h-12 w-auto"
            />
            <p className="text-gray-300 leading-relaxed">
              Your trusted partner in finding the perfect rental home. We curate exceptional properties and provide
              personalized service to make your rental journey seamless.
            </p>
            <div className="flex space-x-4">
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-gray-400 hover:text-cyan-400 p-2"
                onClick={() => window.open('https://www.instagram.com/p/DM-yYtzohdJ/?utm_source=ig_web_copy_link', '_blank')}
              >
                <Instagram className="h-5 w-5" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-gray-400 hover:text-cyan-400 p-2"
                onClick={() => window.open('https://www.tiktok.com/@libertyplacepm?is_from_webapp=1&sender_device=pc', '_blank')}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-.88-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </Button>
            </div>
          </div>

          {/* Contact & Newsletter */}
          <div className="space-y-4">
            <h4 className="font-serif text-lg font-semibold text-cyan-400">Stay Connected</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-gray-300">
                <Phone className="h-4 w-4 text-cyan-400" />
                <span>(646) 545-673</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <Mail className="h-4 w-4 text-cyan-400" />
                <span>leasing@libertyplacepm.com</span>
              </div>
              <div className="flex items-start space-x-3 text-gray-300">
                <MapPin className="h-4 w-4 text-cyan-400 mt-1" />
                <span>
                  122 East 42nd Street
                  <br />
                  Suite 1903
                  <br />
                  New York, NY, 10168
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-cyan-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">© 2024 LPPM. All rights reserved.</p>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">
                Accessibility
              </a>
              <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">
                Sitemap
              </a>
              <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">
                Careers
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
