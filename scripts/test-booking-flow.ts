const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function testWebhook(functionName: string, args: Record<string, unknown> = {}) {
  const response = await fetch(`${BASE_URL}/api/vapi/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: {
        type: "tool-calls",
        toolCalls: [
          {
            id: `test-${Date.now()}`,
            type: "function",
            function: {
              name: functionName,
              arguments: args,
            },
          },
        ],
      },
    }),
  });
  return response.json();
}

async function main() {
  console.log("=== Testing Booking Flow ===\n");

  // Step 1: Get facilities
  console.log("1. Getting facilities...");
  const facilitiesResult = await testWebhook("getFacilities");
  console.log("Facilities:", JSON.stringify(facilitiesResult, null, 2));

  const facilities = facilitiesResult.results?.[0]?.result?.facilities;
  if (!facilities || facilities.length === 0) {
    console.error("No facilities found!");
    return;
  }

  const facilityId = facilities[0].id;
  console.log(`\nUsing facility: ${facilities[0].name} (${facilityId})\n`);

  // Step 2: Check availability
  const testDate = new Date();
  testDate.setDate(testDate.getDate() + 1); // Tomorrow
  const dateStr = testDate.toISOString().split("T")[0];

  console.log(`2. Checking availability for ${dateStr}...`);
  const availabilityResult = await testWebhook("checkAvailability", {
    facilityId,
    date: dateStr,
  });
  console.log("Availability:", JSON.stringify(availabilityResult, null, 2));

  const availableSlots = availabilityResult.results?.[0]?.result?.availability?.[0]?.availableSlots;
  if (!availableSlots || availableSlots.length === 0) {
    console.error("No available slots!");
    return;
  }

  const timeSlot = availableSlots[0];
  console.log(`\nUsing time slot: ${timeSlot}\n`);

  // Step 3: Book appointment (omit bookingType to let schema default apply)
  console.log("3. Booking appointment...");
  const bookingResult = await testWebhook("bookAppointment", {
    facilityId,
    date: dateStr,
    timeSlot,
    customerName: "Test User",
    customerPhone: "613-555-1234",
    customerEmail: "test@example.com",
  });
  console.log("Booking result:", JSON.stringify(bookingResult, null, 2));

  console.log("\n=== Booking Flow Complete ===");
}

main().catch(console.error);
