import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 transition duration-200 outline-none placeholder:text-slate-500 focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/15 disabled:cursor-not-allowed disabled:bg-white/5 disabled:opacity-60",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
