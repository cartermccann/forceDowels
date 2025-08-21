"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Loader2, ShoppingCart, Plus, Minus, Info, Lock } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { PRICING_TIERS, getTierInfo, formatNumber as formatNum, formatCurrency, formatExactPrice, isValidQuantityIncrement, roundToValidQuantity } from "@/lib/pricing"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function OrderPage() {
  const [quantity, setQuantity] = useState<number>(5000)
  const [selectedTier, setSelectedTier] = useState<string>("5,000-20,000")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isKit, setIsKit] = useState(false)
  const { toast } = useToast()
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const { addItem, items } = useCart()

  // Use the pricing tiers from the pricing utility
  const tiers = PRICING_TIERS

  // Helper function to check if a quantity requires authentication
  const requiresAuth = (qty: number) => {
    if (qty === 300) return false // Kit is always allowed
    if (qty === 5000) return false // 5K dowels allowed for guest
    return qty > 5000 // Anything above 5K requires auth
  }

  // Check if current selection requires auth (defensive check for SSR)
  const currentRequiresAuth = isLoaded && !user && requiresAuth(quantity)

  // Handle quantity change
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value.replace(/,/g, ""), 10) || 0
    
    // Check if it's the kit quantity
    if (value === 300) {
      setQuantity(300)
      setIsKit(true)
      setSelectedTier("Kit - 300 units")
      return
    }
    
    setIsKit(false)
    const newQuantity = roundToValidQuantity(value) // Round to valid 5,000-unit increment
    setQuantity(newQuantity)

    // Update selected tier based on quantity using the pricing utility
    const tierInfo = getTierInfo(newQuantity)
    if (tierInfo.tier) {
      setSelectedTier(tierInfo.tier)
    }
  }

  // Handle quantity increment
  const handleQuantityIncrement = () => {
    if (isKit) return // Can't increment kit quantity
    
    const newQuantity = Math.min(960000, quantity + 5000)
    setQuantity(newQuantity)

    const tierInfo = getTierInfo(newQuantity)
    if (tierInfo.tier) {
      setSelectedTier(tierInfo.tier)
    }
  }

  // Handle quantity decrement
  const handleQuantityDecrement = () => {
    if (isKit) return // Can't decrement kit quantity
    
    const newQuantity = Math.max(5000, quantity - 5000)
    setQuantity(newQuantity)

    const tierInfo = getTierInfo(newQuantity)
    if (tierInfo.tier) {
      setSelectedTier(tierInfo.tier)
    }
  }

  // Use the formatNumber from pricing utility (renamed to avoid conflict)
  const formatNumber = formatNum

  // Handle add to cart
  const handleAddToCart = () => {
    try {
      setIsSubmitting(true)

      // Validate quantity increment (skip for kit)
      if (!isKit && !isValidQuantityIncrement(quantity)) {
        toast({
          title: "Invalid quantity",
          description: "Quantity must be in 5,000-unit increments (minimum 5,000 units; maximum 960,000 units).",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      if (isKit) {
        // Check if kit already exists in cart
        const existingKit = items.find((i) => i.name === "Force Dowels Kit")
        
        if (existingKit) {
          toast({
            title: "Kit already in cart",
            description: "You can only have one Force Dowels Kit per order.",
            variant: "destructive",
          })
          setIsSubmitting(false)
          return
        }
        
        // Add Force Dowels Kit to cart
        addItem({
          id: "force-dowels-kit", // Use consistent ID for Force Dowels Kit
          name: "Starter Kit",
          quantity: 300,
          tier: "Kit - 300 units",
          pricePerUnit: 0.12,
        })
      } else {
        // Get the proper pricing based on quantity
        const tierInfo = getTierInfo(quantity)
        if (!tierInfo.pricePerUnit) {
          toast({
            title: "Invalid quantity",
            description: "Please enter a valid quantity within our pricing tiers.",
            variant: "destructive",
          })
          setIsSubmitting(false)
          return
        }

        // Add item to cart with proper pricing
        addItem({
          id: "force-dowels", // Use consistent ID for Force Dowels
          name: "Force Dowels",
          quantity,
          tier: tierInfo.tier || selectedTier,
          pricePerUnit: tierInfo.pricePerUnit,
        })
      }

      // Show success message
      toast({
        title: "Added to cart",
        description: isKit 
          ? "Force Dowels Kit (300 units) added to your cart."
          : `${formatNumber(quantity)} units of Force Dowels added to your cart.`,
      })

      // Reset quantity to minimum
      setQuantity(5000)
      setSelectedTier("5,000-20,000")
      setIsKit(false)

    } catch (error) {
      console.error('Error adding to cart:', error)
      toast({
        title: "Error adding to cart",
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle tier selection
  const handleTierSelect = (tier: (typeof tiers)[0]) => {
    setIsKit(false)
    setSelectedTier(tier.range)
    setQuantity(tier.min)
  }

  // Handle kit selection
  const handleKitSelect = () => {
    setIsKit(true)
    setQuantity(300)
    setSelectedTier("Kit - 300 units")
  }

  // Animation variants for Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  }



  // Show loading state while authentication is loading
  if (!isLoaded) {
    return (
      <div className="container flex flex-1 px-4 py-8 md:px-6">
        <div className="flex justify-center items-center min-h-[400px] w-full">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <motion.main
      className="flex min-h-[calc(100vh-4rem)] flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container flex flex-1 px-4 py-8 md:px-6">
        

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              <motion.h2 className="text-2xl font-bold mb-6" variants={itemVariants}>
                Pricing Tiers
              </motion.h2>

              {isLoaded && !user && (
                <Alert className="mb-4 border-amber-200 bg-amber-50">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-amber-800">
                    <strong>Guest Checkout Available:</strong> Orders of 5,000 dowels or less, and all kit purchases,
                    can be completed without an account. Larger orders require sign-in for business verification.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                {tiers.map((tier) => {
                  const tierRequiresAuth = isLoaded && !user && requiresAuth(tier.min)
                  const isDisabled = tierRequiresAuth

                  return (
                    <motion.div
                      key={tier.range}
                      variants={itemVariants}
                      className={`flex justify-between items-center p-3 border rounded-md transition-colors duration-200 relative ${
                        selectedTier === tier.range
                          ? "border-amber-600 bg-amber-50"
                          : isDisabled
                            ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                            : "hover:bg-gray-50 cursor-pointer"
                      }`}
                      onClick={() => !isDisabled && handleTierSelect(tier)}
                      whileHover={!isDisabled ? { scale: 1.01 } : {}}
                      whileTap={!isDisabled ? { scale: 0.99 } : {}}
                    >
                      <div className="flex items-center">
                        <span className={`font-medium ${isDisabled ? 'text-gray-400' : ''}`}>
                          {tier.range}
                        </span>
                        {isDisabled && (
                          <Lock className="h-4 w-4 ml-2 text-gray-400" />
                        )}
                      </div>
                      <span className={`font-bold ${isDisabled ? 'text-gray-400' : 'text-amber-600'}`}>
                        ${formatExactPrice(tier.pricePerUnit)}/Unit
                      </span>
                      {isDisabled && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-md">
                          <span className="text-xs text-gray-500 font-medium">Sign in required</span>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>

            {/* Force Dowels Kit Option */}
            <motion.div
              className="mt-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.3 }}
            >
              <motion.h3 className="text-xl font-bold mb-4" variants={itemVariants}>
                Or Try Our Starter Kit
              </motion.h3>
              <motion.div
                className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                  isKit ? "border-amber-600 bg-amber-50" : "border-gray-200 hover:bg-gray-50"
                }`}
                onClick={handleKitSelect}
                variants={itemVariants}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold">Force Dowels Kit</h4>
                    <p className="text-sm text-gray-600">Perfect for small projects and testing</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-amber-600">$36.00</span>
                    <p className="text-sm text-gray-600">300 dowels • $0.12/unit</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              className="mt-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.4 }}
            >
              <motion.h3 className="text-xl font-bold mb-2" variants={itemVariants}>
                Need a Custom Quote?
              </motion.h3>
              <motion.p className="text-gray-700" variants={itemVariants}>
                For orders exceeding 960,000 units or for special requirements, please contact our sales team for a
                specialized quote.
              </motion.p>
              <motion.div variants={itemVariants} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link href="/contact">
                  <Button className="mt-4 bg-amber-600 hover:bg-amber-700">Contact Sales</Button>
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Calculate Your Price</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Ordering Requirements Notice */}
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    <Alert className="border-slate-200 bg-slate-50/50 shadow-sm">
                      <Info className="h-4 w-4 text-slate-600" />
                      <AlertDescription className="text-sm text-slate-700 leading-relaxed">
                        <strong className="text-slate-900">Ordering Requirements:</strong> Force Dowels are available in 5,000-unit increments only.
                        Minimum order quantity is 5,000 units, maximum is 960,000 units.
                      </AlertDescription>
                    </Alert>
                  </motion.div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity (units)</Label>
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleQuantityDecrement}
                        disabled={isKit || quantity <= 5000}
                        className="h-10 w-10 shrink-0"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        id="quantity"
                        type="text"
                        value={formatNumber(quantity)}
                        onChange={handleQuantityChange}
                        className="text-right"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleQuantityIncrement}
                        disabled={isKit || quantity >= 960000}
                        className="h-10 w-10 shrink-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">units</span>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    {(() => {
                      const tierInfo = getTierInfo(quantity)
                      return (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Price per unit:</span>
                            <span className="font-bold">
                              {isKit ? '$0.12' : (tierInfo.pricePerUnit ? `$${formatExactPrice(tierInfo.pricePerUnit)}` : 'N/A')}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Total price:</span>
                            <span className="text-2xl font-bold">
                              {isKit ? '$36.00' : (tierInfo.totalPrice ? formatCurrency(tierInfo.totalPrice) : 'N/A')}
                            </span>
                          </div>
                          {isKit && (
                            <div className="flex justify-between items-center">
                              <span className="font-medium">Selected:</span>
                              <span className="font-bold text-amber-600">Force Dowels Kit</span>
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      className={`w-full mt-4 ${
                        currentRequiresAuth
                          ? "bg-gray-400 hover:bg-gray-500"
                          : "bg-amber-600 hover:bg-amber-700"
                      }`}
                      size="lg"
                      onClick={currentRequiresAuth ? () => router.push('/sign-in?redirect=/order') : handleAddToCart}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : currentRequiresAuth ? (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          Sign In to Add to Cart
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Add to Cart
                        </>
                      )}
                    </Button>
                    <div className="mt-2 text-center">
                      <Button
                        variant="link"
                        className="text-amber-600 hover:text-amber-800"
                        onClick={() => router.push('/cart')}
                      >
                        View Cart
                      </Button>
                    </div>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          </div>
      </div>
    </motion.main>
  )
}