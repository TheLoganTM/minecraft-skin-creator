const fs = require('fs');
const path = require('path');

const mainDir = 'assets';
const outputFile = 'assets.json';

// Fonction pour scanner les dossiers récursivement
function scanFolder(dir) {
    let results = [];
    
    // On lit le contenu du dossier et on trie par ordre alphabétique (pratique pour tes "01_Tetes", etc.)
    const items = fs.readdirSync(dir).sort();

    items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        // On ne s'intéresse qu'aux dossiers
        if (stat.isDirectory()) {
            const renduFile = path.join(fullPath, `${item}_rendu.png`);
            const baseImg = path.join(fullPath, `${item}.png`);

            // Règle : Si un fichier "_rendu.png" existe, c'est un Item (un vêtement/visage)
            if (fs.existsSync(renduFile)) {
                const pastilles = [];
                const dirContents = fs.readdirSync(fullPath);
                
                // On cherche les pastilles de couleurs
                dirContents.forEach(file => {
                    if (file.endsWith('_pastille.png')) {
                        const textureUHD = file.replace('_pastille.png', '.png');
                        pastilles.push({
                            // On remplace les "\" par des "/" pour que les URLs marchent sur le web
                            icon: path.join(fullPath, file).split(path.sep).join('/'),
                            texture: path.join(fullPath, textureUHD).split(path.sep).join('/')
                        });
                    }
                });

                results.push({
                    type: 'item',
                    name: item,
                    baseImg: baseImg.split(path.sep).join('/'),
                    renduImg: renduFile.split(path.sep).join('/'),
                    pastilles: pastilles
                });

            } else {
                // Règle : S'il n'y a pas de rendu, c'est une Catégorie (un dossier parent)
                // On enlève les numéros au début du nom (ex: "01_Tetes" devient "Tetes")
                const displayName = item.replace(/^[0-9]+_/, ''); 
                
                // On scanne l'intérieur de cette catégorie
                const children = scanFolder(fullPath);
                
                if (children.length > 0) {
                    results.push({
                        type: 'category',
                        displayName: displayName,
                        children: children
                    });
                }
            }
        }
    });

    return results;
}

// 1. On lance le scan
console.log("🔍 Scan du dossier assets en cours...");
const data = scanFolder(mainDir);

// 2. On écrit le résultat dans le fichier JSON
fs.writeFileSync(outputFile, JSON.stringify(data, null, 2), 'utf-8');
console.log(`✅ Fichier ${outputFile} généré avec succès ! (${data.length} catégories principales trouvées)`);