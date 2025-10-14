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

// Lire le leaderboard
const readLeaderboard = (): LeaderboardData => {
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

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Méthode non autorisée" });
    }

    try {
        const leaderboard = readLeaderboard();
        const limit = parseInt(req.query.limit as string) || 10;

        // Retourner les N meilleurs scores
        const topScores = leaderboard.scores.slice(0, limit);

        res.status(200).json({
            success: true,
            scores: topScores,
            total: leaderboard.scores.length,
        });
    } catch (error) {
        console.error("Erreur récupération leaderboard:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
}

