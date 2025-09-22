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
import { IncomeWithFrequencyInput } from './ui/validated-input'

const interestFormSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  propertyName: z.string().min(1, "Property name is required"),
  unitNumber: z.string().min(1, "Unit number is required"),
  phone: z.string()
    .min(1, "Phone number is required")
    .regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
  email: z.string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .refine((email) => email.endsWith('.com'), "Email must end with .com"),
  idealMoveInDate: z.date({
    required_error: "Ideal move-in date is required",
    invalid_type_error: "Please select a valid date",
  }),
  currentAddress: z.string().min(1, "Current address is required"),
  // New inputs used to calculate annual income
  householdIncome: z.string().min(1, "Household income is required"),
  incomeFrequency: z.enum(["weekly", "bi-weekly", "monthly", "quarterly", "yearly"], {
    required_error: "Income frequency is required",
  }),
  // Calculated field (kept required as we auto-populate it)
  annualIncome: z.string().min(1, "Annual income is required"),
  creditScore: z.string().min(1, "Credit score is required"),
  hasCoApplicant: z.enum(["yes", "no"], {
    required_error: "Please select whether you have a co-applicant",
  }),
  coApplicantAnnualIncome: z.string().optional(),
  coApplicantCreditScore: z.string().optional(),
  hasGuarantor: z.enum(["yes", "no"], {
    required_error: "Please select whether you have a guarantor",
  }),
  guarantorAnnualIncome: z.string().optional(),
  guarantorCreditScore: z.string().optional(),
  message: z.string().min(1, "Message is required"),
}).refine((data) => {
  // If co-applicant is "yes", then co-applicant fields are required
  if (data.hasCoApplicant === "yes") {
    if (!data.coApplicantAnnualIncome || data.coApplicantAnnualIncome.trim() === "") {
      return false;
    }
    if (!data.coApplicantCreditScore || data.coApplicantCreditScore.trim() === "") {
      return false;
    }
  }
  
  // If guarantor is "yes", then guarantor fields are required
  if (data.hasGuarantor === "yes") {
    if (!data.guarantorAnnualIncome || data.guarantorAnnualIncome.trim() === "") {
      return false;
    }
    if (!data.guarantorCreditScore || data.guarantorCreditScore.trim() === "") {
      return false;
    }
  }
  
  return true;
}, {
  message: "Please fill in all required fields for co-applicants and guarantors",
  path: ["hasCoApplicant"]
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
      householdIncome: "",
      incomeFrequency: "monthly",
      annualIncome: "",
      creditScore: "",
      hasCoApplicant: undefined,
      coApplicantAnnualIncome: "",
      coApplicantCreditScore: "",
      hasGuarantor: undefined,
      guarantorAnnualIncome: "",
      guarantorCreditScore: "",
      message: "",
    },
  })

  // Calculate annual income whenever household income or frequency changes
  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
      if (name === 'householdIncome' || name === 'incomeFrequency') {
        const raw = values.householdIncome as unknown as string
        const freq = values.incomeFrequency as unknown as string
        const amount = raw ? parseFloat(String(raw)) : 0
        if (!isFinite(amount) || amount <= 0) {
          form.setValue('annualIncome', '')
          return
        }
        const factorMap: Record<string, number> = {
          'weekly': 52,
          'bi-weekly': 26,
          'monthly': 12,
          'quarterly': 4,
          'yearly': 1,
        }
        const factor = factorMap[freq] ?? 12
        const annual = amount * factor
        form.setValue('annualIncome', annual.toFixed(2), { shouldValidate: true, shouldDirty: true })
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

  // Meta (Facebook) Pixel - load only on this component mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    const win = window as any

    if (win.fbq && typeof win.fbq === 'function') {
      try { win.fbq('track', 'PageView') } catch {}
      return
    }

    // Bootstrap Meta Pixel and load SDK
    const bootstrap = document.createElement('script')
    bootstrap.type = 'text/javascript'
    bootstrap.async = true
    bootstrap.text = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?\n    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;\n    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;\n    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script',\n    'https://connect.facebook.net/en_US/fbevents.js');\n    fbq('init', '730476173284501');\n    fbq('track', 'PageView');`
    document.head.appendChild(bootstrap)
  }, [])

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
      
      // Track Meta Pixel Lead on successful submission
      try {
        const win = window as any
        if (win && win.fbq) {
          win.fbq('track', 'Lead')
        }
      } catch {}

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
        <CardTitle className="flex items-center justify-center gap-2 text-xl">
          <Home className="w-5 h-5" />
          Interest Form
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
                  <FormLabel>Unit # *</FormLabel>
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
                    <Input 
                      placeholder="1234567890" 
                      maxLength={10}
                      {...field}
                      onChange={(e) => {
                        // Only allow digits
                        const value = e.target.value.replace(/\D/g, '')
                        field.onChange(value)
                      }}
                    />
                  </FormControl>
                  <p className="text-sm text-gray-600 mt-1">
                    Enter exactly 10 digits (no spaces, dashes, or parentheses)
                  </p>
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
                    <Input 
                      placeholder="example@domain.com" 
                      type="email"
                      {...field} 
                    />
                  </FormControl>
                  <p className="text-sm text-gray-600 mt-1">
                    Email must end with .com domain
                  </p>
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

            {/* Household Income + Frequency (bilingual prompt) */}
            <div className="space-y-2">
           
              <Label className="text-sm text-gray-700">
                Please provide your total household income (including your income and that of all household members).
              </Label>
            </div>

            <div className="form-field">
              <FormField
                control={form.control}
                name="householdIncome"
                render={({ field }) => (
                  <FormItem>
                   
                    <IncomeWithFrequencyInput
                      name="household-income"
                      label="  Por favor indique el ingreso total del hogar (incluyendo su ingreso y el de todos los miembros del hogar).
              "
                      value={field.value}
                      frequency={form.watch('incomeFrequency') || 'monthly'}
                      onValueChange={(val) => form.setValue('householdIncome', val, { shouldValidate: true, shouldDirty: true })}
                      onFrequencyChange={(freq) => form.setValue('incomeFrequency', freq as any, { shouldValidate: true, shouldDirty: true })}
                      required
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
        
            </div>

            {/* Annual Income */}
            <FormField
              control={form.control}
              name="annualIncome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Annual Income [Applicant] * (calculated)
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Calculated annual income" readOnly {...field} />
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
                    Credit Score [Applicant] *
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Enter credit score" {...field} />
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

            {/* Co-Applicant Annual Income - Only show if "Yes" is selected */}
            {form.watch("hasCoApplicant") === "yes" && (
              <FormField
                control={form.control}
                name="coApplicantAnnualIncome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Annual Income [Co-Applicant] *
                    </FormLabel>
                    <p className="text-sm text-gray-600 mt-1">
                      Please provide the total annual income of all co-applicants
                    </p>
                    <FormControl>
                      <Input placeholder="Enter Annual Income" {...field} />
                    </FormControl>
                  
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Co-Applicant Credit Score - Only show if "Yes" is selected */}
            {form.watch("hasCoApplicant") === "yes" && (
              <FormField
                control={form.control}
                name="coApplicantCreditScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Credit Score [Co-Applicant] *
                    </FormLabel>
                    <p className="text-sm text-gray-600 mt-1">
                      Please mention the highest credit score among all the co-applicants if multiple co-applicants exist
                    </p>
                    <FormControl>
                      <Input placeholder="Enter Credit Score" {...field} />
                    </FormControl>
                    
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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

            {/* Guarantor Annual Income - Only show if "Yes" is selected */}
            {form.watch("hasGuarantor") === "yes" && (
              <FormField
                control={form.control}
                name="guarantorAnnualIncome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Annual Income [Guarantor] *
                    </FormLabel>
                    <p className="text-sm text-gray-600 mt-1">
                      Please provide the total annual income of all guarantors
                    </p>
                    <FormControl>
                      <Input placeholder="Enter Annual Income" {...field} />
                    </FormControl>
                   
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Guarantor Credit Score - Only show if "Yes" is selected */}
            {form.watch("hasGuarantor") === "yes" && (
              <FormField
                control={form.control}
                name="guarantorCreditScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Credit Score [Guarantor] *
                    </FormLabel>
                    <p className="text-sm text-gray-600 mt-1">
                      Please mention the highest credit score among all the guarantors if multiple guarantors exist
                    </p>
                    <FormControl>
                      <Input placeholder="Enter Credit Score" {...field} />
                    </FormControl>
                   
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
