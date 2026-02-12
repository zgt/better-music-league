import * as React from "react"

import { cn } from "~/lib/utils"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"

type FormInputProps = React.ComponentProps<"input"> & {
  label?: string
  error?: string
  description?: string
}

function FormInput({
  label,
  error,
  description,
  id,
  className,
  ...props
}: FormInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <Label htmlFor={id}>{label}</Label>
      )}
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      <Input
        id={id}
        className={cn(error && "border-destructive focus-visible:ring-destructive/20", className)}
        {...props}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

export { FormInput }
