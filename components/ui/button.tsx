import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[18px] border border-white/10 bg-slate-900/70 px-4 py-2 text-sm font-semibold tracking-[0.02em] text-white transition duration-200 outline-none select-none focus-visible:ring-2 focus-visible:ring-cyan-300/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-slate-900/75 text-white shadow-[0_22px_70px_rgba(0,0,0,0.22)] hover:bg-slate-900/90",
        outline:
          "border-white/10 bg-transparent text-white hover:border-white/20 hover:bg-white/5 aria-expanded:bg-white/10",
        secondary:
          "bg-white/5 text-slate-100 hover:bg-white/10 aria-expanded:bg-white/10",
        ghost:
          "bg-transparent text-slate-300 hover:bg-white/5 hover:text-white aria-expanded:bg-white/10",
        destructive:
          "bg-rose-500/10 text-rose-200 hover:bg-rose-500/20 focus-visible:border-rose-300/40 focus-visible:ring-rose-300/20",
        link: "text-cyan-300 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 gap-2",
        xs: "h-8 gap-1 rounded-[14px] px-3 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1 rounded-[16px] px-3 text-sm [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 px-5 text-sm [&_svg:not([class*='size-'])]:size-4",
        icon: "h-10 w-10 rounded-[16px]",
        "icon-xs": "h-8 w-8 rounded-[14px] [&_svg:not([class*='size-'])]:size-4",
        "icon-sm": "h-9 w-9 rounded-[16px] [&_svg:not([class*='size-'])]:size-4",
        "icon-lg": "h-12 w-12 rounded-[20px] [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
