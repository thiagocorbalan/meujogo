import { notFound } from "next/navigation"
import { DesignSystemShowcase } from "./design-system-showcase"

export default function Page() {
  if (process.env.NODE_ENV === "production") notFound()

  return <DesignSystemShowcase />
}
