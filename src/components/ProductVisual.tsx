import Image from "next/image";

type ProductVisualProps = {
  image: string;
  alt: string;
  size?: "small" | "medium" | "large";
};

export default function ProductVisual({
  image,
  alt,
  size = "medium",
}: ProductVisualProps) {
  const isImagePath = image.startsWith("/") || image.startsWith("http");

  const sizeClasses = {
    small: "h-14 w-14 text-2xl",
    medium: "h-36 w-full text-6xl",
    large: "h-64 w-full text-7xl",
  };

  if (!isImagePath) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl bg-gray-100 ${sizeClasses[size]}`}
      >
        {image}
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gray-100 ${sizeClasses[size]}`}
    >
      <Image
        src={image}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 400px"
      />
    </div>
  );
}