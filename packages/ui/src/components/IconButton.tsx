import { ReactNode } from "react";

export default function IconButton({
  icon,
  onClick,
  activated,
}: {
  icon: ReactNode;
  onClick: () => void;
  activated: boolean;
}) {
  return (
    <div
      className={`
        cursor-pointer 
        rounded-md 
        m-2 
        p-2 
        transition 
        duration-200 
        ease-in-out 
        ${activated 
          ? "bg-blue-600 text-white hover:bg-blue-700" 
          : "bg-black text-white hover:bg-gray-700"
        }
      `}
      onClick={onClick}
    >
      {icon}
    </div>
  );
}
