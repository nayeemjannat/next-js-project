"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

export default function AvailabilityPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 11, 1))

  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const days = Array.from({ length: daysInMonth(currentDate) }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: firstDayOfMonth(currentDate) }, (_, i) => i)

  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" })

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">Availability</h1>
      <p className="text-muted-foreground mb-8">Set your working hours and availability</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{monthName}</h2>
                <div className="flex gap-2">
                  <Button size="icon" variant="outline" onClick={handlePrevMonth}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="outline" onClick={handleNextMonth}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center text-xs font-semibold text-muted-foreground p-2">
                    {day}
                  </div>
                ))}
                {emptyDays.map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {days.map((day) => (
                  <button
                    key={day}
                    className={`p-2 rounded-lg text-center text-sm font-medium transition-colors ${
                      day % 2 === 0 ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Working Hours */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Working Hours</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                <div key={day} className="space-y-2">
                  <label className="text-sm font-medium">{day}</label>
                  <div className="flex gap-2">
                    <input
                      type="time"
                      defaultValue="09:00"
                      className="flex-1 px-2 py-1 border border-border rounded text-sm"
                    />
                    <span className="text-muted-foreground px-2 py-1">-</span>
                    <input
                      type="time"
                      defaultValue="17:00"
                      className="flex-1 px-2 py-1 border border-border rounded text-sm"
                    />
                  </div>
                </div>
              ))}
              <Button className="w-full bg-primary hover:bg-primary/90 mt-4">Save Changes</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
