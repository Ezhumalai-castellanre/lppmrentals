import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

export function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <img
              src="https://supportingdocuments-storage-2025.s3.us-east-1.amazonaws.com/image+(1).png"
              alt="RentalHub Logo"
              className="h-10 w-auto"
            />
          </div>

          {/* Contact Info & CTA */}
          <div className="hidden lg:flex items-center space-x-4">
            <Button
              className="bg-cyan-600 hover:bg-cyan-700"
              onClick={() => window.open('https://forms.monday.com/forms/8c6c6cd6c030c82856c14ef4439c61df?r=use1&color_mktgkr4e=East+30th+Street&short_text800omovg=6B', '_blank')}
            >
              Apply Now
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button variant="ghost" size="sm" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
