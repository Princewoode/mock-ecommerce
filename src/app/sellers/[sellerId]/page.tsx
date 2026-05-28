import SellerStorefrontContent from "@/components/SellerStorefrontContent";

type SellerPageProps = {
  params: Promise<{
    sellerId: string;
  }>;
};

export default async function SellerPage({ params }: SellerPageProps) {
  const { sellerId } = await params;

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <section className="mx-auto max-w-6xl">
        <SellerStorefrontContent sellerId={sellerId} />
      </section>
    </main>
  );
}