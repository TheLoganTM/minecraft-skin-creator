async function refreshProject() {
    const list = document.getElementById('layer-list');
    list.innerHTML = "";
    
    if (layers.length === 0) {
        viewer.skinImg.src = INVISIBLE_SKIN;
        toggleOutline(true);
        return;
    }

    toggleOutline(false);
    const mergedSkin = await composeSkins(layers.map(l => l.url));

    // CHARGEMENT UHD : On crée une nouvelle texture Three.js pour forcer la qualité
    const loader = new THREE.TextureLoader();
    loader.load(mergedSkin, (texture) => {
        // Ces deux lignes sont CRUCIALES pour le UHD sans flou
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.needsUpdate = true;

        // On applique la texture au modèle 3D
        viewer.playerObject.skin.map = texture;
        viewer.skinImg.src = mergedSkin; // Garde l'image à jour pour le bouton télécharger
    });

    // Mise à jour de l'interface des calques
    [...layers].reverse().forEach((layer) => {
        const idx = layers.indexOf(layer);
        const item = document.createElement('div');
        item.className = 'layer-item';
        item.innerHTML = `<span>✨ ${layer.name}</span><div class="layer-controls">` +
            `<button onclick="moveLayer(${idx}, 1)">↑</button>` +
            `<button onclick="moveLayer(${idx}, -1)">↓</button>` +
            `<button class="delete-layer" onclick="removeLayer(${idx})">❌</button></div>`;
        list.appendChild(item);
    });
}
