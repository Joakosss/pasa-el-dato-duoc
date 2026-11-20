import { redirect } from "next/navigation";
import { ROUTES } from "@/config/constants";

export default function ReportesPage() {
  redirect(ROUTES.dashboardReportesUsuarios);
}
