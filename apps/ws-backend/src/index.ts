import { WebSocketServer } from 'ws';
import {decode, Jwt, JwtPayload, verify} from "jsonwebtoken";

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', function connection(ws, request) {
  // ws.on('error', console.error);

  const url = request.url;

  if(!url){
    ws.close();
    return;
  }
  
  const queryParms = new URLSearchParams(url?.split("?")[1]);
  console.log("From ws backend the jwt secret is: ", process.env.JWT_SECRET)
  const token = queryParms.get("token") || "";
  // @ts-ignore
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  if(typeof decoded =="string"){
    ws.close();
    return;
  }
  
  if(!decoded || !decoded.userId){
    ws.close();
    return;
  }

  ws.on('message', function message(data) {
    console.log('received: %s', data);
    ws.send("pong");
  });

  // ws.send('something');
});