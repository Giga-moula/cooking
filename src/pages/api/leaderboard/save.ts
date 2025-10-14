import fs from "fs";
import type { NextApiRequest, NextApiResponse } from "next";
import path from "path";

interface ScoreEntry {
    playerName: string;
    score: number;
    deliveries: number;
    timestamp: string;
}

interface LeaderboardData {
    scores: ScoreEntry[];
}

const LEADERBOARD_FILE = path.join(process.cwd(), "data", "leaderboard.json");

// Créer le dossier data s'il n'existe pas
const ensureDataDirectory = () => {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
};

// Lire le leaderboard
const readLeaderboard = (): LeaderboardData => {
    ensureDataDirectory();

    if (!fs.existsSync(LEADERBOARD_FILE)) {
        return { scores: [] };
    }

    try {
        const data = fs.readFileSync(LEADERBOARD_FILE, "utf-8");
        return JSON.parse(data);
    } catch (error) {
        console.error("Erreur lecture leaderboard:", error);
        return { scores: [] };
    }
};

// Écrire le leaderboard
const writeLeaderboard = (data: LeaderboardData): void => {
    ensureDataDirectory();
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(data, null, 2));
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Méthode non autorisée" });
    }

    const { playerName, score, deliveries } = req.body;

    // Validation
    if (
        !playerName ||
        typeof score !== "number" ||
        typeof deliveries !== "number"
    ) {
        return res.status(400).json({ error: "Données invalides" });
    }

    // Limiter la longueur du nom
    const sanitizedName = playerName.substring(0, 20);

    try {
        // Lire le leaderboard actuel
        const leaderboard = readLeaderboard();

        // Ajouter le nouveau score
        const newEntry: ScoreEntry = {
            playerName: sanitizedName,
            score,
            deliveries,
            timestamp: new Date().toISOString(),
        };

        leaderboard.scores.push(newEntry);

        // Trier par score décroissant et garder les 100 meilleurs
        leaderboard.scores.sort((a, b) => b.score - a.score);
        leaderboard.scores = leaderboard.scores.slice(0, 100);

        // Sauvegarder
        writeLeaderboard(leaderboard);

        // Trouver le rang du joueur
        const rank =
            leaderboard.scores.findIndex(
                (entry) =>
                    entry.playerName === sanitizedName &&
                    entry.score === score &&
                    entry.timestamp === newEntry.timestamp
            ) + 1;

        res.status(200).json({
            success: true,
            rank,
            totalScores: leaderboard.scores.length,
        });
    } catch (error) {
        console.error("Erreur sauvegarde score:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
}

