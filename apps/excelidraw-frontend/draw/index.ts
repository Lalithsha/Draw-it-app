type Shape = {
    type:"rect";
    x:number;
    y:number;
    width:number;
    height:number;
} | {
    type:"circle";
    centerX:number;
    centerY:number;
    radius:number;
}


export default function initDraw(canvas: HTMLCanvasElement){
  
    const ctx = canvas.getContext("2d");

    let existingShape: Shape[] =[];
    
    if (!ctx) {
        return;
    }

    ctx.fillStyle = "rgba(0, 0, 0)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let clicked = false;
    let startX = 0;
    let startY = 0;

    canvas.addEventListener("mousedown", (e) => {
        clicked = true;
        startX = e.clientX;
        startY = e.clientY;
    });

    canvas.addEventListener("mouseup", (e) => {
        clicked = false;
        console.log("Mouse up", e.clientX);
        console.log("Mouse up", e.clientY);
        const width = e.clientX-startX;
        const height = e.clientY-startY;
        existingShape.push({
            type:"rect",
            x:startX,
            y:startY,
            width,
            height
        })

        
    });

    canvas.addEventListener("mousemove", (e) => {
        if (clicked) {
        const width = e.clientX - startX;
        const height = e.clientY - startY;
        clearCanvas(existingShape, canvas);
        ctx.strokeStyle = "rgba(255, 255, 255)";
        ctx.strokeRect(startX, startY, width, height);
        }
    });
}

function clearCanvas(existingShape:Shape[], canvas: HTMLCanvasElement){

    const ctx = canvas.getContext("2d");
    if(!ctx){
        return null;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0, 0, 0)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    existingShape.map((shape)=>{
        if(shape.type==='rect'){
            ctx.strokeStyle = "rgba(255, 255, 255)";
            ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
        }
    })
    
}
