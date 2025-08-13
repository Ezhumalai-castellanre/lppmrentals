import { Button } from "@/components/ui/button"
import { Search, MapPin } from "lucide-react"

export function HeroBanner() {
  return (
    <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://blog.mipimworld.com/wp-content/uploads/2017/07/10_Hottest_Startups_Cropped.jpg')`,
        }}
      ></div>

      {/* Content */}
      <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
        <h1 className="font-serif text-5xl md:text-6xl font-bold mb-6 leading-tight">
          Liberty Place Property Management
        </h1>
        <p className="text-xl md:text-2xl mb-8 font-light">
          Discover beautiful properties in prime locations. Experience luxury living with our premium property
          management services.
        </p>

        {/* Search Bar */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 max-w-2xl mx-auto shadow-2xl">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Enter location or property type"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-900"
              />
            </div>
            <Button className="bg-cyan-600 hover:bg-cyan-700 px-8 py-3 text-white font-medium">
              <Search className="h-5 w-5 mr-2" />
              Search Rentals
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
