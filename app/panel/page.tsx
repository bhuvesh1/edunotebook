import { redirect } from "next/navigation";

// /panel → /panel/profile
export default function PanelIndex() {
  redirect("/panel/profile");
}
