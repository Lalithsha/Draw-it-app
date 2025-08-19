import { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

export default function IconButton({
  icon,
  onClick,
  activated,
  tooltip,
}: {
  icon: ReactNode;
  onClick: () => void;
  activated: boolean;
  tooltip: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div
            className={`
        cursor-pointer 
        rounded-md 
        m-2 
        p-2 
        transition 
        duration-200 
        ease-in-out 
        ${
          activated
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-black text-white hover:bg-gray-700"
        }
      `}
            onClick={onClick}
          >
            {icon}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
