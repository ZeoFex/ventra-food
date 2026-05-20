/** Types for guest-facing menu rows built from sellable menu products */

export type GuestMenuItem = {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  imageSrc: string;
  roundImage?: boolean;
};
