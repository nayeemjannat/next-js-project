"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useAuth } from "@/components/auth-context"
import { toast } from "sonner"

interface WorkingHours {
  [key: string]: {
    start: string
    end: string
    enabled: boolean
  }
}

export default function AvailabilityPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [workingHours, setWorkingHours] = useState<WorkingHours>({
    monday: { start: "09:00", end: "17:00", enabled: true },
    tuesday: { start: "09:00", end: "17:00", enabled: true },
    wednesday: { start: "09:00", end: "17:00", enabled: true },
    thursday: { start: "09:00", end: "17:00", enabled: true },
    friday: { start: "09:00", end: "17:00", enabled: true },
    saturday: { start: "09:00", end: "17:00", enabled: false },
    sunday: { start: "09:00", end: "17:00", enabled: false },
  })
  const [blockedDates, setBlockedDates] = useState<string[]>([])
  const [blockedTimeSlots, setBlockedTimeSlots] = useState<{ date: string; time: string }[]>([])
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [bookedSlots, setBookedSlots] = useState<string[]>([])

  useEffect(() => {
    if (user && user.userType === "provider") {
      fetchSchedule()
    }
  }, [user])

  useEffect(() => {
    if (selectedDate && user && user.userType === "provider") {
      fetchTimeSlotsForDate(selectedDate)
    } else if (selectedDate && !user) {
      // If user is not available, clear slots
      setAvailableSlots([])
    }
  }, [selectedDate, user])

  const fetchSchedule = async () => {
    if (!user) return

    try {
      setLoading(true)
      const response = await fetch(`/api/provider/availability?providerId=${user.id}`)
      const data = await response.json()

      if (response.ok && data.schedule) {
        setWorkingHours(data.schedule.workingHours)
        setBlockedDates(data.schedule.blockedDates || [])
        setBlockedTimeSlots(data.schedule.blockedTimeSlots || [])
      }
    } catch (error) {
      console.error("Error fetching schedule:", error)
      toast.error("Failed to load schedule")
    } finally {
      setLoading(false)
    }
  }

  const fetchTimeSlotsForDate = async (date: string) => {
    if (!user || !date) {
      setAvailableSlots([])
      return
    }

    setLoadingSlots(true)
    try {
      const response = await fetch(`/api/provider/${user.id}/availability?date=${date}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch availability: ${response.status}`)
      }
      
      const data = await response.json()

      if (data.available) {
        setAvailableSlots(data.availableSlots || [])
        // Store booked slots if provided by API
        setBookedSlots(data.bookedSlots || [])
      } else {
        setAvailableSlots([])
        setBookedSlots([])
      }
    } catch (error) {
      console.error("Error fetching time slots:", error)
      setAvailableSlots([])
      // Don't show error toast for availability fetch - it's expected for some dates
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleSave = async () => {
    if (!user) {
      toast.error("Please log in to save your schedule")
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/provider/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: user.id,
          workingHours,
          blockedDates,
          blockedTimeSlots,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Schedule saved successfully!")
      } else {
        throw new Error(data.error || "Failed to save schedule")
      }
    } catch (error) {
      console.error("Error saving schedule:", error)
      toast.error("Failed to save schedule")
    } finally {
      setSaving(false)
    }
  }

  const updateWorkingHours = (day: string, field: "start" | "end" | "enabled", value: string | boolean) => {
    setWorkingHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }))
  }

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

  const toggleBlockedDate = (dateStr: string) => {
    setBlockedDates((prev) => {
      if (prev.includes(dateStr)) {
        return prev.filter((d) => d !== dateStr)
      } else {
        return [...prev, dateStr]
      }
    })
  }

  const toggleBlockedTimeSlot = (date: string, time: string) => {
    // Prevent action if user is not available
    if (!user || user.userType !== "provider") {
      console.error("User not available or not a provider")
      return
    }

    if (!date || !time) {
      console.error("Invalid date or time provided")
      return
    }

    // Check if slot is already booked - don't allow blocking booked slots
    if (bookedSlots.includes(time)) {
      toast.error("This time slot is already booked and cannot be blocked")
      return
    }
    
    try {
      setBlockedTimeSlots((prev) => {
        const slotKey = `${date}|${time}`
        const existing = prev.find((slot) => `${slot.date}|${slot.time}` === slotKey)
        if (existing) {
          return prev.filter((slot) => `${slot.date}|${slot.time}` !== slotKey)
        } else {
          return [...prev, { date, time }]
        }
      })
    } catch (error) {
      console.error("Error toggling blocked time slot:", error)
      toast.error("Failed to update time slot")
    }
  }

  const isTimeSlotBlocked = (date: string, time: string) => {
    return blockedTimeSlots.some((slot) => slot.date === date && slot.time === time)
  }

  const getDateString = (day: number) => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth() + 1
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  }

  const isDateBlocked = (day: number) => {
    const dateStr = getDateString(day)
    return blockedDates.includes(dateStr)
  }

  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
  const displayDayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

  if (loading || authLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading schedule...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user || user.userType !== "provider") {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Please log in as a provider to access this page.</p>
          </div>
        </div>
      </div>
    )
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
                {days.map((day) => {
                  const dateStr = getDateString(day)
                  const isBlocked = isDateBlocked(day)
                  const isSelected = selectedDate === dateStr
                  return (
                    <div key={day} className="relative">
                      <button
                        onClick={() => {
                          setSelectedDate(dateStr)
                          // If date is blocked and clicked, allow unblocking via the button below
                        }}
                        className={`p-2 rounded-lg text-center text-sm font-medium transition-colors w-full relative ${
                          isSelected
                            ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1"
                            : isBlocked
                            ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 ring-2 ring-destructive/50"
                            : "bg-secondary hover:bg-secondary/80"
                        }`}
                        title={
                          isSelected
                            ? "Selected - Use buttons below to manage"
                            : isBlocked
                            ? "Blocked - Use 'Unblock Date' button below to unblock"
                            : "Click to select and manage time slots"
                        }
                      >
                        {day}
                        {isBlocked && (
                          <span className="absolute top-0 right-0 w-2 h-2 bg-white rounded-full border border-destructive" />
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Click on dates to select and manage time slots.
                  </p>
                  {blockedDates.length > 0 && (
                    <div className="text-xs text-muted-foreground mb-2">
                      <span className="font-medium">Blocked dates ({blockedDates.length}):</span>{" "}
                      {blockedDates.slice(0, 3).map((date) => new Date(date).toLocaleDateString()).join(", ")}
                      {blockedDates.length > 3 && ` +${blockedDates.length - 3} more`}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (selectedDate) {
                        toggleBlockedDate(selectedDate)
                        toast.success(
                          blockedDates.includes(selectedDate)
                            ? "Date unblocked successfully"
                            : "Date blocked successfully"
                        )
                      }
                    }}
                    disabled={!selectedDate}
                    className={selectedDate && blockedDates.includes(selectedDate) ? "border-destructive text-destructive hover:bg-destructive/10" : ""}
                  >
                    {selectedDate && blockedDates.includes(selectedDate)
                      ? "✓ Unblock Date"
                      : "Block Date"}
                  </Button>
                  {blockedDates.length > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Are you sure you want to unblock all ${blockedDates.length} blocked dates?`)) {
                          setBlockedDates([])
                          toast.success("All dates unblocked")
                        }
                      }}
                      className="text-xs"
                    >
                      Unblock All
                    </Button>
                  )}
                </div>
              </div>
              {selectedDate && (
                <div className="mt-4 pt-4 border-t relative">
                  <Label className="text-sm font-medium mb-3 block relative z-0">
                    Time Slots for {new Date(selectedDate).toLocaleDateString()}
                  </Label>
                  {loadingSlots ? (
                    <div className="text-sm text-muted-foreground">Loading time slots...</div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1 relative" style={{ zIndex: 10 }}>
                      {availableSlots.map((slot, index) => {
                        const isBlocked = isTimeSlotBlocked(selectedDate, slot)
                        const isBooked = bookedSlots.includes(slot)
                        const isDisabled = isBooked || !user
                        
                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={isDisabled}
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              
                              // Double check user is available before proceeding
                              if (!user || user.userType !== "provider") {
                                console.error("User not available")
                                return
                              }

                              if (isBooked) {
                                toast.error("This time slot is already booked")
                                return
                              }

                              try {
                                toggleBlockedTimeSlot(selectedDate, slot)
                              } catch (error) {
                                console.error("Error toggling time slot:", error)
                                toast.error("Failed to update time slot")
                              }
                            }}
                            className={`px-2 py-1 text-xs rounded-md border transition-colors relative z-20 ${
                              isDisabled
                                ? "bg-muted text-muted-foreground border-muted cursor-not-allowed opacity-50"
                                : isBlocked
                                ? "bg-destructive text-destructive-foreground border-destructive hover:bg-destructive/90 cursor-pointer"
                                : "bg-background hover:bg-secondary border-border cursor-pointer hover:border-primary/50 active:scale-95"
                            }`}
                            style={{ 
                              pointerEvents: isDisabled ? 'none' : 'auto',
                              position: 'relative',
                              zIndex: 20
                            }}
                            title={isBooked ? "Already booked" : isBlocked ? "Click to unblock" : "Click to block"}
                          >
                            {slot}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No available time slots for this date
                    </div>
                  )}
                </div>
              )}
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
              {dayNames.map((day, index) => (
                <div key={day} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">{displayDayNames[index]}</Label>
                    <Switch
                      checked={workingHours[day]?.enabled || false}
                      onCheckedChange={(checked) => updateWorkingHours(day, "enabled", checked)}
                    />
                  </div>
                  {workingHours[day]?.enabled && (
                    <div className="flex gap-2 items-center">
                      <Input
                        type="time"
                        value={workingHours[day]?.start || "09:00"}
                        onChange={(e) => updateWorkingHours(day, "start", e.target.value)}
                        className="flex-1 text-sm"
                      />
                      <span className="text-muted-foreground">-</span>
                      <Input
                        type="time"
                        value={workingHours[day]?.end || "17:00"}
                        onChange={(e) => updateWorkingHours(day, "end", e.target.value)}
                        className="flex-1 text-sm"
                      />
                    </div>
                  )}
                </div>
              ))}
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-primary hover:bg-primary/90 mt-4"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
