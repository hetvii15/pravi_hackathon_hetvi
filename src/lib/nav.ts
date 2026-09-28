import {
  LayoutDashboard,
  Boxes,
  Map,
  ClipboardCheck,
  Wrench,
  History,
  Building2,
  FileBarChart,
  Upload,
  Bell,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
};

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Portfolio-wide health, risk and activity overview.",
  },
  {
    href: "/assets",
    label: "Assets",
    icon: Boxes,
    description: "The full cross-department asset inventory.",
  },
  {
    href: "/map",
    label: "Map",
    icon: Map,
    description: "Geospatial view of every asset by location and condition.",
  },
  {
    href: "/inspections",
    label: "Inspections",
    icon: ClipboardCheck,
    description: "Inspection history, findings and overdue schedules.",
  },
  {
    href: "/maintenance",
    label: "Maintenance",
    icon: Wrench,
    description: "Work orders and maintenance records per asset.",
  },
  {
    href: "/lifecycle",
    label: "Lifecycle",
    icon: History,
    description: "Lifecycle stage history and end-of-life forecasting.",
  },
  {
    href: "/departments",
    label: "Departments",
    icon: Building2,
    description: "Departments, categories and ownership structure.",
  },
  {
    href: "/reports",
    label: "Reports",
    icon: FileBarChart,
    description: "Spend, condition and risk reporting across departments.",
  },
  {
    href: "/import",
    label: "Import",
    icon: Upload,
    description: "Bulk-load asset records from external sources.",
  },
  {
    href: "/notifications",
    label: "Notifications",
    icon: Bell,
    description: "Overdue inspections, maintenance due and risk alerts.",
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    description: "Demo role, preferences and platform configuration.",
  },
];
