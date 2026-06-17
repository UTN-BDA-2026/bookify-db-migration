import { randomUUID } from "node:crypto";
import { AppointmentModel } from "../models/appointment.js";
import { CompanyModel } from "../models/company.js";
import { ServiceModel } from "../models/service.js";

export async function reserveAppointmentMongo(input: {
  companyKey: string;
  serviceKey: string;
  slotDate: Date;
  customerIndex: number;
}): Promise<string> {
  const service = await ServiceModel.findOne({ serviceKey: input.serviceKey }).lean();
  const company = await CompanyModel.findOne({ companyKey: input.companyKey }).lean();

  if (!service || !company) {
    throw new Error("Service or company not found");
  }

  const matchingSlot = service.availableAppointments.find(
    (appointment) => appointment.datetime.getTime() === input.slotDate.getTime()
  );

  if (!matchingSlot) {
    throw new Error("Slot not available");
  }

  const appointmentDocument = await new AppointmentModel({
    appointmentKey: `bench-appointment-${randomUUID()}`,
    companyKey: input.companyKey,
    serviceKey: input.serviceKey,
    slotKey: `${input.serviceKey}-${input.slotDate.toISOString()}`,
    companyId: company._id,
    serviceId: service._id,
    name: `Bench${input.customerIndex}`,
    lastName: "Customer",
    email: `bench${input.customerIndex}@example.com`,
    dni: `${40000000 + input.customerIndex}`,
    phone: `549261${String(input.customerIndex).padStart(7, "0")}`,
    date: input.slotDate,
    paymentId: null,
    status: "scheduled",
    createdAt: new Date(),
    updateAt: new Date()
  }).save();

  const nextTaken = matchingSlot.taken + 1;
  if (nextTaken >= matchingSlot.capacity) {
    await ServiceModel.findOneAndUpdate(
      { serviceKey: input.serviceKey },
      {
        $pull: { availableAppointments: { datetime: input.slotDate } },
        $push: { scheduledAppointments: input.slotDate }
      }
    );
  } else {
    await ServiceModel.findOneAndUpdate(
      { serviceKey: input.serviceKey, "availableAppointments.datetime": input.slotDate },
      {
        $push: { scheduledAppointments: input.slotDate },
        $inc: { "availableAppointments.$.taken": 1 }
      }
    );
  }

  await CompanyModel.findOneAndUpdate(
    { companyKey: input.companyKey },
    { $push: { scheduledAppointments: appointmentDocument._id } }
  );

  return appointmentDocument.appointmentKey;
}

export async function cancelAppointmentMongo(appointmentKey: string): Promise<void> {
  const appointment = await AppointmentModel.findOne({ appointmentKey }).lean();
  if (!appointment) {
    throw new Error("Appointment not found");
  }

  const service = await ServiceModel.findById(appointment.serviceId).lean();
  if (!service) {
    throw new Error("Service not found");
  }

  const scheduledAppointments = service.scheduledAppointments.filter(
    (date) => date.getTime() !== appointment.date.getTime()
  );

  await ServiceModel.findByIdAndUpdate(appointment.serviceId, {
    $set: { scheduledAppointments }
  });

  const availableEntry = service.availableAppointments.find(
    (entry) => entry.datetime.getTime() === appointment.date.getTime()
  );

  if (availableEntry) {
    await ServiceModel.findOneAndUpdate(
      { _id: appointment.serviceId, "availableAppointments.datetime": appointment.date },
      { $inc: { "availableAppointments.$.taken": -1 } }
    );
  } else {
    const remainingAtSameDate = scheduledAppointments.filter(
      (date) => date.getTime() === appointment.date.getTime()
    ).length;
    await ServiceModel.findByIdAndUpdate(appointment.serviceId, {
      $push: {
        availableAppointments: {
          datetime: appointment.date,
          capacity: service.capacityPerShift,
          taken: Math.max(0, remainingAtSameDate)
        }
      }
    });
  }

  await CompanyModel.findByIdAndUpdate(appointment.companyId, {
    $pull: { scheduledAppointments: appointment._id }
  });

  await AppointmentModel.deleteOne({ _id: appointment._id });
}
