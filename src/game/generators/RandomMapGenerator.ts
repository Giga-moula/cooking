/**
 * Générateur de cartes aléatoires basé sur le niveau de vague et les actions disponibles
 */

import { MapConfig, SpawnPoint, DEFAULT_TILE_TYPES } from "../config/MapConfig";

export interface MapGenerationConfig {
    waveLevel: number;
    availableActions: number;
    mapWidth: number;
    mapHeight: number;
    separationWall: boolean; // True si on veut une séparation entre les joueurs
}

export interface PlayerZone {
    startX: number;
    endX: number;
    startY: number;
    endY: number;
    spawnPoint: SpawnPoint;
    ingredientBoxes: SpawnPoint[];
    tables: SpawnPoint[];
    transformationTables: SpawnPoint[];
    ovens: SpawnPoint[];
}

export class RandomMapGenerator {
    private static readonly MIN_ZONE_SIZE = 3;
    private static readonly MAX_ZONE_SIZE = 5;
    private static readonly COMMUNICATION_COUNTERS = 2; // Nombre de comptoirs de communication
    private static readonly MAX_GENERATION_ATTEMPTS = 10; // Nombre max de tentatives de génération

    /**
     * Génère une carte aléatoire basée sur la configuration
     */
    static generateMap(config: MapGenerationConfig, attempt: number = 0): MapConfig {
        // Protection contre les boucles infinies
        if (attempt >= this.MAX_GENERATION_ATTEMPTS) {
            console.error("❌ Impossible de générer une carte valide après 10 tentatives");
            // Retourner une carte par défaut en cas d'échec
            throw new Error("Failed to generate valid map after maximum attempts");
        }
        const { waveLevel, availableActions, mapWidth, mapHeight } = config;
        
        // Toujours forcer la séparation des joueurs
        const separationWall = true;
        
        // Calculer la complexité basée sur le niveau de vague
        const complexity = this.calculateComplexity(waveLevel);
        
        // Créer la grille de base avec mur de séparation
        const mapData = this.createBaseGrid(mapWidth, mapHeight, separationWall);
        
        // Générer les zones des joueurs
        const playerZones = this.generatePlayerZones(mapWidth, mapHeight, separationWall, complexity);
        
        // Placer les éléments dans les zones
        this.populatePlayerZones(mapData, playerZones, availableActions, complexity, waveLevel);
        
        // Ajouter les comptoirs de communication
        this.addCommunicationCounters(mapData, playerZones);
        
        // Ajouter la zone de livraison UNIQUEMENT lors de la première vague
        // La zone de livraison reste fixe tout au long du jeu
        if (waveLevel === 1) {
            this.addDeliveryZone(mapData, playerZones);
        }
        
        // Valider que tous les éléments sont accessibles
        const isValid = this.validateAccessibility(mapData, playerZones);
        
        if (!isValid) {
            console.warn(`⚠️ Carte générée avec des éléments inaccessibles - Tentative ${attempt + 1}/${this.MAX_GENERATION_ATTEMPTS}`);
            // Régénérer une nouvelle carte si l'accessibilité n'est pas validée
            return this.generateMap(config, attempt + 1);
        }
        
        // Créer la configuration de carte
        return {
            name: `Carte Niveau ${waveLevel}`,
            description: `Carte générée aléatoirement pour la vague ${waveLevel}`,
            mapData,
            tileTypes: DEFAULT_TILE_TYPES,
            spawnPoints: {
                player1: playerZones[0].spawnPoint,
                player2: playerZones[1].spawnPoint
            }
        };
    }

    /**
     * Calcule la complexité basée sur le niveau de vague
     */
    private static calculateComplexity(waveLevel: number): number {
        // Complexité de 1 à 5 basée sur le niveau de vague
        return Math.min(Math.floor(waveLevel / 2) + 1, 5);
    }

    /**
     * Crée la grille de base avec les murs
     */
    private static createBaseGrid(width: number, height: number, separationWall: boolean): number[][] {
        const mapData: number[][] = [];
        
        for (let y = 0; y < height; y++) {
            const row: number[] = [];
            for (let x = 0; x < width; x++) {
                // Murs extérieurs
                if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
                    row.push(4); // Mur
                } else {
                    row.push(1); // Sol
                }
            }
            mapData.push(row);
        }
        
