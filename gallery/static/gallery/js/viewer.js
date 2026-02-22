import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function loadModel(containerId, modelUrl) {

    const container = document.getElementById(containerId);
    if (!container) return;

    // 🔥 1. Очищаем контейнер СРАЗУ
    container.innerHTML = '';
    container.style.backgroundImage = 'none';

    // 2. Сцена
    const scene = new THREE.Scene();
    scene.background = null;

    // 3. Камера
    const camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        100
    );

    // 4. Рендерер
    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });

    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    container.appendChild(renderer.domElement);

    // 🔥 важно — чтобы canvas перекрывал фон
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';

    // 5. Контролы
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = 0.5;
    controls.maxDistance = 20;
    controls.target.set(0, 0, 0);
    controls.update();

    // 6. Свет и окружение
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(
        new RoomEnvironment(renderer)
    ).texture;

    // 7. Loader UI
    const loaderDiv = document.createElement('div');
    loaderDiv.className = 'loader-overlay';
    loaderDiv.innerHTML = `
        <div style="color:#666;font-size:0.9rem;">Loading...</div>
        <div class="progress-bar">
            <div class="progress-fill"></div>
        </div>
    `;
    container.appendChild(loaderDiv);

    const progressFill = loaderDiv.querySelector('.progress-fill');

    // 8. Загрузка модели
    const loader = new GLTFLoader();

    loader.load(
        modelUrl,

        (gltf) => {

            const model = gltf.scene;
            scene.add(model);

            fitCameraToObject(camera, model, controls);

            loaderDiv.style.opacity = '0';
            setTimeout(() => loaderDiv.remove(), 300);
        },

        (xhr) => {
            if (xhr.total > 0) {
                const percent = (xhr.loaded / xhr.total) * 100;
                progressFill.style.width = percent + '%';
            }
        },

        (error) => {
            console.error('Ошибка загрузки:', error);
            loaderDiv.innerHTML = `
                <div class="error-msg">
                    ❌ Ошибка загрузки<br>
                    <small>Проверьте файл</small>
                </div>
            `;
        }
    );

    // 9. Анимация
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    // 10. Resize
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}

// Вспомогательная функция центровки модели и установки камеры
function fitCameraToObject(camera, object, controls) {
    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    // Сдвигаем модель в центр
    object.position.x = -center.x;
    object.position.y = -center.y;
    object.position.z = -center.z;

    // Ставим камеру
    const fov = camera.fov * (Math.PI / 180);
    const cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.5;
    camera.position.set(cameraZ, cameraZ * 0.5, cameraZ);
    camera.lookAt(0, 0, 0);

    // Обновляем цель контроллера после изменения позиции камеры
    controls.target.set(0, 0, 0);
    controls.update();
}