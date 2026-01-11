import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFacility extends Document {
  facilityId: string;
  name: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  phone?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FacilitySchema = new Schema<IFacility>(
  {
    facilityId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    province: {
      type: String,
      required: true,
    },
    postalCode: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Facility: Model<IFacility> =
  mongoose.models.Facility || mongoose.model<IFacility>("Facility", FacilitySchema);
