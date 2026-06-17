import mongoose from "mongoose";
import { AppointmentModel } from "../models/appointment.js";
import { CompanyModel } from "../models/company.js";
import { ServiceModel } from "../models/service.js";
import type { BookifyDataset } from "../types/dataset.js";

export async function loadDatasetIntoMongo(dataset: BookifyDataset): Promise<void> {
  await Promise.all([
    AppointmentModel.deleteMany({}),
    ServiceModel.deleteMany({}),
    CompanyModel.deleteMany({})
  ]);

  const companyDocs = await CompanyModel.insertMany(
    dataset.companies.map((company) => ({
      companyKey: company.id,
      name: company.name,
      company_id: company.companyCode,
      email: company.email,
      password: company.passwordHash,
      city: company.city,
      street: company.street,
      number: company.number,
      phone: company.phone,
      role: company.role,
      services: [],
      scheduledAppointments: [],
      connectedWithMP: company.connectedWithMP,
      mp_access_token: company.mpAccessToken,
      mp_refresh_token: company.mpRefreshToken,
      mp_user_id: company.mpUserId,
      createdAt: new Date(company.createdAt),
      updatedAt: new Date(company.updatedAt)
    }))
  );

  const companyMap = new Map(dataset.companies.map((company, index) => [company.id, companyDocs[index]]));

  const serviceDocs = await ServiceModel.insertMany(
    dataset.services.map((service) => ({
      serviceKey: service.id,
      companyId: companyMap.get(service.companyId)?._id,
      title: service.title,
      capacityPerShift: service.capacityPerShift,
      description: service.description,
      duration: service.duration,
      price: service.price,
      signPrice: service.signPrice,
      createdAt: new Date(service.createdAt),
      updatedAt: new Date(service.updatedAt),
      availableAppointments: dataset.slots
        .filter((slot) => slot.serviceId === service.id && slot.reserved < slot.capacity)
        .map((slot) => ({
          datetime: new Date(slot.datetime),
          capacity: slot.capacity,
          taken: slot.reserved
        })),
      scheduledAppointments: dataset.appointments
        .filter((appointment) => appointment.serviceId === service.id)
        .map((appointment) => new Date(appointment.date))
    }))
  );

  const serviceMap = new Map(dataset.services.map((service, index) => [service.id, serviceDocs[index]]));
  const companyServicesMap = new Map<string, mongoose.Types.ObjectId[]>();

  for (const service of dataset.services) {
    const list = companyServicesMap.get(service.companyId) ?? [];
    list.push(serviceMap.get(service.id)!._id);
    companyServicesMap.set(service.companyId, list);
  }

  const appointmentDocs = await AppointmentModel.insertMany(
    dataset.appointments.map((appointment) => ({
      appointmentKey: appointment.id,
      companyKey: appointment.companyId,
      serviceKey: appointment.serviceId,
      slotKey: appointment.slotId,
      companyId: companyMap.get(appointment.companyId)?._id,
      serviceId: serviceMap.get(appointment.serviceId)?._id,
      name: appointment.name,
      lastName: appointment.lastName,
      email: appointment.email,
      dni: appointment.dni,
      phone: appointment.phone,
      date: new Date(appointment.date),
      paymentId: appointment.paymentId,
      status: appointment.status,
      createdAt: new Date(appointment.createdAt),
      updateAt: new Date(appointment.updatedAt)
    }))
  );

  const companyAppointmentsMap = new Map<string, mongoose.Types.ObjectId[]>();
  for (const appointment of appointmentDocs) {
    const companyKey = appointment.companyKey as string;
    const list = companyAppointmentsMap.get(companyKey) ?? [];
    list.push(appointment._id);
    companyAppointmentsMap.set(companyKey, list);
  }

  await Promise.all(
    dataset.companies.map((company) =>
      CompanyModel.updateOne(
        { companyKey: company.id },
        {
          $set: {
            services: companyServicesMap.get(company.id) ?? [],
            scheduledAppointments: companyAppointmentsMap.get(company.id) ?? []
          }
        }
      )
    )
  );
}

