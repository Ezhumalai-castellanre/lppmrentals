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
      <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4 bg-black/20 backdrop-blur-sm rounded-xl p-6">
        <h1 className="font-serif text-5xl md:text-6xl font-bold mb-6 leading-tight">
          Liberty Place Property Management
        </h1>
        <p className="text-xl md:text-2xl mb-8 font-light">
          Discover beautiful properties in prime locations. Experience luxury living with our premium property
          management services.
        </p>

      
      </div>
    </section>
  )
}
