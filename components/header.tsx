import Link from "next/link"
import { ThemeToggle } from "./theme-toggle"

export default function Header() {
  return (
    <header className="border-b p-2">
      <div className="flex items-center justify-between px-2">
        <Link href="/">
          <h1 className="text-2xl font-extrabold">Redditr</h1>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  )
}
