import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";

const FACILITIES = [
  { id: "rink-1", name: "Central Ice Arena", address: "123 Main St" },
  { id: "rink-2", name: "Northside Ice Complex", address: "456 North Ave" },
  { id: "rink-3", name: "Southgate Skating Center", address: "789 South Blvd" },
];

const TIME_SLOTS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00", "22:00",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    if (message?.type === "function-call") {
      const { functionCall } = message;

      switch (functionCall.name) {
        case "checkAvailability":
          return await handleCheckAvailability(functionCall.parameters);

        case "bookAppointment":
          return await handleBookAppointment(functionCall.parameters);

        case "cancelAppointment":
          return await handleCancelAppointment(functionCall.parameters);

        case "getFacilities":
          return NextResponse.json({
            result: {
              facilities: FACILITIES,
            },
          });

        default:
          return NextResponse.json({
            result: { error: "Unknown function" },
          });
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Vapi webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleCheckAvailability(params: {
  facilityId?: string;
  date: string;
}) {
  await connectToDatabase();

  const { facilityId, date } = params;

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const query: Record<string, unknown> = {
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $ne: "cancelled" },
  };

  if (facilityId) {
    query.facilityId = facilityId;
  }

  const bookedSlots = await Booking.find(query).select("timeSlot facilityId");

  const bookedMap = new Map<string, Set<string>>();
  bookedSlots.forEach((booking) => {
    if (!bookedMap.has(booking.facilityId)) {
      bookedMap.set(booking.facilityId, new Set());
    }
    bookedMap.get(booking.facilityId)!.add(booking.timeSlot);
  });

  const availability = FACILITIES.filter(
    (f) => !facilityId || f.id === facilityId
  ).map((facility) => {
    const booked = bookedMap.get(facility.id) || new Set();
    const availableSlots = TIME_SLOTS.filter((slot) => !booked.has(slot));
    return {
      facility,
      availableSlots,
    };
  });

  return NextResponse.json({
    result: {
      date,
      availability,
    },
  });
}

async function handleBookAppointment(params: {
  facilityId: string;
  date: string;
  timeSlot: string;
  customerName: string;
  customerPhone: string;
  bookingType?: string;
  duration?: number;
}) {
  await connectToDatabase();

  const { facilityId, date, timeSlot, customerName, customerPhone, bookingType, duration } =
    params;

  const facility = FACILITIES.find((f) => f.id === facilityId);
  if (!facility) {
    return NextResponse.json({
      result: { success: false, error: "Facility not found" },
    });
  }

  const existingBooking = await Booking.findOne({
    facilityId,
    date: new Date(date),
    timeSlot,
    status: { $ne: "cancelled" },
  });

  if (existingBooking) {
    return NextResponse.json({
      result: {
        success: false,
        error: "This time slot is no longer available",
      },
    });
  }

  const booking = await Booking.create({
    facilityId,
    facilityName: facility.name,
    date: new Date(date),
    timeSlot,
    duration: duration || 60,
    customerName,
    customerPhone,
    bookingType: bookingType || "ice_time",
    status: "confirmed",
  });

  return NextResponse.json({
    result: {
      success: true,
      booking: {
        id: booking._id,
        facilityName: facility.name,
        date,
        timeSlot,
        confirmationMessage: `Your ice time at ${facility.name} on ${date} at ${timeSlot} has been confirmed. See you at the rink!`,
      },
    },
  });
}

async function handleCancelAppointment(params: { bookingId: string }) {
  await connectToDatabase();

  const { bookingId } = params;

  const booking = await Booking.findByIdAndUpdate(
    bookingId,
    { status: "cancelled" },
    { new: true }
  );

  if (!booking) {
    return NextResponse.json({
      result: { success: false, error: "Booking not found" },
    });
  }

  return NextResponse.json({
    result: {
      success: true,
      message: "Your booking has been cancelled successfully.",
    },
  });
}
