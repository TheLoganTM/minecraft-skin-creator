<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Minecraft Skin Creator - Logan EDITION</title>
    <link rel="stylesheet" href="style.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r104/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/gh/mrdoob/three.js@r104/examples/js/controls/OrbitControls.js"></script>
    <script src="skin_viewer.js"></script>
	<link href="https://fonts.googleapis.com/css2?family=Gabarito:wght@400..900&display=swap" rel="stylesheet">
</head>
<body>
<div id="rideau-entree">
    <div class="contenu-rideau">
        <h1>Générateur de skin Esperia</h1>
        <button id="btn-entrer" onclick="ouvrirGenerateur()">OUVRIR LA GARDE-ROBE</button>
    </div>
</div>
    <div class="app-container" id="main-app" style="display:none;">
        <aside class="sidebar">
            <h2>ÉLÉMENTS</h2>
            <div class="menu-categories">
                <?php
                $mainDir = "assets/";
                function scanFolderRecursive($path) {
                    $items = array_diff(scandir($path), array('..', '.'));
                    natcasesort($items);
                    foreach ($items as $item) {
                        $fullPath = $path . DIRECTORY_SEPARATOR . $item;
                        if (is_dir($fullPath)) {
                            $renduFile = $fullPath . DIRECTORY_SEPARATOR . $item . '_rendu.png';
                            $baseImg = $fullPath . DIRECTORY_SEPARATOR . $item . '.png';

                            if (file_exists($renduFile)) {
                                echo '<div class="item-block" id="block-'.$item.'">';
                                echo '  <div class="item-header">';
                                echo '      <button class="add-btn item-main-btn" data-url="'.$baseImg.'" data-name="'.$item.'">';
                                echo '          <img src="'.$renduFile.'" width="25" height="25">';
                                echo '      </button>';
                                echo '      <span class="item-label">'.htmlspecialchars($item).'</span>';
                                echo '  </div>';
                                echo '  <div class="item-options" id="options-'.$item.'" style="display:none;">';
                                echo '      <div class="variations-line">';
                                $pastilles = glob($fullPath . DIRECTORY_SEPARATOR . '*_pastille.png');
                                foreach ($pastilles as $pastille) {
                                    $textureUHD = str_replace('_pastille.png', '.png', $pastille);
                                    echo '          <img src="'.$pastille.'" class="pastille-btn" data-url="'.$textureUHD.'" data-target="'.$item.'">';
                                }
                                echo '      </div>';
                                echo '      <div class="item-filters">';
                                echo '          <div class="filter-group"><label>Luminosité</label>';
                                echo '          <input type="range" class="filter-slider" data-filter="brightness" data-target="'.$item.'" min="0" max="200" value="100"></div>';
                                echo '          <div class="filter-group"><label>Contraste</label>';
                                echo '          <input type="range" class="filter-slider" data-filter="contrast" data-target="'.$item.'" min="0" max="200" value="100"></div>';
                                echo '      </div>';
                                echo '  </div>';
                                echo '</div>';
                            } else {
                                $displayName = preg_replace('/^[0-9]+_/', '', $item);
                                echo '<div class="category-item">';
                                echo '  <button class="category-btn">' . htmlspecialchars($displayName) . ' <span>▼</span></button>';
                                echo '  <div class="category-content" style="display:none;">';
                                scanFolderRecursive($fullPath);
                                echo '  </div>';
                                echo '</div>';
                            }
                        }
                    }
                }
                if (is_dir($mainDir)) scanFolderRecursive($mainDir);
                ?>
            </div>
        </aside>

<main id="viewer-container">
    <div class="animation-controls">
        <button onclick="setAnimation('idle')">Statique</button>
        <button onclick="setAnimation('walk')">Marcher</button>
        <button onclick="setAnimation('run')">Courir</button>
    </div>

    <div class="zoom-controls">
        <button id="btn-zoom-in" onclick="applyZoom(-1)">+</button>
        <button id="btn-zoom-out" onclick="applyZoom(1)">-</button>
    </div>

    <div id="skin_container"></div>

    <div class="camera-controls">
        <button onclick="setCameraView('plongee')">Plongée</button>
        <button onclick="setCameraView('face')">Face</button>
    </div>
	
<div class="audio-panel">
    <div class="audio-controls">
        <button id="btn-play" onclick="toggleMusic()">♫⏸</button>
        <div class="volume-container">
            <input type="range" id="volume-slider" min="0" max="1" step="0.05" value="0.5" oninput="updateVolume(this.value)">
        </div>
    </div>
</div>
</main>

        <aside class="layers-panel">
            <h3>CALQUES</h3>
            <div id="layer-list"></div>
            <button id="download-btn" class="main-btn-download">💾 TÉLÉCHARGER LE SKIN</button>
        </aside>
    </div>
    <script src="script.js"></script>
</body>
</html>