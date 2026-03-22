'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation' // Import router
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getRealProperties } from '@/lib/actions/real-property'
import { Loader2 } from 'lucide-react'
import { EditPropertyModal } from './editPropertyDetails'

type RealProperty = {
  id: string
  pin: string
  owner: string
  taxdecnumber: string
  tctOct: string
  location: string
  lotNumber: string
  area: number
  marketValue: string
  createdAt: Date
}

export function SavedPropertyDetails() {
  const [properties, setProperties] = useState<RealProperty[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { data: session } = useSession()
  const router = useRouter()

  // 1. Move fetchData out of useEffect and wrap in useCallback
  // This allows us to call it again after a successful edit
  const fetchData = useCallback(async () => {
    try {
      const data = await getRealProperties()
      const formattedData = data.map((item: any) => ({
        ...item,
        marketValue: item.marketValue.toString(),
        createdAt: new Date(item.createdAt)
      }))
      setProperties(formattedData)
    } catch (error) {
      console.error('Failed to fetch properties:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 2. This handles the refresh logic when the modal succeeds
  const handleRefresh = () => {
    fetchData() // Refresh local state
    router.refresh() // Refresh server-side cache
  }

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (isLoading) {
    return (
      <Card className="w-full mt-8">
        <CardContent className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground shrink-0" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full mt-8">
      <CardHeader>
        <CardTitle>Saved Real Property Details</CardTitle>
        <CardDescription>A list of all the submitted real property details across the system.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PIN</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Lot Number</TableHead>
                <TableHead>Tax Dec No.</TableHead>
                <TableHead>TCT/OCT</TableHead>
                <TableHead className="text-right">Area</TableHead>
                <TableHead className="text-right">Date Created</TableHead>
                <TableHead className="text-right">Market Value</TableHead>
                {(session?.user as any)?.role === 'ADMIN' && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={(session?.user as any)?.role === 'ADMIN' ? 10 : 9} className="text-center py-6 text-muted-foreground">
                    No real properties found. Please add one above.
                  </TableCell>
                </TableRow>
              ) : (
                properties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell className="font-medium">{property.pin}</TableCell>
                    <TableCell>{property.owner}</TableCell>
                    <TableCell>{property.location}</TableCell>
                    <TableCell>{property.lotNumber}</TableCell>
                    <TableCell>{property.taxdecnumber}</TableCell>
                    <TableCell>{property.tctOct}</TableCell>
                    <TableCell className="text-right">{property.area}</TableCell>
                    <TableCell className="text-right" suppressHydrationWarning>
                      {property.createdAt.toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">₱{property.marketValue}</TableCell>
                    {(session?.user as any)?.role === 'ADMIN' && (
                      <TableCell className="text-right">
                        <EditPropertyModal 
                          property={property} 
                          onUpdateSuccess={handleRefresh} // Pass the handler here
                        />
                      </TableCell>
                    )}
                  </TableRow>
                ))  
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}