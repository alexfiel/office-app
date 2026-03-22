'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { createRealProperty } from '@/lib/actions/real-property'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export function AddPropertyDetails() {
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setErrors({})

    const formData = new FormData(event.currentTarget)
    
    try {
      const result = await createRealProperty(null, formData)
      
      if (result.success) {
        toast.success(result.message)
        // Reset form
        const form = event.target as HTMLFormElement
        form.reset()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('An unexpected error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Add Real Property Details</CardTitle>
        <CardDescription>Enter the new real property information.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pin">PIN</Label>
              <Input id="pin" name="pin" placeholder="Property Identification Number" required />
              {errors?.pin && <p className="text-sm text-red-500">{errors.pin[0]}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="owner">Owner</Label>
              <Input id="owner" name="owner" placeholder="Owner Name" required />
              {errors?.owner && <p className="text-sm text-red-500">{errors.owner[0]}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxdecnumber">Tax Declaration Number</Label>
              <Input id="taxdecnumber" name="taxdecnumber" placeholder="Tax Dec Number" required />
              {errors?.taxdecnumber && <p className="text-sm text-red-500">{errors.taxdecnumber[0]}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tctOct">TCT/OCT Number</Label>
              <Input id="tctOct" name="tctOct" placeholder="TCT or OCT Number" required />
              {errors?.tctOct && <p className="text-sm text-red-500">{errors.tctOct[0]}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="location">Location</Label>
              
              <Input id="location" name="location" placeholder="Property Location" required /> 
              {errors?.location && <p className="text-sm text-red-500">{errors.location[0]}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lotNumber">Lot Number</Label>
              <Input id="lotNumber" name="lotNumber" placeholder="Lot Number" required />
              {errors?.lotNumber && <p className="text-sm text-red-500">{errors.lotNumber[0]}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="area">Area</Label>
              <Input id="area" name="area" type="number" step="0.01" min="0" placeholder="Area in square units" required />
              {errors?.area && <p className="text-sm text-red-500">{errors.area[0]}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="marketValue">Market Value</Label>
              <Input id="marketValue" name="marketValue" type="number" step="0.01" min="0" placeholder="0.00" required />
              {errors?.marketValue && <p className="text-sm text-red-500">{errors.marketValue[0]}</p>}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Property Details
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
