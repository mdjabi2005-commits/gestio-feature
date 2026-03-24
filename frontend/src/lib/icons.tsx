import { 
  Utensils, 
  Car, 
  Home, 
  Gamepad2, 
  Activity, 
  Heart,
  ShoppingBag, 
  ShoppingCart,
  Briefcase, 
  Bike, 
  TrendingUp, 
  MoreHorizontal,
  MapPin,
  HelpCircle
} from "lucide-react"

export const getCategoryIcon = (iconName: string) => {
  switch (iconName) {
    case "utensils": return Utensils
    case "car": return Car
    case "home": return Home
    case "gamepad": return Gamepad2
    case "activity": return Activity
    case "heart": return Heart
    case "shopping-bag": return ShoppingBag
    case "shopping-cart": return ShoppingCart
    case "briefcase": return Briefcase
    case "bike": return Bike
    case "trending-up": return TrendingUp
    case "more-horizontal": return MoreHorizontal
    case "map-pin": return MapPin
    default: return HelpCircle
  }
}
