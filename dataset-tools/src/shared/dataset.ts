export interface CompanySeed {
  id: string;
  companyCode: string;
  name: string;
  email: string;
  passwordHash: string;
  city: string;
  street: string;
  number: string;
  phone: string;
  role: "admin" | "user";
  connectedWithMP: boolean;
  mpAccessToken: string;
  mpRefreshToken: string;
  mpUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceSeed {
  id: string;
  companyId: string;
  title: string;
  capacityPerShift: number;
  description: string;
  duration: number;
  price: number;
  signPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface SlotSeed {
  id: string;
  serviceId: string;
  companyId: string;
  datetime: string;
  capacity: number;
  reserved: number;
}

export interface AppointmentSeed {
  id: string;
  companyId: string;
  serviceId: string;
  slotId: string;
  name: string;
  lastName: string;
  email: string;
  dni: string;
  phone: string;
  date: string;
  paymentId: string | null;
  status: "scheduled" | "cancelled" | "completed";
  createdAt: string;
  updatedAt: string;
}

export interface DatasetSummary {
  companies: number;
  services: number;
  slots: number;
  appointments: number;
}

export interface BookifyDataset {
  meta: {
    seed: number;
    generatedAt: string;
    summary: DatasetSummary;
  };
  companies: CompanySeed[];
  services: ServiceSeed[];
  slots: SlotSeed[];
  appointments: AppointmentSeed[];
}
