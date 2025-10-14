/**
 * Service pour interagir avec le leaderboard
 */

export interface ScoreEntry {
    playerName: string;
    score: number;
    deliveries: number;
    timestamp: string;
}

export interface SaveScoreResponse {
    success: boolean;
    rank?: number;
    totalScores?: number;
    error?: string;
}

export interface GetScoresResponse {
    success: boolean;
    scores?: ScoreEntry[];
    total?: number;
    error?: string;
}

export class LeaderboardService {
    /**
     * Sauvegarde un score dans le leaderboard
     */
    static async saveScore(
        playerName: string,
        score: number,
        deliveries: number
    ): Promise<SaveScoreResponse> {
        try {
            const response = await fetch("/api/leaderboard/save", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    playerName,
                    score,
                    deliveries,
                }),
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Erreur sauvegarde score:", error);
            return {
                success: false,
                error: "Erreur de connexion au serveur",
            };
        }
    }

    /**
     * Récupère les meilleurs scores
     */
    static async getTopScores(limit: number = 10): Promise<GetScoresResponse> {
        try {
            const response = await fetch(`/api/leaderboard/get?limit=${limit}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Erreur récupération scores:", error);
            return {
                success: false,
                error: "Erreur de connexion au serveur",
            };
        }
    }
}

