
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.shadowMap.enabled = true;

const loader = new THREE.TextureLoader();
const pooltable = loader.load('assets/textures/pooltable.jpg');

// Mesa de billar
const mesaGeometry = new THREE.BoxGeometry(6, 3, 0.2);
const mesaMaterial = new THREE.MeshStandardMaterial({ map: pooltable });
const mesa = new THREE.Mesh(mesaGeometry, mesaMaterial);
mesa.receiveShadow = true;
scene.add(mesa);

// Luces
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
directionalLight.position.set(2, 2, 2);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Sombras
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;

// Pelotas
const pelotas = [];
const numPelotas = 5;
let pelotaMovil = null;



for (let i = 0; i < numPelotas; i++) {
    const pelotaGeometry = new THREE.SphereGeometry(0.2, 32, 32);

    const texture = loader.load(`assets/textures/ball${i + 1}.jpg`);

    const pelotaMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.1,
    });

    const pelota = new THREE.Mesh(pelotaGeometry, pelotaMaterial);
    pelota.castShadow = true;


    // Posición inicial de las pelotas sin superponerse
    let isOverlapping = false;
    do {
        isOverlapping = false;
        pelota.position.x = Math.random() * 5 - 2.5;
        pelota.position.y = Math.random() * 1.4 - 0.7;

        for (const otherPelota of pelotas) {
            const distance = pelota.position.distanceTo(otherPelota.position);
            const minimumDistance = 0.8; // Distancia mínima entre pelotas
            if (distance < minimumDistance) {
                isOverlapping = true;
                break;
            }
        }
    } while (isOverlapping);

    pelota.position.z = 0.2;

    // Velocidad y aceleración inicial
    const velocidadInicial = new THREE.Vector3(0, 0, 0);
    const aceleracion = new THREE.Vector3(0, 0, 0);

    pelota.velocidad = velocidadInicial;
    pelota.aceleracion = aceleracion;

    if (i === 0) {
        pelota.velocidad.x = 0.05; // Velocidad inicial de la primera pelota
        pelotaMovil = pelota;
    }

    scene.add(pelota);
    pelotas.push(pelota);
}

// Fricción
const friccion = 0.001;

camera.position.z = 5;

const animate = () => {
    requestAnimationFrame(animate);

    pelotas.forEach((pelota) => {
        // Desacelera con la fricción
        pelota.velocidad.x -= pelota.velocidad.x * friccion;
        pelota.velocidad.y -= pelota.velocidad.y * friccion;

        pelota.velocidad.add(pelota.aceleracion);
        pelota.position.add(pelota.velocidad);

        const velocidadRotacion = pelota.velocidad.length() * 0.5;
        pelota.rotation.x += velocidadRotacion;
        pelota.rotation.y += velocidadRotacion;

        // Colisiones con los bordes de la mesa (rebote)
        if (
            pelota.position.x > 2.9 ||
            pelota.position.x < -2.9 ||
            pelota.position.y > 1.4 ||
            pelota.position.y < -1.4
        ) {
            // Cambia la dirección de la velocidad en lugar de invertirla
            if (pelota.position.x > 2.9 || pelota.position.x < -2.9) {
                pelota.velocidad.x *= -1;
            }
            if (pelota.position.y > 1.4 || pelota.position.y < -1.4) {
                pelota.velocidad.y *= -1;
            }
        }

        // Colisiones entre pelotas
        pelotas.forEach((otraPelota) => {
            if (pelota !== otraPelota) {
                const distancia = pelota.position.distanceTo(otraPelota.position);
                const radioSuma = 0.4;

                if (distancia < radioSuma) {
                    const normal = new THREE.Vector3()
                        .subVectors(otraPelota.position, pelota.position)
                        .normalize();
                    const relativaVelocidad = new THREE.Vector3().subVectors(
                        pelota.velocidad,
                        otraPelota.velocidad
                    );
                    const velocidadEnNormal = relativaVelocidad.dot(normal);

                    const impulso = (2 * velocidadEnNormal) / (1 + 1); // Coeficiente de restitución para el impulso
                    const impulsoVector = normal.clone().multiplyScalar(impulso);

                    pelota.velocidad.sub(impulsoVector);
                    otraPelota.velocidad.add(impulsoVector);
                }
            }
        });
    });
    const inclinationAngle = Math.PI / 5;
    scene.rotation.x = -inclinationAngle;
    renderer.render(scene, camera);
};

animate();

