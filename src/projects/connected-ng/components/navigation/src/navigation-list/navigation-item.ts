export interface NavigationItem {
  id: string;
  label: string;
  route?: string;
  externalUrl?: string;
  action?: () => void;
  count?: string;
  icon?: string;
  menus: string[];
  roles?: string[];
  featureFlag?: string;
  children?: NavigationItem[];
}
