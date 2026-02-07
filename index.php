<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Minecraft Skin Creator PHP</title>
    <link rel="stylesheet" href="style.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r104/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/skinview3d@2.1.2/dist/bundle.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.104.0/examples/js/controls/OrbitControls.js"></script>
</head>
<body>

<?php
// Ici, on peut imaginer que ces données viennent d'une base de données plus tard
$personnages = [
    ['name' => 'Ethane', 'url' => 'chemin/vers/ethane_uhd.png', 'icon' => '🛡️'],
    ['name' => 'Kitty', 'url' => 'chemin/vers/kitty_uhd.png', 'icon' => '👤']
];
?>

<div class="app-container">
    <aside class="sidebar left">
        <h2>ÉLÉMENTS</h2>
        <div class="category">
            <h3>PERSONNAGES</h3>
            <div class="button-grid">
                <?php foreach ($personnages as $perso): ?>
                    <button class="add-btn" 
                            data-name="<?php echo $perso['name']; ?>" 
                            data-url="<?php echo $perso['url']; ?>">
                        <?php echo $perso['icon'] . ' ' . $perso['name']; ?>
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
        <div id="layer-list">
            </div>
        <button id="download-btn" class="main-download">💾 TÉLÉCHARGER LE SKIN</button>
    </aside>
</div>

<script src="script.js"></script>
</body>
</html>
