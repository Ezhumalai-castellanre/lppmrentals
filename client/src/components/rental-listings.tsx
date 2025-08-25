"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { MapPin, Heart, Star, Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { MondayApiService, RentalItem } from "../lib/monday-api"
import { useLocation } from "wouter"

export function RentalListings() {
  const [rentals, setRentals] = useState<RentalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [displayedRentals, setDisplayedRentals] = useState<RentalItem[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [imageIndices, setImageIndices] = useState<{ [key: string]: number }>({})
  
  const ITEMS_PER_PAGE = 6
  const INITIAL_ITEMS = 9

  const [, setLocation] = useLocation()

  useEffect(() => {
    fetchRentals()
  }, [])

  const fetchRentals = async () => {
    try {
      setLoading(true)
      const rentalsData = await MondayApiService.fetchAvailableRentals()
      setRentals(rentalsData)
      
      // Apply filter and set initial displayed rentals
      applyFilterAndSetInitial(rentalsData, selectedFilter, searchQuery)
      
      console.log('Fetched rentals:', rentalsData)
    } catch (error) {
      console.error('Error fetching rentals:', error)
      setError('Failed to load available rentals. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const applyFilterAndSetInitial = (rentalsData: RentalItem[], filter: string, search: string = '') => {
    let filteredRentals = rentalsData
    
    // Apply search filter first
    if (search.trim()) {
      const searchLower = search.toLowerCase().trim()
      filteredRentals = filteredRentals.filter(rental => {
        const propertyName = rental.propertyName?.toLowerCase() || ''
        const unitName = rental.name?.toLowerCase() || ''
        const amenities = rental.amenities?.toLowerCase() || ''
        
        return propertyName.includes(searchLower) || 
               unitName.includes(searchLower) || 
               amenities.includes(searchLower)
      })
    }
    
    // Then apply bedroom filter
    if (filter !== 'all') {
      filteredRentals = filteredRentals.filter(rental => {
        const unitType = rental.unitType?.toLowerCase() || ''
        if (filter === 'studio') return unitType.includes('studio') || unitType.includes('0')
        if (filter === '1br') return unitType.includes('1') && !unitType.includes('10') && !unitType.includes('11')
        if (filter === '2br') return unitType.includes('2') && !unitType.includes('12')
        if (filter === '3br') return unitType.includes('3') && !unitType.includes('13')
        if (filter === '4br') return unitType.includes('4') && !unitType.includes('14')
        return false
      })
    }
    
    // Set initial displayed rentals (first 9)
    const initialRentals = filteredRentals.slice(0, INITIAL_ITEMS)
    setDisplayedRentals(initialRentals)
    
    // Check if there are more rentals to show
    setHasMore(filteredRentals.length > INITIAL_ITEMS)
    setCurrentPage(1)
    
    console.log(`Filtered rentals for ${filter} with search "${search}":`, filteredRentals)
    console.log('Initial displayed rentals:', initialRentals)
  }

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter)
    applyFilterAndSetInitial(rentals, filter, searchQuery)
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Apply search filter locally without changing URL
      applyFilterAndSetInitial(rentals, selectedFilter, searchQuery.trim())
    }
  }

  // Add real-time filtering as user types
  useEffect(() => {
    if (searchQuery.trim()) {
      applyFilterAndSetInitial(rentals, selectedFilter, searchQuery.trim())
    } else {
      // If search is empty, show all rentals for current filter
      applyFilterAndSetInitial(rentals, selectedFilter, '')
    }
  }, [searchQuery, selectedFilter, rentals])

  const loadMoreRentals = () => {
    const nextPage = currentPage + 1
    const startIndex = INITIAL_ITEMS + (nextPage - 2) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    
    // Get filtered rentals based on current search and filter
    let filteredRentals = rentals
    
    // Apply search filter
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase().trim()
      filteredRentals = filteredRentals.filter(rental => {
        const propertyName = rental.propertyName?.toLowerCase() || ''
        const unitName = rental.name?.toLowerCase() || ''
        const amenities = rental.amenities?.toLowerCase() || ''
        
        return propertyName.includes(searchLower) || 
               unitName.includes(searchLower) || 
               amenities.includes(searchLower)
      })
    }
    
    // Apply bedroom filter
    if (selectedFilter !== 'all') {
      filteredRentals = filteredRentals.filter(rental => {
        const unitType = rental.unitType?.toLowerCase() || ''
        if (selectedFilter === 'studio') return unitType.includes('studio') || unitType.includes('0')
        if (selectedFilter === '1br') return unitType.includes('1') && !unitType.includes('10') && !unitType.includes('11')
        if (selectedFilter === '2br') return unitType.includes('2') && !unitType.includes('12')
        if (selectedFilter === '3br') return unitType.includes('3') && !unitType.includes('13')
        if (selectedFilter === '4br') return unitType.includes('4') && !unitType.includes('14')
        return false
      })
    }
    
    const newRentals = filteredRentals.slice(startIndex, endIndex)
    setDisplayedRentals(prev => [...prev, ...newRentals])
    setCurrentPage(nextPage)
    
    // Check if we've reached the end
    if (endIndex >= filteredRentals.length) {
      setHasMore(false)
    }
    
    console.log(`Loaded more rentals: page ${nextPage}, showing ${displayedRentals.length + newRentals.length} of ${filteredRentals.length}`)
  }

  const handleCardClick = (rentalId: string) => {
    window.location.href = `/property-details?id=${rentalId}`
  }

  const nextImage = (rentalId: string, totalImages: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setImageIndices(prev => ({
      ...prev,
      [rentalId]: ((prev[rentalId] || 0) + 1) % totalImages
    }))
  }

  const prevImage = (rentalId: string, totalImages: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setImageIndices(prev => ({
      ...prev,
      [rentalId]: prev[rentalId] === 0 ? totalImages - 1 : (prev[rentalId] || 0) - 1
    }))
  }

  const goToImage = (rentalId: string, index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setImageIndices(prev => ({
      ...prev,
      [rentalId]: index
    }))
  }

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-serif text-4xl font-bold text-gray-900 mb-4">Available Units</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover carefully curated properties that match your lifestyle and preferences
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 max-w-2xl mx-auto shadow-2xl mb-12">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                  type="text"
                  placeholder="Enter location or property type"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-[42px] pr-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-900 text-left"
                />

            </div>
            <Button 
              className="bg-cyan-600 hover:bg-cyan-700 px-8 py-3 text-white font-medium"
              onClick={handleSearch}
            >
              <Search className="h-5 w-5 mr-2" />
              Search 
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 justify-center mb-12">
          <Button 
            variant={selectedFilter === 'all' ? 'default' : 'outline'}
            className={selectedFilter === 'all' ? 'bg-cyan-600 hover:bg-cyan-700 text-white' : 'border-cyan-200 text-cyan-700 hover:bg-cyan-50 bg-transparent'}
            onClick={() => handleFilterChange('all')}
          >
            All Properties
          </Button>
          <Button 
            variant={selectedFilter === 'studio' ? 'default' : 'outline'}
            className={selectedFilter === 'studio' ? 'bg-cyan-600 hover:bg-cyan-700 text-white' : 'border-cyan-200 text-cyan-700 hover:bg-cyan-50 bg-transparent'}
            onClick={() => handleFilterChange('studio')}
          >
            STUDIO
          </Button>
          <Button 
            variant={selectedFilter === '1br' ? 'default' : 'outline'}
            className={selectedFilter === '1br' ? 'bg-cyan-600 hover:bg-cyan-700 text-white' : 'border-cyan-200 text-cyan-700 hover:bg-cyan-50 bg-transparent'}
            onClick={() => handleFilterChange('1br')}
          >
            1BR
          </Button>
          <Button 
            variant={selectedFilter === '2br' ? 'default' : 'outline'}
            className={selectedFilter === '2br' ? 'bg-cyan-600 hover:bg-cyan-700 text-white' : 'border-cyan-200 text-cyan-700 hover:bg-cyan-50 bg-transparent'}
            onClick={() => handleFilterChange('2br')}
          >
            2BR
          </Button>
          <Button 
            variant={selectedFilter === '3br' ? 'default' : 'outline'}
            className={selectedFilter === '3br' ? 'bg-cyan-600 hover:bg-cyan-700 text-white' : 'border-cyan-200 text-cyan-700 hover:bg-cyan-50 bg-transparent'}
            onClick={() => handleFilterChange('3br')}
          >
            3BR
          </Button>
          <Button 
            variant={selectedFilter === '4br' ? 'default' : 'outline'}
            className={selectedFilter === '4br' ? 'bg-cyan-600 hover:bg-cyan-700 text-white' : 'border-cyan-200 text-cyan-700 hover:bg-cyan-50 bg-transparent'}
            onClick={() => handleFilterChange('4br')}
          >
            4BR
          </Button>
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
                  {rental.mediaFiles && rental.mediaFiles.length > 0 ? (
                    <>
                      <img
                        src={rental.mediaFiles[imageIndices[rental.id] || 0]?.url || rental.mediaFiles[0]?.url}
                        alt={rental.name}
                        className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      
                      {/* Navigation Arrows */}
                      {rental.mediaFiles && rental.mediaFiles.length > 1 && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-600 hover:text-cyan-600"
                            onClick={(e) => prevImage(rental.id, rental.mediaFiles!.length, e)}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-600 hover:text-cyan-600"
                            onClick={(e) => nextImage(rental.id, rental.mediaFiles!.length, e)}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      
                      {/* Image Dots */}
                      {rental.mediaFiles && rental.mediaFiles.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                          {rental.mediaFiles.map((_, index) => (
                            <button
                              key={index}
                              className={`w-2 h-2 rounded-full transition-all ${
                                index === (imageIndices[rental.id] || 0) 
                                  ? 'bg-white scale-125' 
                                  : 'bg-white/50 hover:bg-white/75'
                              }`}
                              onClick={(e) => goToImage(rental.id, index, e)}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <img
                      src="/placeholder.svg"
                      alt={rental.name}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  
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
                        {rental.monthlyRent || 'Contact'}
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
                  <Button 
                    className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                    onClick={() => window.open('https://forms.monday.com/forms/8c6c6cd6c030c82856c14ef4439c61df?r=use1&color_mktgkr4e=East+30th+Street&short_text800omovg=6B', '_blank')}
                  >
                    Apply
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-cyan-200 text-cyan-700 hover:bg-cyan-50 bg-transparent"
                  >
                    View
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
              Load More Properties ({displayedRentals.length} of {(() => {
                // Calculate total filtered count
                let filteredRentals = rentals
                
                // Apply search filter
                if (searchQuery.trim()) {
                  const searchLower = searchQuery.toLowerCase().trim()
                  filteredRentals = filteredRentals.filter(rental => {
                    const propertyName = rental.propertyName?.toLowerCase() || ''
                    const unitName = rental.name?.toLowerCase() || ''
                    const amenities = rental.amenities?.toLowerCase() || ''
                    
                    return propertyName.includes(searchLower) || 
                           unitName.includes(searchLower) || 
                           amenities.includes(searchLower)
                  })
                }
                
                // Apply bedroom filter
                if (selectedFilter !== 'all') {
                  filteredRentals = filteredRentals.filter(rental => {
                    const unitType = rental.unitType?.toLowerCase() || ''
                    if (selectedFilter === 'studio') return unitType.includes('studio') || unitType.includes('0')
                    if (selectedFilter === '1br') return unitType.includes('1') && !unitType.includes('10') && !unitType.includes('11')
                    if (selectedFilter === '2br') return unitType.includes('2') && !unitType.includes('12')
                    if (selectedFilter === '3br') return unitType.includes('3') && !unitType.includes('13')
                    if (selectedFilter === '4br') return unitType.includes('4') && !unitType.includes('14')
                    return false
                  })
                }
                
                return filteredRentals.length
              })()})
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
