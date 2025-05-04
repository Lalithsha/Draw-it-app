import {
  ForwardRefExoticComponent,
  ReactNode,
  RefAttributes,
  SVGProps,
} from "react";

export default function IconButton({
  icon,
  onClick,
  activated,
}: {
  icon: ReactNode;
  onClick: () => void; // Change 'void' to '() => void' for proper type
  activated: boolean;
}) {
  return (
    <div
      className={`pointer rounded-md m-2 p-2 hover:bg-gray-200  transition duration-200 ease-in-out ${activated ? "bg-blue-500" : "text-white"}`}
      onClick={onClick}
    >
      {icon}
    </div>
  );
}
