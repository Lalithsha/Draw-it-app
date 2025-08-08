import axios from "axios";
import { BACKEND_URL } from "../../config";
import { ChatRoom } from "../../components/ChatRoom";

async function getRoomId(slug: string) {
  console.log(`${BACKEND_URL}/room/${slug}`);
  const reponse = await axios.get(`${BACKEND_URL}/room/${slug}`, {
    withCredentials: true,
  });
  console.log("response data looks like this: ", reponse);
  console.log("response data ", reponse.data);
  console.log("response data of room : ", reponse.data.room);
  return reponse.data.room.id;
}

export default async function ChatRoom1({
  params,
}: {
  params: { slug: string };
}) {
  const slug = (await params).slug;
  const roomId = await getRoomId(slug);

  return <ChatRoom id={roomId} />;
}