        // Ajouter une séparation avec des tables (comptoirs) au lieu de murs
        if (separationWall && width > 6) {
            const separationX = Math.floor(width / 2);
            // Séparation complète avec des tables (solides mais permettent la communication)
            for (let y = 1; y < height - 1; y++) {
                mapData[y][separationX] = 5; // Table de séparation
            }
        }
        
        return mapData;
    }

    /**
     * Génère les zones des joueurs
     */
    private static generatePlayerZones(
        width: number, 
        height: number, 
        separationWall: boolean, 
        complexity: number
    ): PlayerZone[] {
        const zones: PlayerZone[] = [];
        
        if (separationWall && width > 6) {
            const separationX = Math.floor(width / 2);
            
            // Zone joueur 1 (gauche)
            zones.push({
                startX: 1,
                endX: separationX - 1,
                startY: 1,
                endY: height - 2,
                spawnPoint: { x: 2, y: 2 },
                ingredientBoxes: [],
                tables: [],
                transformationTables: [],
                ovens: []
            });
            
            // Zone joueur 2 (droite)
            zones.push({
                startX: separationX + 1,
                endX: width - 2,
                startY: 1,
                endY: height - 2,
                spawnPoint: { x: separationX + 2, y: height - 3 },
                ingredientBoxes: [],
                tables: [],
                transformationTables: [],
                ovens: []
            });
        } else {
            // Zones côte à côte sans séparation
            const midX = Math.floor(width / 2);
            
            // Zone joueur 1 (gauche)
            zones.push({
                startX: 1,
                endX: midX - 1,
                startY: 1,
                endY: height - 2,
                spawnPoint: { x: 2, y: 2 },
                ingredientBoxes: [],
                tables: [],
                transformationTables: [],
                ovens: []
            });
            
            // Zone joueur 2 (droite)
            zones.push({
                startX: midX + 1,
                endX: width - 2,
                startY: 1,
                endY: height - 2,
                spawnPoint: { x: midX + 2, y: height - 3 },
                ingredientBoxes: [],
                tables: [],
                transformationTables: [],
                ovens: []
            });
        }
        
        return zones;
    }

    /**
     * Peuple les zones des joueurs avec les éléments
     * Distribution exclusive : pas de duplication d'éléments spéciaux entre les zones
     */
    private static populatePlayerZones(
        mapData: number[][], 
        zones: PlayerZone[], 
        availableActions: number, 
        complexity: number,
        waveLevel: number
    ): void {
        if (zones.length < 2) return;
        
        // Distribuer les éléments de manière exclusive entre les zones
        const zone1 = zones[0];
        const zone2 = zones[1];
        
        // Décider aléatoirement quelle zone a le four (l'autre aura la table de transformation)
        const zone1HasOven = Math.random() < 0.5;
        // La table de transformation est TOUJOURS dans la zone opposée au four
        const zone1HasTransformTable = !zone1HasOven;
        
        // Distribution aléatoire des ingrédients (1 type par zone, ~équilibré)
        const ingredientDistribution = this.randomizeIngredientDistribution(waveLevel);
        
        // Distribution aléatoire de la zone de livraison (uniquement pour la vague 1)
        const deliveryInZone1 = Math.random() < 0.5;

        // Placer les ingrédients selon la distribution aléatoire
        this.placeRandomIngredients(
            mapData, 
            zone1, 
            zone2, 
            ingredientDistribution
        );
        
        // Stocker la zone de livraison pour plus tard (uniquement pour la vague 1)
        if (waveLevel === 1) {
            (zone1 as any).hasDeliveryZone = deliveryInZone1;
            (zone2 as any).hasDeliveryZone = !deliveryInZone1;
        }
        
            // Placer les tables normales (équilibré) - Plus de tables pour plus d'interaction
            const elementsPerPlayer = Math.max(4, Math.floor(availableActions / 2) + 2);
            this.placeNormalTables(mapData, zone1, elementsPerPlayer);
            this.placeNormalTables(mapData, zone2, elementsPerPlayer);
        
        // Distribution exclusive des éléments spéciaux
        // Chaque zone a exactement 1 élément spécial (four XOR table de transformation)
        if (zone1HasOven) {
            // Zone 1 : Four
            this.placeOvens(mapData, zone1, complexity);
            // Zone 2 : Table de transformation
            this.placeTransformationTables(mapData, zone2, complexity);
        } else {
            // Zone 1 : Table de transformation
            this.placeTransformationTables(mapData, zone1, complexity);
            // Zone 2 : Four
            this.placeOvens(mapData, zone2, complexity);
        }
    }

    /**
     * Génère une distribution aléatoire des ingrédients
     * Garantit ~équilibre entre les zones (1 ou 2 types par zone)
     */
    private static randomizeIngredientDistribution(waveLevel: number): {
        zone1Ingredients: string[];
        zone2Ingredients: string[];
        zone1Types: number[];
        zone2Types: number[];
    } {
        const allIngredients = [
            { type: 6, name: '🍫 Chocolat' },
            { type: 7, name: '🧈 Beurre' },
            { type: 8, name: '🌾 Farine' },
            { type: 12, name: '🍬 Sucre' }
        ];
        
        // Mélanger les ingrédients de base (sans le sucre)
        const baseIngredients = allIngredients.slice(0, 3); // Chocolat, Beurre, Farine
        const shuffled = [...baseIngredients].sort(() => Math.random() - 0.5);
        
        // Distribution selon les règles : casserole dans zone avec 1 caisse, sucre dans zone avec 2 caisses
        const zone1Count = Math.random() < 0.5 ? 2 : 1;
        const zone2Count = 3 - zone1Count;
        
        const zone1Ingredients = shuffled.slice(0, zone1Count);
        const zone2Ingredients = shuffled.slice(zone1Count);
        
        // Ajouter casserole et sucre selon les règles (seulement à partir de la vague 2)
        const shouldIncludeCasserole = waveLevel >= 2;
        
        if (shouldIncludeCasserole) {
            if (zone1Count === 1) {
                // Zone 1 a 1 caisse → elle aura la casserole
                zone1Ingredients.push({ type: 13, name: '🍳 Casserole' });
                // Zone 2 a 2 caisses → elle aura le sucre
                zone2Ingredients.push({ type: 12, name: '🍬 Sucre' });
            } else {
                // Zone 1 a 2 caisses → elle aura le sucre
                zone1Ingredients.push({ type: 12, name: '🍬 Sucre' });
                // Zone 2 a 1 caisse → elle aura la casserole
                zone2Ingredients.push({ type: 13, name: '🍳 Casserole' });
            }
        }
        
        return {
            zone1Ingredients: zone1Ingredients.map(i => i.name),
            zone2Ingredients: zone2Ingredients.map(i => i.name),
            zone1Types: zone1Ingredients.map(i => i.type),
            zone2Types: zone2Ingredients.map(i => i.type)
        };
    }

    /**
     * Place les ingrédients selon la distribution aléatoire
     */
    private static placeRandomIngredients(
        mapData: number[][], 
        zone1: PlayerZone, 
        zone2: PlayerZone,
        distribution: { zone1Types: number[]; zone2Types: number[] }
    ): void {
        // Placer les ingrédients de la zone 1 avec validation
        distribution.zone1Types.forEach(ingredientType => {
            const position = this.findSafeEmptyPosition(mapData, zone1);
            if (position) {
                mapData[position.y][position.x] = ingredientType;
                zone1.ingredientBoxes.push(position);
            }
        });
        
        // Placer les ingrédients de la zone 2 avec validation
        distribution.zone2Types.forEach(ingredientType => {
            const position = this.findSafeEmptyPosition(mapData, zone2);
            if (position) {
                mapData[position.y][position.x] = ingredientType;
                zone2.ingredientBoxes.push(position);
            }
        });
    }


    /**
     * Place les tables normales dans une zone
     */
    private static placeNormalTables(mapData: number[][], zone: PlayerZone, count: number): void {
        let placed = 0;
        
        // Collecter toutes les positions disponibles d'abord
        const availablePositions: { x: number; y: number }[] = [];
        for (let y = zone.startY; y <= zone.endY; y++) {
            for (let x = zone.startX; x <= zone.endX; x++) {
                if (mapData[y][x] === 1) { // Sol libre
                    availablePositions.push({ x, y });
                }
            }
        }

        // Mélanger les positions pour un placement aléatoire
        for (let i = availablePositions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availablePositions[i], availablePositions[j]] = [availablePositions[j], availablePositions[i]];
        }

        // Placer les tables dans les positions disponibles avec validation
        let rejectedCount = 0;
        for (const pos of availablePositions) {
            if (placed >= count) break;
            
            // Vérifier que ce n'est pas le spawn ou trop proche
            if (this.isSpawnPoint(pos.x, pos.y, zone) || this.isTooCloseToSpawn(pos.x, pos.y, zone)) {
                continue;
            }
            
            // Vérifier que placer cette table ne bloquera pas l'accès
            if (this.canPlaceElementSafely(mapData, pos.x, pos.y, zone)) {
                mapData[pos.y][pos.x] = 5; // Table normale
                zone.tables.push({ x: pos.x, y: pos.y });
                placed++;
            } else {
                rejectedCount++;
            }
        }

        if (placed < count) {
            console.warn(`⚠️ Zone ${zone.startX}-${zone.endX}: ${placed}/${count} tables placées (${rejectedCount} positions rejetées pour blocage)`);
        }
    }

    /**
     * Place les tables de transformation dans une zone
     */
    private static placeTransformationTables(mapData: number[][], zone: PlayerZone, complexity: number): void {
        const count = Math.min(complexity, 2); // Max 2 tables de transformation par zone
        
        for (let i = 0; i < count; i++) {
            const position = this.findSafeEmptyPosition(mapData, zone);
            if (position) {
                mapData[position.y][position.x] = 10; // Table de transformation
                zone.transformationTables.push(position);
            }
        }
    }

    /**
     * Place les fours dans une zone
     */
    private static placeOvens(mapData: number[][], zone: PlayerZone, complexity: number): void {
        // Toujours placer au moins 1 four par zone
        const minOvens = 1;
        const maxOvens = Math.min(complexity, 2); // Max 2 fours par zone
        const ovenCount = Math.max(minOvens, maxOvens);
        
        for (let i = 0; i < ovenCount; i++) {
            const position = this.findSafeEmptyPosition(mapData, zone);
            if (position) {
                mapData[position.y][position.x] = 11; // Four
                zone.ovens.push(position);
            }
        }
    }

    /**
     * Ajoute les comptoirs de communication entre les zones
     * Note: La séparation est déjà faite avec des tables, 
     * pas besoin d'ajouter des comptoirs supplémentaires
     */
    private static addCommunicationCounters(mapData: number[][], zones: PlayerZone[]): void {
    }

    /**
     * Trouve des positions pour la communication entre les zones
     */
    private static findCommunicationPositions(
        mapData: number[][], 
        zone1: PlayerZone, 
        zone2: PlayerZone
    ): SpawnPoint[] {
        const positions: SpawnPoint[] = [];
        const separationX = Math.floor((zone1.endX + zone2.startX) / 2);
        
        // Placer des comptoirs de chaque côté du mur de séparation
        for (let y = Math.max(zone1.startY, zone2.startY); y <= Math.min(zone1.endY, zone2.endY); y += 2) {
            // Comptoir côté gauche (zone 1)
            const leftX = separationX - 1;
            if (mapData[y] && mapData[y][leftX] === 1) { // Sol libre
                positions.push({ x: leftX, y });
            }
            
            // Comptoir côté droit (zone 2)
            const rightX = separationX + 1;
            if (mapData[y] && mapData[y][rightX] === 1) { // Sol libre
                positions.push({ x: rightX, y });
            }
            
            if (positions.length >= this.COMMUNICATION_COUNTERS * 2) break;
        }
        
        return positions;
    }

    /**
     * Ajoute la zone de livraison dans une des deux zones
     */
    private static addDeliveryZone(mapData: number[][], zones: PlayerZone[]): void {
        if (zones.length < 2) return;
        
        // Trouver quelle zone doit avoir la zone de livraison
        const zone1 = zones[0];
        const zone2 = zones[1];
        
        const targetZone = (zone1 as any).hasDeliveryZone ? zone1 : zone2;
        
        // Placer la zone de livraison dans la zone choisie
        const position = this.findRandomEmptyPosition(mapData, targetZone);
        if (position) {
            mapData[position.y][position.x] = 9; // Zone de livraison
        }
    }

    /**
     * Trouve une position vide aléatoire dans une zone
     */
    private static findRandomEmptyPosition(mapData: number[][], zone: PlayerZone): SpawnPoint | null {
        const attempts = 50; // Limite les tentatives pour éviter les boucles infinies
        
        for (let i = 0; i < attempts; i++) {
            const x = zone.startX + Math.floor(Math.random() * (zone.endX - zone.startX + 1));
            const y = zone.startY + Math.floor(Math.random() * (zone.endY - zone.startY + 1));
            
            if (mapData[y][x] === 1) { // Sol libre
                // Vérifier que ce n'est pas le spawn point du joueur
                if (!this.isSpawnPoint(x, y, zone)) {
                    return { x, y };
                }
            }
        }
        
        return null;
    }

    /**
     * Valide que tous les éléments de la carte sont accessibles pour chaque joueur
     */
    private static validateAccessibility(mapData: number[][], zones: PlayerZone[]): boolean {
        if (zones.length < 2) return false;
        
        // Valider l'accessibilité pour chaque zone
        for (let i = 0; i < zones.length; i++) {
            const zone = zones[i];
            const spawnPoint = zone.spawnPoint;
            
            // Vérifier que les 4 cases autour du spawn point sont libres
            // Le joueur spawn ENTRE 4 cases en position isométrique
            const spawnX = spawnPoint.x;
            const spawnY = spawnPoint.y;
            
            const spawnTiles = [
                { x: spawnX, y: spawnY, name: "principale" },
                { x: spawnX + 1, y: spawnY, name: "droite" },
                { x: spawnX, y: spawnY + 1, name: "bas" },
                { x: spawnX + 1, y: spawnY + 1, name: "diagonale" }
            ];
            
            for (const tile of spawnTiles) {
                if (tile.y >= 0 && tile.y < mapData.length && tile.x >= 0 && tile.x < mapData[0].length) {
                    const tileValue = mapData[tile.y][tile.x];
                    if (tileValue !== 1) { // Doit être sol libre uniquement
                        console.warn(`❌ Zone ${i + 1}: Case ${tile.name} du spawn à (${tile.x}, ${tile.y}) n'est pas libre (tile: ${tileValue})`);
                        return false;
                    }
                }
            }
            
            // Vérifier que tous les éléments de la zone sont accessibles depuis le spawn
            const accessiblePositions = this.floodFill(mapData, spawnPoint, zone);
            
            // Vérifier chaque type d'élément séparément avec des logs détaillés
            
            // 1. Vérifier les boîtes d'ingrédients
            for (const pos of zone.ingredientBoxes) {
                if (!this.isPositionAccessible(pos, accessiblePositions)) {
                    console.warn(`❌ Zone ${i + 1}: Boîte d'ingrédient à (${pos.x}, ${pos.y}) inaccessible`);
                    return false;
                }
            }
            
            // 2. Vérifier les tables normales
            for (const pos of zone.tables) {
                if (!this.isPositionAccessible(pos, accessiblePositions)) {
                    console.warn(`❌ Zone ${i + 1}: Table normale à (${pos.x}, ${pos.y}) inaccessible`);
                    return false;
                }
            }
            
            // 3. Vérifier les tables de transformation
            for (const pos of zone.transformationTables) {
                if (!this.isPositionAccessible(pos, accessiblePositions)) {
                    console.warn(`❌ Zone ${i + 1}: Table de transformation à (${pos.x}, ${pos.y}) inaccessible`);
                    return false;
                }
            }
            
            // 4. Vérifier les fours
            for (const pos of zone.ovens) {
                if (!this.isPositionAccessible(pos, accessiblePositions)) {
                    console.warn(`❌ Zone ${i + 1}: Four à (${pos.x}, ${pos.y}) inaccessible`);
                    return false;
                }
            }
            
            // 5. Vérifier la zone de livraison si elle est dans cette zone
            // La zone de livraison est solide, on vérifie qu'elle est accessible (cases adjacentes)
            const deliveryZone = this.findDeliveryZone(mapData, zone);
            if (deliveryZone && !this.isPositionAccessible(deliveryZone, accessiblePositions)) {
                console.warn(`❌ Zone ${i + 1}: Zone de livraison à (${deliveryZone.x}, ${deliveryZone.y}) inaccessible`);
                return false;
            }
            
            // 6. Vérifier que TOUTES les cases de sol libre de la zone sont accessibles
            const totalFloorTiles = this.countFloorTiles(mapData, zone);
            const accessibleFloorTiles = accessiblePositions.size;
            
            if (accessibleFloorTiles < totalFloorTiles) {
                console.warn(`❌ Zone ${i + 1}: ${totalFloorTiles - accessibleFloorTiles} cases de sol inaccessibles (${accessibleFloorTiles}/${totalFloorTiles})`);
                return false;
            }
        }
        
        return true;
    }

    /**
     * Trouve la zone de livraison dans une zone donnée
     */
    private static findDeliveryZone(mapData: number[][], zone: PlayerZone): SpawnPoint | null {
        for (let y = zone.startY; y <= zone.endY; y++) {
            for (let x = zone.startX; x <= zone.endX; x++) {
                if (mapData[y][x] === 9) { // Zone de livraison
                    return { x, y };
                }
            }
        }
        return null;
    }

    /**
     * Vérifie si un élément peut être placé sans bloquer l'accès à d'autres zones
     */
    private static canPlaceElementSafely(
        mapData: number[][], 
        x: number, 
        y: number, 
        zone: PlayerZone
    ): boolean {
        // Compter les cases accessibles AVANT le placement
        const accessibleBefore = this.floodFill(mapData, zone.spawnPoint, zone);
        const totalBefore = accessibleBefore.size;
        
        // Créer une copie temporaire de la carte avec l'élément placé
        const tempMapData = mapData.map(row => [...row]);
        tempMapData[y][x] = 5; // Placer temporairement l'élément (table/objet solide)
        
        // Compter les cases accessibles APRÈS le placement
        const accessibleAfter = this.floodFill(tempMapData, zone.spawnPoint, zone);
        const totalAfter = accessibleAfter.size;
        
        // Le placement est sûr si on ne perd qu'UNE SEULE case (celle où on place l'élément)
        // Si on perd plus d'une case, ça veut dire qu'on a bloqué l'accès à d'autres cases
        const lostCases = totalBefore - totalAfter;
        
        // On doit perdre exactement 1 case (celle où on place l'élément)
        // Si on perd 0 cases, c'est bizarre (la case n'était pas accessible?)
        // Si on perd >1 cases, on a bloqué l'accès à d'autres cases
        return lostCases === 1;
    }

    /**
     * Trouve une position vide sûre qui ne bloquera pas l'accès
     */
    private static findSafeEmptyPosition(mapData: number[][], zone: PlayerZone): SpawnPoint | null {
        const attempts = 100; // Plus d'attempts pour trouver une position sûre
        let rejectedCount = 0;
        
        for (let i = 0; i < attempts; i++) {
            const x = zone.startX + Math.floor(Math.random() * (zone.endX - zone.startX + 1));
            const y = zone.startY + Math.floor(Math.random() * (zone.endY - zone.startY + 1));
            
            if (mapData[y][x] === 1) { // Sol libre
                // Vérifier que ce n'est pas le spawn point du joueur ou trop proche
                if (this.isSpawnPoint(x, y, zone) || this.isTooCloseToSpawn(x, y, zone)) {
                    continue; // Passer à la position suivante
                }
                
                // Vérifier que placer un élément ici ne bloquera pas l'accès
                if (this.canPlaceElementSafely(mapData, x, y, zone)) {
                    return { x, y };
                } else {
                    rejectedCount++;
                }
            }
        }
        
        console.warn(`⚠️ Aucune position sûre trouvée après ${attempts} tentatives (${rejectedCount} rejets pour blocage)`);
        // Si aucune position sûre n'est trouvée, retourner null pour forcer la régénération
        return null;
    }

    /**
     * Vérifie si une position est un point de spawn
     */
    private static isSpawnPoint(x: number, y: number, zone: PlayerZone): boolean {
        return zone.spawnPoint.x === x && zone.spawnPoint.y === y;
    }

    /**
     * Vérifie si une position est trop proche du spawn point (pour laisser de l'espace)
     * Le joueur spawn ENTRE 4 cases, donc on doit protéger les 4 cases autour du point de spawn
     */
    private static isTooCloseToSpawn(x: number, y: number, zone: PlayerZone): boolean {
        const spawnX = zone.spawnPoint.x;
        const spawnY = zone.spawnPoint.y;
        
        // Le joueur spawn au coin entre 4 cases, donc on protège:
        // (spawnX, spawnY), (spawnX+1, spawnY), (spawnX, spawnY+1), (spawnX+1, spawnY+1)
        // Et aussi les cases adjacentes pour laisser de l'espace
        
        const isInSpawnArea = 
            (x === spawnX && y === spawnY) ||           // Case principale
            (x === spawnX + 1 && y === spawnY) ||       // Case droite
            (x === spawnX && y === spawnY + 1) ||       // Case bas
            (x === spawnX + 1 && y === spawnY + 1) ||   // Case diagonale
            (x === spawnX - 1 && y === spawnY) ||       // Case gauche
            (x === spawnX && y === spawnY - 1) ||       // Case haut
            (x === spawnX + 1 && y === spawnY - 1) ||   // Case haut-droite
            (x === spawnX - 1 && y === spawnY + 1) ||   // Case bas-gauche
            (x === spawnX - 1 && y === spawnY - 1) ||   // Case haut-gauche
            (x === spawnX + 2 && y === spawnY) ||       // Case droite+1
            (x === spawnX && y === spawnY + 2) ||       // Case bas+1
            (x === spawnX + 1 && y === spawnY + 2) ||   // Case bas-droite
            (x === spawnX + 2 && y === spawnY + 1);     // Case droite-bas
        
        return isInSpawnArea;
    }

    /**
     * Compte le nombre total de cases de sol libre dans une zone
     */
    private static countFloorTiles(mapData: number[][], zone: PlayerZone): number {
        let count = 0;
        
        for (let y = zone.startY; y <= zone.endY; y++) {
            for (let x = zone.startX; x <= zone.endX; x++) {
                const tile = mapData[y][x];
                // Compter uniquement les cases marchables (sol libre)
                if (tile === 1) {
                    count++;
                }
            }
        }
        
        return count;
    }

    /**
     * Algorithme de flood fill pour trouver toutes les positions accessibles
     */
    private static floodFill(
        mapData: number[][], 
        start: SpawnPoint, 
        zone: PlayerZone
    ): Set<string> {
        const accessible = new Set<string>();
        const queue: SpawnPoint[] = [start];
        
        while (queue.length > 0) {
            const current = queue.shift()!;
            const key = `${current.x},${current.y}`;
            
            // Si déjà visité, passer
            if (accessible.has(key)) continue;
            
            // Vérifier si la position est dans la zone
            if (current.x < zone.startX || current.x > zone.endX ||
                current.y < zone.startY || current.y > zone.endY) {
                continue;
            }
            
            // Vérifier si la position est valide
            const tile = mapData[current.y][current.x];
            
            // Les joueurs peuvent marcher uniquement sur le sol libre (1)
            // La zone de livraison (9) est maintenant solide
            const isWalkable = tile === 1;
            
            if (!isWalkable) continue;
            
            // Marquer comme accessible
            accessible.add(key);
            
            // Ajouter les voisins à la queue
            const neighbors = [
                { x: current.x + 1, y: current.y },     // Droite
                { x: current.x - 1, y: current.y },     // Gauche
                { x: current.x, y: current.y + 1 },     // Bas
                { x: current.x, y: current.y - 1 }      // Haut
            ];
            
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;
                if (!accessible.has(neighborKey)) {
                    queue.push(neighbor);
                }
            }
        }
        
        return accessible;
    }

    /**
     * Vérifie si une position est accessible (adjacente à une case accessible)
     */
    private static isPositionAccessible(
        position: SpawnPoint, 
        accessiblePositions: Set<string>
    ): boolean {
        // Une position est accessible si au moins une case adjacente est accessible
        const adjacentPositions = [
            { x: position.x + 1, y: position.y },     // Droite
            { x: position.x - 1, y: position.y },     // Gauche
            { x: position.x, y: position.y + 1 },     // Bas
            { x: position.x, y: position.y - 1 }      // Haut
        ];
        
        for (const adj of adjacentPositions) {
            const key = `${adj.x},${adj.y}`;
            if (accessiblePositions.has(key)) {
                return true;
            }
        }
        
        return false;
    }
}
