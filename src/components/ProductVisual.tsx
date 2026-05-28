type ProductVisualProps = {
  image?: string;
  alt: string;
  size?: "small" | "medium" | "large";
};

const sizeClasses = {
  small: "h-16 w-16 text-3xl",
  medium: "h-48 w-full text-6xl",
  large: "h-80 w-full text-7xl",
};

function isImageUrl(image: string) {
  return (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("/") ||
    image.startsWith("data:image")
  );
}

export default function ProductVisual({
  image,
  alt,
  size = "medium",
}: ProductVisualProps) {
  const visualSize = sizeClasses[size];

  if (!image) {
    return (
      <div
        className={`${visualSize} flex items-center justify-center rounded-xl bg-gray-100 text-gray-400`}
      >
        📦
      </div>
    );
  }

  if (isImageUrl(image)) {
    return (
      <div
        className={`${visualSize} overflow-hidden rounded-xl bg-gray-100`}
      >
        <img
          src={image}
          alt={alt}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`${visualSize} flex items-center justify-center rounded-xl bg-gray-100`}
    >
      {image}
    </div>
  );
}