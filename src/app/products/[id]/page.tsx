import ProductDetailsContent from "@/components/ProductDetailsContent";

type ProductDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProductDetailsPage({
  params,
}: ProductDetailsPageProps) {
  const { id } = await params;

  return <ProductDetailsContent productId={Number(id)} />;
}