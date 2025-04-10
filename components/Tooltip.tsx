import { ReactNode } from "react";
import { Button, ButtonProps } from "@/components/ui/button" 
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ReusableTooltipProps {
    children?: ReactNode; // Element to wrap (e.g., Button)
    tooltipText: string;
    buttonText?: string; // Only used if no children
    buttonProps?: ButtonProps;
  }

export function TooltipComp({
    children,
    tooltipText,
    buttonText,
    buttonProps,
  }: ReusableTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
        {children ? (
            children
          ) : (
            <Button variant="outline" {...buttonProps}>
              {buttonText || "Hover"}
            </Button>
          )}
        </TooltipTrigger>
        <TooltipContent className="dark bg-slate-900 border-cyan-400/50 px-2 py-1 text-xs">
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
