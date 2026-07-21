import {
  CakeSlice,
  Coffee,
  CookingPot,
  Drumstick,
  Flame,
  GlassWater,
  Sandwich,
  Soup,
  Sunrise,
  Users,
  Utensils,
  Wheat,
} from 'lucide-react';

export const categoryIconOptions = [
  { value: 'bread', label: 'Bread', Icon: Wheat },
  { value: 'sunrise', label: 'Breakfast', Icon: Sunrise },
  { value: 'drumstick', label: 'Chicken', Icon: Drumstick },
  { value: 'pot', label: 'Curry pot', Icon: CookingPot },
  { value: 'bowl', label: 'Rice bowl', Icon: Soup },
  { value: 'flame', label: 'Grill', Icon: Flame },
  { value: 'users', label: 'Family platter', Icon: Users },
  { value: 'sandwich', label: 'Fast food', Icon: Sandwich },
  { value: 'coffee', label: 'Hot drink', Icon: Coffee },
  { value: 'glass', label: 'Cold drink', Icon: GlassWater },
  { value: 'cake', label: 'Dessert', Icon: CakeSlice },
  { value: 'utensils', label: 'General food', Icon: Utensils },
];

const iconByName = new Map(categoryIconOptions.map((option) => [option.value, option.Icon]));

export function CategoryIcon({ name, size = 20, ...props }) {
  const Icon = iconByName.get(name) || Utensils;
  return <Icon aria-hidden="true" size={size} {...props} />;
}
