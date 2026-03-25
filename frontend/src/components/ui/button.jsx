import React from "react"

function buttonClassNames({ variant }) {
  switch (variant) {
    case "ghost":
      return "bg-transparent hover:bg-white/10 text-white/90 hover:text-white"
    case "outline":
      return "border border-white/10 bg-transparent hover:bg-white/5 text-white"
    default:
      return "bg-white text-black hover:bg-white/90"
  }
}

export function Button({
  variant = "default",
  className = "",
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={[
        "inline-flex items-center justify-center whitespace-nowrap rounded-full",
        "px-4 py-2 text-sm font-semibold transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
        buttonClassNames({ variant }),
        className,
      ].join(" ")}
      {...props}
    />
  )
}

