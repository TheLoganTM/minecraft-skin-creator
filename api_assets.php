<?php
header('Content-Type: application/json');

$mainDir = "assets/";

function scanFolderRecursive($path) {
    $results = [];
    if (!is_dir($path)) return $results;

    $items = array_diff(scandir($path), array('..', '.'));
    natcasesort($items);

    foreach ($items as $item) {
        $fullPath = $path . DIRECTORY_SEPARATOR . $item;
        
        if (is_dir($fullPath)) {
            $renduFile = $fullPath . DIRECTORY_SEPARATOR . $item . '_rendu.png';
            $baseImg = $fullPath . DIRECTORY_SEPARATOR . $item . '.png';

            // Si c'est un item (vêtement/visage)
            if (file_exists($renduFile)) {
                $pastilles = [];
                $pastilleFiles = glob($fullPath . DIRECTORY_SEPARATOR . '*_pastille.png');
                
                foreach ($pastilleFiles as $pastille) {
                    $textureUHD = str_replace('_pastille.png', '.png', $pastille);
                    $pastilles[] = [
                        "icon" => str_replace('\\', '/', $pastille),
                        "texture" => str_replace('\\', '/', $textureUHD)
                    ];
                }

                $results[] = [
                    "type" => "item",
                    "name" => $item,
                    "baseImg" => str_replace('\\', '/', $baseImg),
                    "renduImg" => str_replace('\\', '/', $renduFile),
                    "pastilles" => $pastilles
                ];
            } else {
                // Si c'est une catégorie
                $displayName = preg_replace('/^[0-9]+_/', '', $item);
                $children = scanFolderRecursive($fullPath);
                
                if (!empty($children)) {
                    $results[] = [
                        "type" => "category",
                        "displayName" => $displayName,
                        "children" => $children
                    ];
                }
            }
        }
    }
    return $results;
}

echo json_encode(scanFolderRecursive($mainDir), JSON_PRETTY_PRINT);