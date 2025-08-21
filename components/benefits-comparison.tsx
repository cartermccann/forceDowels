"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, X, Zap, Clock, DollarSign, Eye } from "lucide-react"

interface ComparisonItem {
  feature: string
  traditional: {
    status: boolean
    description: string
  }
  forceDowels: {
    status: boolean
    description: string
  }
}

const comparisonData: ComparisonItem[] = [
  {
    feature: "Invisible Fasteners",
    traditional: {
      status: false,
      description: "Screws and nails visible on surface"
    },
    forceDowels: {
      status: true,
      description: "Completely hidden fastening system"
    }
  },
  {
    feature: "Assembly Speed",
    traditional: {
      status: false,
      description: "Time-consuming drilling and fastening"
    },
    forceDowels: {
      status: true,
      description: "Up to 60% faster assembly process"
    }
  },
  {
    feature: "Professional Finish",
    traditional: {
      status: false,
      description: "Requires filling and sanding"
    },
    forceDowels: {
      status: true,
      description: "Flush finish right out of the box"
    }
  },
  {
    feature: "Labor Costs",
    traditional: {
      status: false,
      description: "Higher due to complex installation"
    },
    forceDowels: {
      status: true,
      description: "Up to 40% reduction in labor costs"
    }
  },
  {
    feature: "No Glue Required",
    traditional: {
      status: false,
      description: "Often requires additional adhesives"
    },
    forceDowels: {
      status: true,
      description: "No glue necessary for strong joints"
    }
  }
]

export function BenefitsComparison() {
  const [isMounted, setIsMounted] = useState(false)
  const [hoveredSide, setHoveredSide] = useState<'traditional' | 'force' | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return <div className="py-16"></div>
  }

  return (
    <section className="py-16 bg-white">
      <div className="container px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
           Force Dowels™
            <span className="block text-lg text-amber-600 font-medium mt-2">Patent Pending Technology</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            See the clear advantages of choosing Force Dowels™ for your cabinetry projects
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <div className="justify-center items-center">
            
            {/* Force Dowels Method */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              onHoverStart={() => setHoveredSide('force')}
              onHoverEnd={() => setHoveredSide(null)}
              className="relative"
            >
              <Card className={`h-full transition-all duration-300 border-amber-200 ${
                hoveredSide === 'force' ? 'shadow-xl scale-105 border-amber-300' : 'shadow-lg'
              }`}>
                <CardHeader className="text-center pb-4 bg-gradient-to-r from-amber-50 to-orange-50 mb-5">
                  <CardTitle className="text-2xl text-amber-700 flex items-center justify-center gap-2">
                    <Zap className="h-6 w-6 text-amber-600" />
                    Force Dowels™
                  </CardTitle>
                  <Badge className="mx-auto bg-amber-600 hover:bg-amber-700">
                    Patent Pending
                  </Badge>
                </CardHeader>
               <CardContent className="space-y-4">
  {comparisonData.map((item, index) => (
    <motion.div
      key={index}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 + 0.2 }}
      className="flex flex-col items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100 text-center"
    >
      <div className="flex-shrink-0">
        <Check className="h-5 w-5 text-green-600" />
      </div>
      <div>
        <h4 className="font-semibold text-gray-900 mb-1">
          {item.feature}
        </h4>
        <p className="text-sm text-gray-700">
          {item.forceDowels.description}
        </p>
      </div>
    </motion.div>
  ))}
</CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Bottom Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-12 text-center"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="flex flex-col items-center p-4">
                <DollarSign className="h-8 w-8 text-amber-600 mb-2" />
                <h3 className="font-semibold text-gray-900">Cost Savings</h3>
                <p className="text-sm text-gray-600">Reduce labor costs by up to 40%</p>
              </div>
              <div className="flex flex-col items-center p-4">
                <Clock className="h-8 w-8 text-amber-600 mb-2" />
                <h3 className="font-semibold text-gray-900">Time Efficient</h3>
                <p className="text-sm text-gray-600">Up to 60% faster installation</p>
              </div>
              <div className="flex flex-col items-center p-4">
                <Eye className="h-8 w-8 text-amber-600 mb-2" />
                <h3 className="font-semibold text-gray-900">Premium Finish</h3>
                <p className="text-sm text-gray-600">Professional results every time</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
