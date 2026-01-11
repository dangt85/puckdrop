import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date");
    const facilityId = searchParams.get("facilityId");

    const query: Record<string, unknown> = {};

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    if (facilityId) {
      query.facilityId = facilityId;
    }

    const bookings = await Booking.find(query).sort({ date: 1, timeSlot: 1 });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();

    const {
      facilityId,
      facilityName,
      date,
      timeSlot,
      duration,
      customerName,
      customerPhone,
      customerEmail,
      bookingType,
      notes,
    } = body;

    if (!facilityId || !facilityName || !date || !timeSlot || !customerName || !customerPhone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const existingBooking = await Booking.findOne({
      facilityId,
      date: new Date(date),
      timeSlot,
      status: { $ne: "cancelled" },
    });

    if (existingBooking) {
      return NextResponse.json(
        { error: "This time slot is already booked" },
        { status: 409 }
      );
    }

    const booking = await Booking.create({
      facilityId,
      facilityName,
      date: new Date(date),
      timeSlot,
      duration: duration || 60,
      customerName,
      customerPhone,
      customerEmail,
      bookingType: bookingType || "practice",
      status: "confirmed",
      notes,
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
