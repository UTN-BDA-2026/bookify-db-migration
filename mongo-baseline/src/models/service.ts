import mongoose, { Schema } from "mongoose";

const availableAppointmentSchema = new mongoose.Schema({
  datetime: { type: Date, required: true },
  capacity: { type: Number, required: true, min: 1 },
  taken: { type: Number, required: true, min: 0 }
});

const serviceSchema = new Schema({
  serviceKey: { type: String, required: true, unique: true, index: true },
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  title: { type: String, required: true },
  capacityPerShift: { type: Number, default: 1 },
  description: { type: String },
  duration: { type: Number, required: true },
  price: { type: Number },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  availableAppointments: [availableAppointmentSchema],
  scheduledAppointments: [{ type: Date, default: [] }],
  signPrice: { type: Number, default: 0 }
});

export const ServiceModel = mongoose.model("Service", serviceSchema);
