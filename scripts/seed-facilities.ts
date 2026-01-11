import mongoose from "mongoose";
import { config } from "dotenv";
import path from "path";

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI environment variable is not set");
  process.exit(1);
}

// Define the Facility schema inline to avoid import issues
const FacilitySchema = new mongoose.Schema(
  {
    facilityId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    province: { type: String, required: true },
    postalCode: { type: String, required: true },
    phone: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Facility =
  mongoose.models.Facility || mongoose.model("Facility", FacilitySchema);

const facilities = [
  {
    facilityId: "minto-barrhaven",
    name: "Minto Recreation Complex - Barrhaven",
    address: "3500 Cambrian Rd",
    city: "Nepean",
    province: "ON",
    postalCode: "K2J 0V1",
    phone: "(613) 580-2424",
    isActive: true,
  },
  {
    facilityId: "bell-sensplex",
    name: "Bell Sensplex",
    address: "1565 Maple Grove Rd",
    city: "Nepean",
    province: "ON",
    postalCode: "K2V 1A3",
    phone: "(613) 599-0680",
    isActive: true,
  },
  {
    facilityId: "walter-baker",
    name: "Walter Baker Sports Centre",
    address: "100 Malvern Dr",
    city: "Nepean",
    province: "ON",
    postalCode: "K2J 2G5",
    phone: "(613) 580-2424",
    isActive: true,
  },
  {
    facilityId: "jim-durrell",
    name: "Jim Durrell Recreation Centre",
    address: "1265 Walkley Rd",
    city: "Ottawa",
    province: "ON",
    postalCode: "K1V 2P4",
    phone: "(613) 247-4846",
    isActive: true,
  },
];

async function seed() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI!);
    console.log("Connected to MongoDB");

    console.log("Seeding facilities...");

    for (const facility of facilities) {
      await Facility.findOneAndUpdate(
        { facilityId: facility.facilityId },
        facility,
        { upsert: true, new: true }
      );
      console.log(`  - ${facility.name}`);
    }

    console.log("\nFacilities seeded successfully!");

    const count = await Facility.countDocuments();
    console.log(`Total facilities in database: ${count}`);
  } catch (error) {
    console.error("Error seeding facilities:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

seed();
