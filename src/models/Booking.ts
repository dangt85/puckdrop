import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBooking extends Document {
  facilityId: string;
  facilityName: string;
  date: Date;
  timeSlot: string;
  duration: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  bookingType: "ice_time" | "lesson" | "team_event";
  status: "pending" | "confirmed" | "cancelled";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    facilityId: {
      type: String,
      required: true,
    },
    facilityName: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    timeSlot: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
      default: 60,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerPhone: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
    },
    bookingType: {
      type: String,
      enum: ["ice_time", "lesson", "team_event"],
      default: "ice_time",
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

BookingSchema.index({ date: 1, facilityId: 1, timeSlot: 1 });

export const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>("Booking", BookingSchema);
