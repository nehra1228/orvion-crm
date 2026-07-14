import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-[20px] border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 transition duration-200 outline-none placeholder:text-slate-500 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/15 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-white/5 disabled:opacity-60",
        className
      )}
      {...props}
    />
  )
}

export { Input }
