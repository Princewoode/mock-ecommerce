import { ProductReview } from "@/types/models";
import {
  readLocalData,
  writeLocalData,
} from "@/utils/localDatabase";

export type { ProductReview };

const REVIEWS_KEY = "productReviews";
const REVIEWS_EVENT = "reviewsUpdated";

export function getReviews(): ProductReview[] {
  return readLocalData<ProductReview[]>(REVIEWS_KEY, []);
}

export function saveReviews(reviews: ProductReview[]) {
  writeLocalData<ProductReview[]>(REVIEWS_KEY, reviews, REVIEWS_EVENT);
}

export function getReviewsByProduct(productId: number): ProductReview[] {
  return getReviews().filter((review) => review.productId === productId);
}

export function getAverageRating(productId: number) {
  const reviews = getReviewsByProduct(productId);

  if (reviews.length === 0) {
    return {
      average: 0,
      count: 0,
    };
  }

  const total = reviews.reduce((sum, review) => sum + review.rating, 0);

  return {
    average: total / reviews.length,
    count: reviews.length,
  };
}

export function addReview(review: ProductReview) {
  const reviews = getReviews();

  const updatedReviews = [review, ...reviews];

  saveReviews(updatedReviews);
}

export function deleteReview(reviewId: string) {
  const reviews = getReviews();

  const updatedReviews = reviews.filter((review) => review.id !== reviewId);

  saveReviews(updatedReviews);
}

export function getReviewsByCustomer(customerId: string): ProductReview[] {
  return getReviews().filter((review) => review.customerId === customerId);
}

export function deleteReviewsByProduct(productId: number) {
  const reviews = getReviews();

  const updatedReviews = reviews.filter(
    (review) => review.productId !== productId
  );

  saveReviews(updatedReviews);
}