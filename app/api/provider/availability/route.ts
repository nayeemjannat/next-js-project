import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET /api/provider/availability?providerId=xxx - Get provider's schedule
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const providerId = searchParams.get("providerId")

    if (!providerId) {
      return NextResponse.json({ error: "Provider ID is required" }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { id: providerId },
    })

    if (!user || user.userType !== "provider") {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 })
    }

    let schedule = await db.providerSchedule.findUnique({
      where: { providerId: user.id },
    })

    // If no schedule exists, create a default one
    if (!schedule) {
      const defaultHours = {
        monday: { start: "09:00", end: "17:00", enabled: true },
        tuesday: { start: "09:00", end: "17:00", enabled: true },
        wednesday: { start: "09:00", end: "17:00", enabled: true },
        thursday: { start: "09:00", end: "17:00", enabled: true },
        friday: { start: "09:00", end: "17:00", enabled: true },
        saturday: { start: "09:00", end: "17:00", enabled: false },
        sunday: { start: "09:00", end: "17:00", enabled: false },
      }

      schedule = await db.providerSchedule.create({
        data: {
          providerId: user.id,
          workingHours: JSON.stringify(defaultHours),
          blockedDates: JSON.stringify([]),
          blockedTimeSlots: JSON.stringify([]),
        },
      })
    }

    return NextResponse.json({
      schedule: {
        id: schedule.id,
        workingHours: JSON.parse(schedule.workingHours),
        blockedDates: schedule.blockedDates ? JSON.parse(schedule.blockedDates) : [],
        blockedTimeSlots: schedule.blockedTimeSlots ? JSON.parse(schedule.blockedTimeSlots) : [],
      },
    })
  } catch (error) {
    console.error("Get availability error:", error)
    return NextResponse.json({ error: "Failed to get availability" }, { status: 500 })
  }
}

// POST /api/provider/availability - Create or update provider's schedule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { providerId, workingHours, blockedDates, blockedTimeSlots } = body

    if (!providerId) {
      return NextResponse.json({ error: "Provider ID is required" }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { id: providerId },
    })

    if (!user || user.userType !== "provider") {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 })
    }

    if (!workingHours) {
      return NextResponse.json({ error: "Working hours are required" }, { status: 400 })
    }

    // Validate working hours structure
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    for (const day of days) {
      if (workingHours[day] && workingHours[day].enabled) {
        if (!workingHours[day].start || !workingHours[day].end) {
          return NextResponse.json({ error: `Invalid hours for ${day}` }, { status: 400 })
        }
      }
    }

    // Upsert schedule
    const schedule = await db.providerSchedule.upsert({
      where: { providerId: user.id },
      create: {
        providerId: user.id,
        workingHours: JSON.stringify(workingHours),
        blockedDates: blockedDates ? JSON.stringify(blockedDates) : JSON.stringify([]),
        blockedTimeSlots: blockedTimeSlots ? JSON.stringify(blockedTimeSlots) : JSON.stringify([]),
      },
      update: {
        workingHours: JSON.stringify(workingHours),
        blockedDates: blockedDates ? JSON.stringify(blockedDates) : JSON.stringify([]),
        blockedTimeSlots: blockedTimeSlots ? JSON.stringify(blockedTimeSlots) : undefined,
      },
    })

    return NextResponse.json({
      schedule: {
        id: schedule.id,
        workingHours: JSON.parse(schedule.workingHours),
        blockedDates: schedule.blockedDates ? JSON.parse(schedule.blockedDates) : [],
        blockedTimeSlots: schedule.blockedTimeSlots ? JSON.parse(schedule.blockedTimeSlots) : [],
      },
    })
  } catch (error) {
    console.error("Update availability error:", error)
    return NextResponse.json({ error: "Failed to update availability" }, { status: 500 })
  }
}

