"use client"

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form'
import { DatePicker } from './ui/date-picker'
import { CheckCircle, Send, Home, User, Phone, Mail, Calendar, MapPin, DollarSign, CreditCard, Users, Shield, MessageSquare, Loader2 } from 'lucide-react'
import { useToast } from '../hooks/use-toast'
import { useLocation } from 'wouter'
import { MondayApiService, type UnitItem } from '../lib/monday-api'

const interestFormSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  propertyName: z.string().min(1, "Property name is required"),
  unitNumber: z.string().optional(),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Please enter a valid email address"),
  idealMoveInDate: z.date({
    required_error: "Ideal move-in date is required",
    invalid_type_error: "Please select a valid date",
  }),
  currentAddress: z.string().min(1, "Current address is required"),
  annualIncome: z.string().optional(),
  creditScore: z.string().optional(),
  hasCoApplicant: z.enum(["yes", "no"]).optional(),
  hasGuarantor: z.enum(["yes", "no"]).optional(),
  message: z.string().optional(),
})

type InterestFormData = z.infer<typeof interestFormSchema>

interface InterestFormProps {
  className?: string
}

export function InterestForm({ className }: InterestFormProps) {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [properties, setProperties] = useState<string[]>([])
  const [availableUnits, setAvailableUnits] = useState<string[]>([])
  const [isLoadingProperties, setIsLoadingProperties] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<string>("")
  const [useFallback, setUseFallback] = useState(false)
  const [apiData, setApiData] = useState<any[]>([])
  const { toast } = useToast()
  const [, setLocation] = useLocation()

  // Fallback property options for unauthenticated users
  const fallbackProperties = [
    "Sunset Apartments",
    "Liberty Place",
    "Central Park Residences",
    "Downtown Lofts",
    "Riverside Gardens",
    "Harbor View Apartments",
    "Mountain View Complex",
    "City Center Plaza"
  ]

  // Fallback unit options for each property
  const fallbackUnits: Record<string, string[]> = {
    "Sunset Apartments": ["101", "102", "201", "202", "301", "302"],
    "Liberty Place": ["A1", "A2", "B1", "B2", "C1", "C2"],
    "Central Park Residences": ["1A", "1B", "2A", "2B", "3A", "3B"],
    "Downtown Lofts": ["Loft 1", "Loft 2", "Loft 3", "Loft 4"],
    "Riverside Gardens": ["Garden 1", "Garden 2", "Garden 3", "Garden 4"],
    "Harbor View Apartments": ["H1", "H2", "H3", "H4", "H5"],
    "Mountain View Complex": ["MV1", "MV2", "MV3", "MV4"],
    "City Center Plaza": ["CC1", "CC2", "CC3", "CC4", "CC5"]
  }

  const form = useForm<InterestFormData>({
    resolver: zodResolver(interestFormSchema),
    defaultValues: {
      fullName: "",
      propertyName: "",
      unitNumber: "",
      phone: "",
      email: "",
      currentAddress: "",
      annualIncome: "",
      creditScore: "",
      hasCoApplicant: undefined,
      hasGuarantor: undefined,
      message: "",
    },
  })

  // Fetch properties and units on component mount
  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoadingProperties(true)
      try {
        // Use the DynamoDB API endpoint directly
        const response = await fetch('https://5sdpaqwf0f.execute-api.us-east-1.amazonaws.com/dev/getnyclisting', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ Stage: 'Active' }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        console.log('DynamoDB API response:', result)
        
        // Extract properties and store full data from the response
        let properties: string[] = []
        let items: any[] = []
        
        if (result.body) {
          try {
            const bodyData = typeof result.body === 'string' ? JSON.parse(result.body) : result.body
            
            if (bodyData.items && Array.isArray(bodyData.items)) {
              items = bodyData.items
              // Extract unique property names from items
              const propertyNames = items
                .map((item: any) => item.address || item.propertyName || item.buildingAddress)
                .filter((name: string) => name && name.trim() !== '')
              
              properties = Array.from(new Set(propertyNames))
            }
          } catch (parseError) {
            console.error('Error parsing API response body:', parseError)
          }
        }
        
        // Fallback: check if result has properties directly
        if (properties.length === 0) {
          if (result.properties && Array.isArray(result.properties)) {
            properties = result.properties
          } else if (result.items && Array.isArray(result.items)) {
            items = result.items
            const propertyNames = items
              .map((item: any) => item.address || item.propertyName || item.buildingAddress)
              .filter((name: string) => name && name.trim() !== '')
            properties = Array.from(new Set(propertyNames))
          }
        }
        
        if (properties.length > 0) {
          setProperties(properties)
          setApiData(items)
          setUseFallback(false)
          console.log('Fetched properties from DynamoDB:', properties)
          console.log('Full API data:', items)
        } else {
          throw new Error('No properties found in API response')
        }
        
      } catch (error) {
        console.error('Error fetching properties from DynamoDB:', error)
        // Use fallback options if API fails
        console.log('Using fallback property options due to API error')
        setProperties(fallbackProperties)
        setUseFallback(true)
      } finally {
        setIsLoadingProperties(false)
      }
    }

    fetchProperties()
  }, [toast])

  // Handle property selection
  const handlePropertyChange = (propertyName: string) => {
    setSelectedProperty(propertyName)
    form.setValue("propertyName", propertyName)
    form.setValue("unitNumber", "") // Reset unit when property changes
    
    if (useFallback) {
      // Use fallback units for unauthenticated users
      const fallbackUnitOptions = fallbackUnits[propertyName] || []
      setAvailableUnits(fallbackUnitOptions)
      console.log(`Selected property (fallback): ${propertyName}`)
      console.log(`Available units (fallback): ${fallbackUnitOptions}`)
    } else {
      // Extract units from API data for the selected property
      const propertyItems = apiData.filter((item: any) => {
        const itemProperty = item.address || item.propertyName || item.buildingAddress
        return itemProperty === propertyName
      })
      
      // Extract unit information from the items
      let unitOptions: string[] = []
      
      propertyItems.forEach((item: any) => {
        // Try to extract unit information from various possible fields
        if (item.unitNumber) {
          unitOptions.push(item.unitNumber)
        } else if (item.unit) {
          unitOptions.push(item.unit)
        } else if (item.name) {
          unitOptions.push(item.name)
        } else if (item.apartmentNumber) {
          unitOptions.push(item.apartmentNumber)
        } else if (item.roomNumber) {
          unitOptions.push(item.roomNumber)
        }
      })
      
      // If no specific unit info found, use generic options
      if (unitOptions.length === 0) {
        unitOptions = ["Unit 1", "Unit 2", "Unit 3", "Unit 4", "Unit 5", "Unit 6"]
      }
      
      // Remove duplicates and sort
      unitOptions = Array.from(new Set(unitOptions)).sort()
      
      setAvailableUnits(unitOptions)
      console.log(`Selected property from DynamoDB: ${propertyName}`)
      console.log(`Available units: ${unitOptions}`)
      console.log(`Property items:`, propertyItems)
    }
  }

  const onSubmit = async (data: InterestFormData) => {
    try {
      // Send data to webhook
      const response = await fetch('https://hook.us1.make.com/ukix9c6ym91stj9p8k86cg1hllwvwm1m', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          idealMoveInDate: data.idealMoveInDate ? data.idealMoveInDate.toISOString() : null,
          submittedAt: new Date().toISOString(),
          source: 'LPPM Interest Form'
        }),
      })
      
      if (!response.ok) {
        throw new Error(`Webhook request failed with status ${response.status}`)
      }
      
      console.log('Interest form submitted successfully:', data)
      
      toast({
        title: "Interest Form Submitted!",
        description: "Thank you for your interest. We'll be in touch soon!",
      })
      
      setIsSubmitted(true)
      setLocation('/interest-form-success')
    } catch (error) {
      console.error('Error submitting interest form:', error)
      toast({
        title: "Error",
        description: "There was an error submitting your form. Please try again.",
        variant: "destructive",
      })
    }
  }



  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Home className="w-5 h-5" />
          LPPM Interest Form
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Full Name */}
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Full Name *
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Property Name */}
            <FormField
              control={form.control}
              name="propertyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    Property Name *
                  </FormLabel>
                  <FormControl>
                    <Select onValueChange={handlePropertyChange} defaultValue={field.value} disabled={isLoadingProperties}>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingProperties ? "Loading properties..." : "Select a property"} />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map((property) => (
                          <SelectItem key={property} value={property}>
                            {property}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  {useFallback ? (
                    <p className="text-sm text-amber-600 mt-1">
                      ℹ️ Showing sample properties. For real-time availability, please contact us.
                    </p>
                  ) : (
                    <p className="text-sm text-green-600 mt-1">
                      ✅ Showing real properties from our database.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Unit Number */}
            <FormField
              control={form.control}
              name="unitNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit #</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedProperty}>
                      <SelectTrigger>
                        <SelectValue placeholder={selectedProperty ? "Select a unit" : "Select a property first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUnits.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone *
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email *
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your email address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Ideal Move-In Date */}
            <FormField
              control={form.control}
              name="idealMoveInDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Ideal Move-In Date *
                  </FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select move-in date"
                      disabled={(date) => date < new Date()}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Current Address */}
            <FormField
              control={form.control}
              name="currentAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Current Address *
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter your current address" 
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Annual Income */}
            <FormField
              control={form.control}
              name="annualIncome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Annual Income [Applicant]
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Enter annual income (optional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Credit Score */}
            <FormField
              control={form.control}
              name="creditScore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Credit Score [Applicant]
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Enter credit score (optional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Co-Applicant */}
            <FormField
              control={form.control}
              name="hasCoApplicant"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Do you have a co-applicant? *
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Guarantor */}
            <FormField
              control={form.control}
              name="hasGuarantor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Guarantor? *
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Message */}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Message *
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell us about your interest, any specific requirements, or questions you have..." 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Interest Form
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
