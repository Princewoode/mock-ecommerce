import { supabase } from "@/lib/supabaseClient";
import { CustomerUser } from "@/types/models";
import {
  logoutCustomer,
  setCurrentCustomer,
} from "@/utils/authStorage";

type CustomerProfileRow = {
  id: string;
  full_name: string;
  email: string;
  shipping_address: string | null;
};

function mapProfileToCustomer(profile: CustomerProfileRow): CustomerUser {
  return {
    id: profile.id,
    fullName: profile.full_name,
    email: profile.email,
    shippingAddress: profile.shipping_address || "",
    password: "",
  };
}

async function getCustomerProfile(userId: string) {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapProfileToCustomer(data as CustomerProfileRow);
}

export async function registerCustomerWithSupabase({
  fullName,
  email,
  password,
  shippingAddress,
}: {
  fullName: string;
  email: string;
  password: string;
  shippingAddress: string;
}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error("Registration failed. No user was returned.");
  }

  const { error: profileError } = await supabase.from("customers").upsert({
    id: data.user.id,
    full_name: fullName,
    email,
    shipping_address: shippingAddress,
  });

  if (profileError) {
    throw new Error(profileError.message);
  }

  const customer: CustomerUser = {
    id: data.user.id,
    fullName,
    email,
    shippingAddress,
    password: "",
  };

  setCurrentCustomer(customer);

  return customer;
}

export async function loginCustomerWithSupabase({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error("Login failed. No user was returned.");
  }

  const customer = await getCustomerProfile(data.user.id);

  setCurrentCustomer(customer);

  return customer;
}

export async function logoutCustomerFromSupabase() {
  await supabase.auth.signOut();
  logoutCustomer();
}

export async function updateCustomerProfileInSupabase({
  fullName,
  shippingAddress,
  newPassword,
}: {
  fullName: string;
  shippingAddress: string;
  newPassword?: string;
}) {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!userData.user) {
    throw new Error("No logged-in customer found.");
  }

  if (newPassword && newPassword.trim()) {
    const { error: passwordError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (passwordError) {
      throw new Error(passwordError.message);
    }
  }

  const { data, error } = await supabase
    .from("customers")
    .update({
      full_name: fullName,
      shipping_address: shippingAddress,
    })
    .eq("id", userData.user.id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const customer = mapProfileToCustomer(data as CustomerProfileRow);

  setCurrentCustomer(customer);

  return customer;
}