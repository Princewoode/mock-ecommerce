export const ghanaRegions = [
  "Ahafo",
  "Ashanti",
  "Bono",
  "Bono East",
  "Central",
  "Eastern",
  "Greater Accra",
  "North East",
  "Northern",
  "Oti",
  "Savannah",
  "Upper East",
  "Upper West",
  "Volta",
  "Western",
  "Western North",
];

export const deliveryFeesByRegion: Record<string, number> = {
  "Greater Accra": 25,
  Ashanti: 35,
  Eastern: 35,
  Central: 40,
  Western: 45,
  Volta: 45,
  Bono: 50,
  "Bono East": 50,
  Ahafo: 55,
  "Western North": 55,
  Oti: 60,
  Northern: 65,
  "North East": 70,
  Savannah: 70,
  "Upper East": 75,
  "Upper West": 75,
};

export function getDeliveryFee(region: string) {
  return deliveryFeesByRegion[region] || 0;
}

export function isValidGhanaPhoneNumber(phone: string) {
  const cleanedPhone = phone.replace(/\s/g, "");

  return /^0\d{9}$/.test(cleanedPhone) || /^\+233\d{9}$/.test(cleanedPhone);
}