import React from "react"
import { useToast } from "@/lib/use-toast"
import { X } from "lucide-react"

const Toaster = () => {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed top-4 right-4 z-[100] flex max-h-screen w-full max-w-[420px] flex-col space-y-2">
      {toasts.map(({ id, title, description, action, ...props }) => (
        <div
          key={id}
          className="group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border bg-white p-4 pr-8 shadow-lg transition-all duration-300 ease-in-out"
          {...props}
        >
          <div className="grid gap-1 flex-1">
            {title && <div className="text-sm font-semibold">{title}</div>}
            {description && (
              <div className="text-sm opacity-90">{description}</div>
            )}
          </div>
          {action}
          <button
            onClick={() => dismiss(id)}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

export { Toaster }
