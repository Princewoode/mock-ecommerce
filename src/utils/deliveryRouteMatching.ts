import { DeliveryDriverProfile, Order } from "@/types/models";

export type DriverMatchSuggestion = {
  driver: DeliveryDriverProfile;
  score: number;
  matchLabel: "Strong Match" | "Good Match" | "Possible Match" | "Manual Review";
  reasons: string[];
};

function normalize(value?: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function textIncludes(text: string | undefined, value: string | undefined) {
  const normalizedText = normalize(text);
  const normalizedValue = normalize(value);

  if (!normalizedText || !normalizedValue) {
    return false;
  }

  return normalizedText.includes(normalizedValue);
}

function vehicleMatchesAssignment(vehicleType: string, assignmentType: string) {
  const vehicle = normalize(vehicleType);
  const assignment = normalize(assignmentType);

  if (assignment.includes("inter")) {
    return (
      vehicle.includes("truck") ||
      vehicle.includes("van") ||
      vehicle.includes("bus") ||
      vehicle.includes("carrier") ||
      vehicle.includes("car")
    );
  }

  if (assignment.includes("final") || assignment.includes("intra")) {
    return (
      vehicle.includes("motorbike") ||
      vehicle.includes("car") ||
      vehicle.includes("van")
    );
  }

  if (assignment.includes("pickup")) {
    return (
      vehicle.includes("motorbike") ||
      vehicle.includes("car") ||
      vehicle.includes("van") ||
      vehicle.includes("truck")
    );
  }

  return true;
}

function getLabel(score: number): DriverMatchSuggestion["matchLabel"] {
  if (score >= 75) {
    return "Strong Match";
  }

  if (score >= 50) {
    return "Good Match";
  }

  if (score >= 25) {
    return "Possible Match";
  }

  return "Manual Review";
}

export function buildDriverMatchSuggestions({
  order,
  drivers,
  assignmentType,
  pickupCity,
  pickupRegion,
  dropoffCity,
  dropoffRegion,
}: {
  order: Order;
  drivers: DeliveryDriverProfile[];
  assignmentType: string;
  pickupCity?: string;
  pickupRegion?: string;
  dropoffCity?: string;
  dropoffRegion?: string;
}): DriverMatchSuggestion[] {
  const orderDropoffCity = dropoffCity || order.delivery?.city || "";
  const orderDropoffRegion = dropoffRegion || order.delivery?.region || "";
  const orderPickupCity = pickupCity || "";
  const orderPickupRegion = pickupRegion || "";

  return drivers
    .map((driver) => {
      let score = 0;
      const reasons: string[] = [];

      if (normalize(driver.city) === normalize(orderDropoffCity)) {
        score += 30;
        reasons.push(`Driver is based in ${driver.city}.`);
      }

      if (normalize(driver.region) === normalize(orderDropoffRegion)) {
        score += 20;
        reasons.push(`Driver covers ${driver.region}.`);
      }

      if (textIncludes(driver.intraCityZones, orderDropoffCity)) {
        score += 25;
        reasons.push(`Driver intra-city zones include ${orderDropoffCity}.`);
      }

      if (orderPickupCity && textIncludes(driver.intraCityZones, orderPickupCity)) {
        score += 10;
        reasons.push(`Driver can reach pickup city ${orderPickupCity}.`);
      }

      if (
        orderPickupCity &&
        orderDropoffCity &&
        textIncludes(driver.interCityRoutes, orderPickupCity) &&
        textIncludes(driver.interCityRoutes, orderDropoffCity)
      ) {
        score += 35;
        reasons.push(
          `Driver inter-city routes include ${orderPickupCity} and ${orderDropoffCity}.`
        );
      }

      if (
        orderPickupRegion &&
        orderDropoffRegion &&
        textIncludes(driver.interCityRoutes, orderPickupRegion) &&
        textIncludes(driver.interCityRoutes, orderDropoffRegion)
      ) {
        score += 20;
        reasons.push(
          `Driver route coverage mentions ${orderPickupRegion} and ${orderDropoffRegion}.`
        );
      }

      if (vehicleMatchesAssignment(driver.vehicleType, assignmentType)) {
        score += 10;
        reasons.push(`${driver.vehicleType} is suitable for ${assignmentType}.`);
      }

      if (driver.availability?.trim()) {
        score += 5;
        reasons.push(`Availability stated: ${driver.availability}.`);
      }

      const cappedScore = Math.min(score, 100);

      return {
        driver,
        score: cappedScore,
        matchLabel: getLabel(cappedScore),
        reasons:
          reasons.length > 0
            ? reasons
            : ["No obvious route match. Assign only after manual review."],
      };
    })
    .sort((a, b) => b.score - a.score);
}