"use client";

import { FormEvent, useEffect, useState } from "react";
import ProductVisual from "@/components/ProductVisual";
import { SellerProfile } from "@/types/models";
import {
  getSellerProfile,
  updateSellerProfile,
  uploadSellerImage,
} from "@/utils/sellerProfileService";

export default function SellerProfileManager() {
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [storeDescription, setStoreDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  useEffect(() => {
    loadSellerProfile();
  }, []);

  async function loadSellerProfile() {
    try {
      setIsLoading(true);
      setMessage("");

      const profile = await getSellerProfile();

      setSeller(profile);
      setStoreDescription(profile.storeDescription || "");
      setLogoUrl(profile.logoUrl || "");
      setBannerUrl(profile.bannerUrl || "");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load seller profile."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogoUpload(file: File | null) {
    if (!file) {
      return;
    }

    try {
      setIsUploadingLogo(true);
      setMessage("");

      const imageUrl = await uploadSellerImage(file);

      setLogoUrl(imageUrl);
      setMessage("Logo uploaded successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Logo upload failed.");
    } finally {
      setIsUploadingLogo(false);
    }
  }

  async function handleBannerUpload(file: File | null) {
    if (!file) {
      return;
    }

    try {
      setIsUploadingBanner(true);
      setMessage("");

      const imageUrl = await uploadSellerImage(file);

      setBannerUrl(imageUrl);
      setMessage("Banner uploaded successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Banner upload failed."
      );
    } finally {
      setIsUploadingBanner(false);
    }
  }

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setMessage("");

      const result = await updateSellerProfile({
        storeDescription,
        logoUrl,
        bannerUrl,
      });

      setSeller(result.seller);
      setMessage(result.message);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Seller profile update failed."
      );
    }
  }

  if (isLoading) {
    return (
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-gray-600">Loading seller profile...</p>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-gray-700">{message}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSaveProfile}
      className="mt-8 space-y-6 rounded-2xl bg-white p-6 shadow-sm"
    >
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Seller Storefront Branding
        </h2>

        <p className="mt-2 text-gray-600">
          Add a logo, banner, and short store description to improve buyer trust.
        </p>
      </div>

      {message && (
        <div className="rounded-lg bg-gray-50 p-4 text-gray-700">
          {message}
        </div>
      )}

      <div className="rounded-xl bg-gray-50 p-4">
        <p className="font-semibold text-gray-900">{seller.businessName}</p>
        <p className="mt-1 text-gray-600">
          {seller.city}, {seller.region} · Status: {seller.status}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Store Description
        </label>

        <textarea
          value={storeDescription}
          onChange={(event) => setStoreDescription(event.target.value)}
          placeholder="Example: We sell quality affordable fashion products from Accra with fast delivery."
          rows={4}
          className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Store Logo
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={(event) =>
              handleLogoUpload(event.target.files?.[0] || null)
            }
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
          />

          {isUploadingLogo && (
            <p className="mt-2 text-sm text-gray-600">Uploading logo...</p>
          )}

          {logoUrl && (
            <div className="mt-4">
              <ProductVisual image={logoUrl} alt="Seller logo" size="small" />
            </div>
          )}

          <input
            value={logoUrl}
            onChange={(event) => setLogoUrl(event.target.value)}
            placeholder="Or paste logo URL"
            className="mt-3 w-full rounded-lg border border-gray-300 px-4 py-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Store Banner
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={(event) =>
              handleBannerUpload(event.target.files?.[0] || null)
            }
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
          />

          {isUploadingBanner && (
            <p className="mt-2 text-sm text-gray-600">Uploading banner...</p>
          )}

          {bannerUrl && (
            <div className="mt-4 overflow-hidden rounded-xl">
              <img
                src={bannerUrl}
                alt="Seller banner"
                className="h-40 w-full object-cover"
              />
            </div>
          )}

          <input
            value={bannerUrl}
            onChange={(event) => setBannerUrl(event.target.value)}
            placeholder="Or paste banner URL"
            className="mt-3 w-full rounded-lg border border-gray-300 px-4 py-3"
          />
        </div>
      </div>

      <button type="submit" className="rounded-lg bg-black px-6 py-3 text-white">
        Save Storefront Profile
      </button>
    </form>
  );
}