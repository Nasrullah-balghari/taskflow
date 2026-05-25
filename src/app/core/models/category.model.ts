export type CategoryColor =
  | 'indigo'
  | 'pink'
  | 'green'
  | 'amber'
  | 'purple'
  | 'cyan'
  | 'red'
  | 'gray';

export const CATEGORY_COLORS: Record<CategoryColor, string> = {
  indigo: '#6366F1',
  pink:   '#EC4899',
  green:  '#10B981',
  amber:  '#F59E0B',
  purple: '#8B5CF6',
  cyan:   '#06B6D4',
  red:    '#EF4444',
  gray:   '#82828F',
};

export interface Category {
  id:        string;
  userId:    string;
  name:      string;
  color:     CategoryColor;
  icon?:     string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  name:  string;
  color: CategoryColor;
  icon?: string;
}

export interface UpdateCategoryRequest {
  name?:  string;
  color?: CategoryColor;
  icon?:  string;
}
