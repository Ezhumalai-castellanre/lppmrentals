"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Heart, Star, Loader2 } from "lucide-react"
import { MondayApiService, RentalItem } from "@/lib/monday-api"

export function RentalListings() {
  const [rentals, setRentals] = useState<RentalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [displayedRentals, setDisplayedRentals] = useState<RentalItem[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  
  const ITEMS_PER_PAGE = 6
  const INITIAL_ITEMS = 9

  useEffect(() => {
    fetchRentals()
  }, [])

  const fetchRentals = async () => {
    try {
      setLoading(true)
      const rentalsData = await MondayApiService.fetchAvailableRentals()
      setRentals(rentalsData)
      
      // Set initial displayed rentals (first 9)
      const initialRentals = rentalsData.slice(0, INITIAL_ITEMS)
      setDisplayedRentals(initialRentals)
      
      // Check if there are more rentals to show
      setHasMore(rentalsData.length > INITIAL_ITEMS)
      setCurrentPage(1)
      
      console.log('Fetched rentals:', rentalsData)
      console.log('Initial displayed rentals:', initialRentals)
    } catch (error) {
      console.error('Error fetching rentals:', error)
      setError('Failed to load available rentals. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadMoreRentals = () => {
    const nextPage = currentPage + 1
    const startIndex = INITIAL_ITEMS + (nextPage - 2) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    
    const newRentals = rentals.slice(startIndex, endIndex)
    setDisplayedRentals(prev => [...prev, ...newRentals])
    setCurrentPage(nextPage)
    
    // Check if we've reached the end
    if (endIndex >= rentals.length) {
      setHasMore(false)
    }
    
    console.log(`Loaded more rentals: page ${nextPage}, showing ${displayedRentals.length + newRentals.length} of ${rentals.length}`)
  }

  const handleCardClick = (rentalId: string) => {
    window.location.href = `/property-details?id=${rentalId}`
  }

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-serif text-4xl font-bold text-gray-900 mb-4">Available Rentals</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover carefully curated properties that match your lifestyle and preferences
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 justify-center mb-12">
          <Button variant="outline" className="border-cyan-200 text-cyan-700 hover:bg-cyan-50 bg-transparent">
            All Properties
          </Button>
          <Button variant="outline">Apartments</Button>
          <Button variant="outline">Houses</Button>
          <Button variant="outline">Condos</Button>
          <Button variant="outline">Studios</Button>
        </div>

        {/* Rental Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-cyan-600" />
              <p className="text-gray-600">Loading available rentals...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchRentals} variant="outline">
              Try Again
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayedRentals.map((rental) => (
              <Card
                key={rental.id}
                className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer"
                onClick={() => handleCardClick(rental.id)}
              >
                <div className="relative">
                  <img
                    src={rental.mediaFiles?.[0]?.url || "/placeholder.svg"}
                    alt={rental.name}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-4 right-4 bg-white/80 hover:bg-white text-gray-600 hover:text-red-500"
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                  <div className="absolute bottom-4 left-4">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <div className="w-2 h-2 rounded-full mr-1 bg-green-500"></div>
                      Available Now
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-serif text-xl font-semibold text-gray-900 group-hover:text-cyan-600 transition-colors">
                      {rental.name}
                    </h3>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-cyan-600">
                        {rental.monthlyRent ? `$${rental.monthlyRent}` : 'Contact'}
                      </div>
                      <div className="text-sm text-gray-500">/month</div>
                    </div>
                  </div>

                  <div className="flex items-center text-gray-600 mb-3">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm">{rental.propertyName}</span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {rental.amenities ? 
                      rental.amenities.split('\n').slice(0, 2).join(' ') : 
                      'Beautiful property with modern amenities. Contact us for more details.'
                    }
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary" className="text-xs">
                      {rental.unitType || 'STD'}
                    </Badge>
                    {rental.mediaFiles && rental.mediaFiles.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {rental.mediaFiles.length} Photos
                      </Badge>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="p-6 pt-0 flex gap-3">
                  <Button className="flex-1 bg-cyan-600 hover:bg-cyan-700">Schedule Tour</Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-cyan-200 text-cyan-700 hover:bg-cyan-50 bg-transparent"
                  >
                    Inquire Now
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && (
          <div className="text-center mt-12">
            <Button 
              variant="outline" 
              size="lg" 
              className="px-8 bg-transparent hover:bg-cyan-50 hover:border-cyan-200"
              onClick={loadMoreRentals}
            >
              Load More Properties ({displayedRentals.length} of {rentals.length})
            </Button>
          </div>
        )}

        {/* Show All Loaded Message */}
        {!hasMore && rentals.length > 0 && (
          <div className="text-center mt-12">
            <p className="text-gray-600">All {rentals.length} properties have been loaded.</p>
          </div>
        )}

        {/* No Properties Found */}
        {!loading && !error && displayedRentals.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
            <p className="text-gray-600">Try adjusting your filters to see more results.</p>
          </div>
        )}
      </div>
    </section>
  )
}
