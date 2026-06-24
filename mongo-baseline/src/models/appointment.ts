import mongoose, { Schema } from "mongoose";

const appointmentSchema = new Schema({
  appointmentKey: { type: String, required: true, unique: true, index: true },
  companyKey: { type: String, required: true, index: true },
  serviceKey: { type: String, required: true, index: true },
  slotKey: { type: String, required: true, index: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true, index: true },
  name: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  dni: { type: String, required: true },
  phone: { type: String, required: true },
  date: { type: Date, required: true, index: true },
  paymentId: { type: String, default: null },
  status: {
    type: String,
    enum: ["scheduled", "cancelled", "completed"],
    default: "scheduled"
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

appointmentSchema.index({ companyId: 1, date: 1 });
appointmentSchema.index({ serviceId: 1, date: 1 });

export const AppointmentModel = mongoose.model("Appointment", appointmentSchema);

