import type { PrismaClient, Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";

export async function reserveAppointmentPostgres(
  client: PrismaClient,
  input: {
    companyId: string;
    serviceId: string;
    slotId: string;
    customerIndex: number;
  }
): Promise<string> {
  return client.$transaction(async (tx: Prisma.TransactionClient) => {
    const slotRows = await tx.$queryRaw<
      Array<{ id: string; capacity: number; reserved: number; starts_at: Date }>
    >`SELECT id, capacity, reserved, starts_at FROM service_slots WHERE id = ${input.slotId} FOR UPDATE`;

    const slot = slotRows[0];
    if (!slot) {
      throw new Error("Slot not found");
    }

    if (slot.reserved >= slot.capacity) {
      throw new Error("Slot at capacity");
    }

    const service = await tx.service.findUnique({
      where: { id: input.serviceId }
    });

    if (!service) {
      throw new Error("Service not found");
    }

    await tx.serviceSlot.update({
      where: { id: input.slotId },
      data: {
        reserved: { increment: 1 }
      }
    });

    const appointmentId = `bench-appointment-${randomUUID()}`;
    await tx.appointment.create({
      data: {
        id: appointmentId,
        companyId: input.companyId,
        serviceId: input.serviceId,
        slotId: input.slotId,
        name: `Bench${input.customerIndex}`,
        lastName: "Customer",
        email: `bench${input.customerIndex}@example.com`,
        dni: `${40000000 + input.customerIndex}`,
        phone: `549261${String(input.customerIndex).padStart(7, "0")}`,
        date: slot.starts_at,
        paymentId: null,
        status: "scheduled",
        serviceTitleSnapshot: service.title,
        serviceDurationSnapshot: service.duration,
        servicePriceSnapshot: service.price
      }
    });

    return appointmentId;
  });
}

export async function cancelAppointmentPostgres(
  client: PrismaClient,
  appointmentId: string
): Promise<void> {
  await client.$transaction(async (tx: Prisma.TransactionClient) => {
    const appointment = await tx.appointment.findUnique({
      where: { id: appointmentId }
    });

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    await tx.appointment.delete({
      where: { id: appointmentId }
    });

    await tx.serviceSlot.update({
      where: { id: appointment.slotId },
      data: {
        reserved: { decrement: 1 }
      }
    });
  });
}
