import type { Metadata } from "next";
import { StaffScreen } from "@/components/staff/staff-screen";

export const metadata: Metadata = {
  title: "Staff — Ventra Food",
  description: "Team roster: roles, contact details, and active staff.",
};

export default function StaffPage() {
  return <StaffScreen />;
}
