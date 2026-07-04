import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"

export const { POST, PUT, GET } = toNextJsHandler(auth)
