let scene = new THREE.Scene()

let camera3d = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.01, 1000)
camera3d.position.z = 6

let renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true })
renderer.setSize(innerWidth, innerHeight)
renderer.setPixelRatio(1)
document.body.appendChild(renderer.domElement)

let video = document.getElementById("video")
let statusBox = document.getElementById("status")

let main = new THREE.Group()
scene.add(main)

let count = 32000
let pos = new Float32Array(count * 3)
let col = new Float32Array(count * 3)

for(let i = 0; i < count; i++){
    let a = Math.random() * Math.PI * 2
    let b = Math.acos(2 * Math.random() - 1)
    let r = 2.1 + Math.random() * 0.3

    let x = r * Math.sin(b) * Math.cos(a)
    let y = r * Math.sin(b) * Math.sin(a)
    let z = r * Math.cos(b)

    pos[i*3] = x
    pos[i*3+1] = y
    pos[i*3+2] = z

    col[i*3] = 0.03
    col[i*3+1] = 0.65 + Math.random() * 0.35
    col[i*3+2] = 1
}

let planetGeo = new THREE.BufferGeometry()
planetGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3))
planetGeo.setAttribute("color", new THREE.BufferAttribute(col, 3))

let planetMat = new THREE.PointsMaterial({
    size:0.03,
    vertexColors:true,
    transparent:true,
    opacity:1,
    depthWrite:false,
    blending:THREE.AdditiveBlending
})

let planet = new THREE.Points(planetGeo, planetMat)
main.add(planet)

let glow = new THREE.Mesh(
    new THREE.SphereGeometry(2.55, 64, 64),
    new THREE.MeshBasicMaterial({
        color:0x00ccff,
        transparent:true,
        opacity:0.12,
        blending:THREE.AdditiveBlending
    })
)
main.add(glow)

function makeRing(size, tube, opacity, rx){
    let geo = new THREE.TorusGeometry(size, tube, 20, 260)
    let mat = new THREE.MeshBasicMaterial({
        color:0x00eaff,
        transparent:true,
        opacity:opacity,
        blending:THREE.AdditiveBlending
    })

    let ring = new THREE.Mesh(geo, mat)
    ring.rotation.x = rx
    main.add(ring)
    return ring
}

function makeDotRing(radius, count, opacity, rx){
    let ringPos = new Float32Array(count * 3)

    for(let i = 0; i < count; i++){
        let a = Math.PI * 2 * i / count
        ringPos[i*3] = Math.cos(a) * radius
        ringPos[i*3+1] = Math.sin(a) * radius
        ringPos[i*3+2] = 0
    }

    let geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.BufferAttribute(ringPos, 3))

    let mat = new THREE.PointsMaterial({
        color:0x00eaff,
        size:0.045,
        transparent:true,
        opacity:opacity,
        depthWrite:false,
        blending:THREE.AdditiveBlending
    })

    let ring = new THREE.Points(geo, mat)
    ring.rotation.x = rx
    main.add(ring)
    return ring
}

let ring1 = makeDotRing(3.35, 900, 0.9, 1.2)
let ring2 = makeDotRing(3.75, 700, 0.45, 1.35)
let ring3 = makeDotRing(2.95, 600, 0.35, 1.05)

let starsGeo = new THREE.BufferGeometry()
let starsPos = new Float32Array(3500 * 3)

for(let i = 0; i < 3500; i++){
    starsPos[i*3] = (Math.random() - 0.5) * 90
    starsPos[i*3+1] = (Math.random() - 0.5) * 90
    starsPos[i*3+2] = (Math.random() - 0.5) * 90
}

starsGeo.setAttribute("position", new THREE.BufferAttribute(starsPos, 3))

let stars = new THREE.Points(
    starsGeo,
    new THREE.PointsMaterial({
        color:0x88ddff,
        size:0.035,
        transparent:true,
        opacity:0.65,
        blending:THREE.AdditiveBlending
    })
)
scene.add(stars)

let grab = false
let grabStartX = 0
let grabStartY = 0

let spinX = 0
let spinY = 0
let targetSpinX = 0
let targetSpinY = 0

let fist = 0
let targetFist = 0
let zoomPower = 0

function dist(a,b){
    let x = a.x - b.x
    let y = a.y - b.y
    return Math.sqrt(x*x + y*y)
}

function animate(){
    requestAnimationFrame(animate)

    spinX += (targetSpinX - spinX) * 0.15
    spinY += (targetSpinY - spinY) * 0.15

    if(!grab){
        targetSpinX *= 0.95
        targetSpinY *= 0.95
    }

    fist += (targetFist - fist) * 0.12

    main.rotation.y += 0.004 + spinX
    main.rotation.x += spinY

    ring1.rotation.z += 0.01 + Math.abs(spinX) * 0.8
    ring2.rotation.z -= 0.007
    ring3.rotation.z += 0.005

    stars.rotation.y += 0.0007

    let zoom = 6 - fist * 5.2 - zoomPower * 1.6
    camera3d.position.z += (zoom - camera3d.position.z) * 0.09

    let scale = 1 + fist * 0.25 + zoomPower * 0.08
    main.scale.set(scale, scale, scale)

    planetMat.size = grab ? 0.045 : 0.03 + fist * 0.012
    glow.material.opacity = 0.12 + fist * 0.25 + zoomPower * 0.08

    ring1.material.opacity = grab ? 0.95 : 0.55
    ring2.material.opacity = grab ? 0.65 : 0.32
    ring3.material.opacity = grab ? 0.50 : 0.24

    renderer.render(scene, camera3d)
}
animate()

let hands = new Hands({
    locateFile:file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
})

hands.setOptions({
    maxNumHands:1,
    modelComplexity:1,
    minDetectionConfidence:0.7,
    minTrackingConfidence:0.7
})

hands.onResults(res=>{
    if(res.multiHandLandmarks && res.multiHandLandmarks.length > 0){
        let h = res.multiHandLandmarks[0]

        let thumb = h[4]
        let index = h[8]
        let middle = h[12]
        let ringFinger = h[16]
        let pinky = h[20]
        let palm = h[9]

        let pinch = dist(thumb, index)
        let nowGrab = pinch < 0.10

        if(nowGrab && !grab){
            grabStartX = index.x
            grabStartY = index.y
        }

        grab = nowGrab

        if(grab){
            let moveX = index.x - grabStartX
            let moveY = index.y - grabStartY

            targetSpinX = moveX * 2.8
            targetSpinY = moveY * 1.8
            zoomPower = Math.max(0, Math.min(1, 1 - pinch * 7))

            statusBox.innerText = "GRABBING"
        }else{
            zoomPower = 0
            statusBox.innerText = "HAND DETECTED"
        }

        let d1 = dist(index, palm)
        let d2 = dist(middle, palm)
        let d3 = dist(ringFinger, palm)
        let d4 = dist(pinky, palm)

        let avg = (d1 + d2 + d3 + d4) / 4

        targetFist = avg < 0.38 ? 1 : 0
    }else{
        grab = false
        targetFist = 0
        zoomPower = 0
        statusBox.innerText = "SHOW YOUR HAND"
    }
})

let cam = new Camera(video,{
    onFrame:async()=>{
        await hands.send({ image:video })
    },
    width:1280,
    height:720
})

cam.start()
.then(()=>{
    statusBox.innerText = "CAMERA READY"
})
.catch(()=>{
    statusBox.innerText = "CAMERA ERROR"
})

addEventListener("resize",()=>{
    camera3d.aspect = innerWidth / innerHeight
    camera3d.updateProjectionMatrix()
    renderer.setSize(innerWidth, innerHeight)
})