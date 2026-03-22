"use client"

import { useState } from "react"
import { useForm  } from "react-hook-form"
import {zodResolver } from "@hookform/resolvers/zod"
import { realPropertySchema } from "@/lib/schema"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog" 
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export function EditPropertyModal({ property, onUpdateSuccess}: {property: any, onUpdateSuccess: () => void}) {
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const router = useRouter()

    // 1. Initialize the form with existing property value
    const {
        register,
        handleSubmit,
        setError,
        formState: {errors},
    } = useForm ({
        resolver: zodResolver(realPropertySchema),
        defaultValues: property,
    })

    // 2. The Submit Handler
    const onSubmit = async (data: any) => {
        setIsSubmitting(true)
        try {
            const response = await fetch (`/api/realproperty/${property.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify(data),
            })

            const result = await response.json()

            if (!response.ok) {
                // 3. Map the structure errors from the API back to the form fields
                if (result.errors) {
                    Object.keys(result.errors).forEach((key) => {
                        if (key !== '_errors') {
                            setError(key as any, {
                                type: 'server',
                                message: result.errors[key]?._errors[0],
                            })
                        }
                    })
                }
                throw new Error(result.message || 'Failed to update property')
            }
            toast.success('Property updated successfully')
            setOpen(false)
            onUpdateSuccess()
            router.refresh()
        } catch (error: any)    {
            toast.error(error.message)
        } finally {
            setIsSubmitting(false)
        }
    }
    return (
        <Dialog open = {open} onOpenChange = {setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">Edit</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Property Details</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Owner</Label>
              <Input {...register('owner')} />
              {errors.owner && <p className="text-xs text-red-500">{errors.owner.message as string}</p>}
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input {...register('location')} />
              {errors.location && <p className="text-xs text-red-500">{errors.location.message as string}</p>}
            </div>
          </div>
         <div className="space-y-2">
            <Label>Tax Dec Number</Label>
            <Input {...register('taxdecnumber')} />
            {errors.taxdecnumber && <p className="text-xs text-red-500">{errors.taxdecnumber.message as string}</p>}
          </div>    
          <div className="space-y-2">
            <Label>TCT/OCT</Label>
            <Input {...register('tctOct')} />
            {errors.tctOct && <p className="text-xs text-red-500">{errors.tctOct.message as string}</p>}
          </div>
          <div className="space-y-2">
            <Label>Area(SQM)</Label>
            <Input {...register('area')} />     
            {errors.area && <p className="text-xs text-red-500">{errors.area.message as string}</p>}
          </div>
          <div className="space-y-2">
            <Label>Market Value</Label>
            <Input {...register('marketValue')} />
            {errors.marketValue && <p className="text-xs text-red-500">{errors.marketValue.message as string}</p>}
          </div>

          {/* Add other fields (pin, tctOct, area, etc.) following the same pattern */}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
            </DialogContent>

        </Dialog>
    )
}
