export interface CategoryItem {
  id: string;
  name: string;
  imageUrl: string;
  itemCount: number;
  subCategories?: CategoryItem[];
}

export const MOCK_CATEGORIES: CategoryItem[] = [];
