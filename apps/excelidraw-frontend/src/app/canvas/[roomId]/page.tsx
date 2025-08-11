import { RoomCanvas } from "@/app/components/RoomCanvas";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function CanvasPage({
  params,
}: {
  params: { roomId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/signin");
  }
  const roomId = (await params).roomId; // can be numeric room or solo document id
  console.log("Room Id is : ", roomId);

  return <RoomCanvas roomId={roomId} />;
}
