import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";
import { Facility } from "@/models/Facility";

const TIME_SLOTS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00", "22:00",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    // Handle tool-calls message type (Vapi's format for function calls)
    if (message?.type === "tool-calls") {
      const toolCalls = message.toolCalls || message.toolCallList || [];
      const results = [];

      for (const toolCall of toolCalls) {
        const functionName = toolCall.function?.name;
        const args = toolCall.function?.arguments;
        const parameters = typeof args === "string" ? JSON.parse(args || "{}") : args || {};
        console.log(`[Vapi] ${functionName}`, parameters);

        let result;
        try {
          switch (functionName) {
            case "checkAvailability":
              result = await handleCheckAvailabilityResult(parameters);
              break;
            case "bookAppointment":
              result = await handleBookAppointmentResult(parameters);
              break;
            case "cancelAppointment":
              result = await handleCancelAppointmentResult(parameters);
              break;
            case "getFacilities":
              result = await handleGetFacilitiesResult();
              break;
            default:
              result = { error: "Unknown function" };
          }
        } catch (err) {
          console.error(`[Vapi] ${functionName} error:`, err);
          result = { error: `${functionName} failed: ${err instanceof Error ? err.message : "Unknown error"}` };
        }

        results.push({
          toolCallId: toolCall.id,
          result: result,
        });
      }

      return NextResponse.json({ results });
    }

    // Legacy format: function-call
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
          return await handleGetFacilities();

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

async function handleGetFacilities() {
  await connectToDatabase();

  const facilities = await Facility.find({ isActive: true })
    .select("facilityId name address city province postalCode")
    .sort({ name: 1 });

  return NextResponse.json({
    result: {
      facilities: facilities.map((f, index) => ({
        number: index + 1,
        id: f.facilityId,
        name: f.name,
        address: `${f.address}, ${f.city}, ${f.province} ${f.postalCode}`,
      })),
      instructions: "Present facilities to user by their number (1, 2, 3, etc.) and name. When user selects a number, use the corresponding facility id for booking.",
    },
  });
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

  const facilityQuery: Record<string, unknown> = { isActive: true };
  if (facilityId) {
    facilityQuery.facilityId = facilityId;
  }
  const facilities = await Facility.find(facilityQuery);

  const availability = facilities.map((facility) => {
    const booked = bookedMap.get(facility.facilityId) || new Set();
    const availableSlots = TIME_SLOTS.filter((slot) => !booked.has(slot));
    return {
      facility: {
        id: facility.facilityId,
        name: facility.name,
        address: `${facility.address}, ${facility.city}, ${facility.province} ${facility.postalCode}`,
      },
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
  customerEmail: string;
  bookingType?: string;
  duration?: number;
}) {
  await connectToDatabase();

  const { facilityId, date, timeSlot, customerName, customerPhone, customerEmail, bookingType, duration } =
    params;

  const facility = await Facility.findOne({ facilityId, isActive: true });
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
    customerEmail,
    bookingType: bookingType || "practice",
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
        confirmationMessage: `Your ice time at ${facility.name} on ${date} at ${timeSlot} has been confirmed. A confirmation email will be sent to ${customerEmail}. See you at the rink!`,
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

// Helper functions for tool-calls format (return plain objects)
async function handleGetFacilitiesResult() {
  await connectToDatabase();

  const facilities = await Facility.find({ isActive: true })
    .select("facilityId name address city province postalCode")
    .sort({ name: 1 });

  return {
    facilities: facilities.map((f, index) => ({
      number: index + 1,
      id: f.facilityId,
      name: f.name,
      address: `${f.address}, ${f.city}, ${f.province} ${f.postalCode}`,
    })),
    instructions: "Present facilities to user by their number (1, 2, 3, etc.) and name. When user selects a number, use the corresponding facility id for booking.",
  };
}

async function handleCheckAvailabilityResult(params: {
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

  const facilityQuery: Record<string, unknown> = { isActive: true };
  if (facilityId) {
    facilityQuery.facilityId = facilityId;
  }
  const facilities = await Facility.find(facilityQuery);

  const availability = facilities.map((facility) => {
    const booked = bookedMap.get(facility.facilityId) || new Set();
    const availableSlots = TIME_SLOTS.filter((slot) => !booked.has(slot));
    return {
      facility: {
        id: facility.facilityId,
        name: facility.name,
        address: `${facility.address}, ${facility.city}, ${facility.province} ${facility.postalCode}`,
      },
      availableSlots,
    };
  });

  return { date, availability };
}

async function handleBookAppointmentResult(params: {
  facilityId: string;
  date: string;
  timeSlot: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  bookingType?: string;
  duration?: number;
}) {
  await connectToDatabase();

  const { facilityId, date, timeSlot, customerName, customerPhone, customerEmail, bookingType, duration } =
    params;

  const facility = await Facility.findOne({ facilityId, isActive: true });
  if (!facility) {
    return { success: false, error: "Facility not found" };
  }

  const existingBooking = await Booking.findOne({
    facilityId,
    date: new Date(date),
    timeSlot,
    status: { $ne: "cancelled" },
  });

  if (existingBooking) {
    return { success: false, error: "This time slot is no longer available" };
  }

  // Only include bookingType if it's valid, otherwise let schema default handle it
  const bookingData: Record<string, unknown> = {
    facilityId,
    facilityName: facility.name,
    date: new Date(date),
    timeSlot,
    duration: duration || 60,
    customerName,
    customerPhone,
    customerEmail,
    status: "confirmed",
  };

  if (bookingType === "practice" || bookingType === "game") {
    bookingData.bookingType = bookingType;
  }

  const booking = await Booking.create(bookingData);

  return {
    success: true,
    booking: {
      id: booking._id,
      facilityName: facility.name,
      date,
      timeSlot,
      confirmationMessage: `Your ice time at ${facility.name} on ${date} at ${timeSlot} has been confirmed. A confirmation email will be sent to ${customerEmail}. See you at the rink!`,
    },
  };
}

async function handleCancelAppointmentResult(params: { bookingId: string }) {
  await connectToDatabase();

  const { bookingId } = params;

  const booking = await Booking.findByIdAndUpdate(
    bookingId,
    { status: "cancelled" },
    { new: true }
  );

  if (!booking) {
    return { success: false, error: "Booking not found" };
  }

  return { success: true, message: "Your booking has been cancelled successfully." };
}
