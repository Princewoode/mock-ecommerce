export async function uploadProductImage(file: File): Promise<string> {
  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch("/api/uploads/product-image", {
    method: "POST",
    body: formData,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Image upload failed.");
  }

  return result.imageUrl;
}