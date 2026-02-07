<?php
// On définit les personnages ici
$personnages = [
    ['name' => 'Ethane', 'url' => 'https://ton-site.com/skins/ethane.png', 'icon' => '🛡️'],
    ['name' => 'Kitty', 'url' => 'https://ton-site.com/skins/kitty.png', 'icon' => '👤']
];
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Minecraft Skin Creator</title>
    <link rel="stylesheet" href="style.css">
    
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r104/three.min.js"></script>
    
    <script src="https://cdn.jsdelivr.net/npm/three@0.104.0/examples/js/controls/OrbitControls.js"></script>
    
    <script src="https://cdn.jsdelivr.net/npm/skinview3d@2.1.2/dist/bundle.js"></script>
</head>
<body>

<div class="app-container">
    <aside class="sidebar left">
        <h2>ÉLÉMENTS</h2>
        <div class="category">
            <h3>PERSONNAGES</h3>
            <div class="button-grid">
                <?php foreach ($personnages as $p): ?>
                    <button class="add-btn" 
                            data-name="<?= htmlspecialchars($p['name']) ?>" 
                            data-url="<?= htmlspecialchars($p['url']) ?>">
                        <?= $p['icon'] ?> <?= htmlspecialchars($p['name']) ?>
                    </button>
                <?php endforeach; ?>
            </div>
        </div>
    </aside>

    <main id="viewer-container">
        <div id="skin_container"></div>
    </main>

    <aside class="sidebar right">
        <h2>CALQUES</h2>
        <div id="layer-list"></div>
        <button id="download-btn" class="main-download">💾 TÉLÉCHARGER LE SKIN</button>
    </aside>
</div>

<script src="script.js"></script>

</body>
</html>
