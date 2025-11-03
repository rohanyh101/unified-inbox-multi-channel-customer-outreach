import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => (
    <div className="relative flex items-center">
      <input
        type="checkbox"
        className={cn(
          "peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
          className
        )}
        ref={ref}
        {...props}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-current peer-checked:block hidden">
        <Check className="h-3 w-3" />
      </div>
    </div>
  )
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
