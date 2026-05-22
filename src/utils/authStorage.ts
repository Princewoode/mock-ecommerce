import { CustomerUser } from "@/types/models";
import {
  readLocalData,
  removeLocalData,
  writeLocalData,
} from "@/utils/localDatabase";

export type { CustomerUser };

const USERS_KEY = "mockCustomers";
const CURRENT_USER_KEY = "currentCustomer";
const CUSTOMER_EVENT = "customerUpdated";

export function getCustomers(): CustomerUser[] {
  return readLocalData<CustomerUser[]>(USERS_KEY, []);
}

export function saveCustomers(users: CustomerUser[]) {
  writeLocalData<CustomerUser[]>(USERS_KEY, users, CUSTOMER_EVENT);
}

export function getCurrentCustomer(): CustomerUser | null {
  return readLocalData<CustomerUser | null>(CURRENT_USER_KEY, null);
}

export function setCurrentCustomer(user: CustomerUser) {
  writeLocalData<CustomerUser>(CURRENT_USER_KEY, user, CUSTOMER_EVENT);
}

export function logoutCustomer() {
  removeLocalData(CURRENT_USER_KEY, CUSTOMER_EVENT);
}

export function registerCustomer(user: CustomerUser) {
  const users = getCustomers();

  const updatedUsers = [user, ...users];

  saveCustomers(updatedUsers);
  setCurrentCustomer(user);
}

export function loginCustomer(email: string, password: string) {
  const users = getCustomers();

  return (
    users.find(
      (user) =>
        user.email.toLowerCase() === email.toLowerCase() &&
        user.password === password
    ) || null
  );
}

export function updateCustomerProfile(updatedUser: CustomerUser) {
  const users = getCustomers();

  const updatedUsers = users.map((user) =>
    user.id === updatedUser.id ? updatedUser : user
  );

  saveCustomers(updatedUsers);
  setCurrentCustomer(updatedUser);
}

export function customerEmailExists(email: string, excludedUserId?: string) {
  const users = getCustomers();

  return users.some(
    (user) =>
      user.id !== excludedUserId &&
      user.email.toLowerCase() === email.toLowerCase()
  );
}