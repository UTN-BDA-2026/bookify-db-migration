import type { DatasetScale } from "./dataset.js";

export const scaleConfig: Record<
  DatasetScale,
  {
    companies: number;
    servicesPerCompany: number;
    days: number;
    slotsPerDay: number;
    benchmarkIterations: number;
  }
> = {
  small: {
    companies: 4,
    servicesPerCompany: 3,
    days: 10,
    slotsPerDay: 6,
    benchmarkIterations: 10
  },
  medium: {
    companies: 12,
    servicesPerCompany: 6,
    days: 20,
    slotsPerDay: 8,
    benchmarkIterations: 25
  },
  large: {
    companies: 30,
    servicesPerCompany: 10,
    days: 30,
    slotsPerDay: 10,
    benchmarkIterations: 50
  }
};

