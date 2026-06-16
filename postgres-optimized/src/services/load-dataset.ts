import { prisma } from "./prisma.js";
import type { BookifyDataset } from "../types/dataset.js";

export async function loadDatasetIntoPostgres(dataset: BookifyDataset): Promise<void> {
  await prisma.appointment.deleteMany();
  await prisma.serviceSlot.deleteMany();
  await prisma.service.deleteMany();
  await prisma.company.deleteMany();

  await prisma.company.createMany({
    data: dataset.companies.map((company) => ({
      id: company.id,
      companyCode: company.companyCode,
      name: company.name,
      email: company.email,
      passwordHash: company.passwordHash,
      city: company.city,
      street: company.street,
      number: company.number,
      phone: company.phone,
      role: company.role,
      createdAt: new Date(company.createdAt),
      updatedAt: new Date(company.updatedAt)
    }))
  });

  await prisma.service.createMany({
    data: dataset.services.map((service) => ({
      id: service.id,
      companyId: service.companyId,
      title: service.title,
      capacityPerShift: service.capacityPerShift,
      description: service.description,
      duration: service.duration,
      price: service.price,
      signPrice: service.signPrice,
      createdAt: new Date(service.createdAt),
      updatedAt: new Date(service.updatedAt)
    }))
  });

  await prisma.serviceSlot.createMany({
    data: dataset.slots.map((slot) => ({
      id: slot.id,
      serviceId: slot.serviceId,
      companyId: slot.companyId,
      startsAt: new Date(slot.datetime),
      capacity: slot.capacity,
      reserved: slot.reserved
    }))
  });

  const servicesById = new Map(dataset.services.map((service) => [service.id, service]));
  await prisma.appointment.createMany({
    data: dataset.appointments.map((appointment) => {
      const service = servicesById.get(appointment.serviceId);
      if (!service) {
        throw new Error(`Missing service for appointment ${appointment.id}`);
      }

      return {
        id: appointment.id,
        companyId: appointment.companyId,
        serviceId: appointment.serviceId,
        slotId: appointment.slotId,
        name: appointment.name,
        lastName: appointment.lastName,
        email: appointment.email,
        dni: appointment.dni,
        phone: appointment.phone,
        date: new Date(appointment.date),
        paymentId: appointment.paymentId,
        status: appointment.status,
        serviceTitleSnapshot: service.title,
        serviceDurationSnapshot: service.duration,
        servicePriceSnapshot: service.price,
        createdAt: new Date(appointment.createdAt),
        updatedAt: new Date(appointment.updatedAt)
      };
    })
  });
}
