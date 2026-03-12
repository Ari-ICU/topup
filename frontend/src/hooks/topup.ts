"use client";

import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { Game, GamePackage, TransactionStatus, VerifyStatus } from "@/types";
import { historyService } from "@/lib/history";


// ─── useGameData ─────────────────────────────────────────────────────────────
// Fetches game details and packages from the API for the given gameId/slug.
export function useGame(gameId: string | string[] | undefined) {
    const [game, setGame] = useState<Game | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!gameId) return;

        const fetchGame = async () => {
            try {
                setLoading(true);
                const data = await apiRequest<Game>(`/games/${gameId}`);
                setGame(data);
                setError(null);
            } catch (err: any) {
                console.error(`[useGame] API failed for ${gameId}:`, err);
                setError(err.message ?? "Failed to load game.");
            } finally {
                setLoading(false);
            }
        };

        fetchGame();
    }, [gameId]);

    return { game, error, loading };
}

// ─── useVerifyAccount ─────────────────────────────────────────────────────────
// Manages the account verification flow.
export function useVerifyAccount() {
    const [isVerifying, setIsVerifying] = useState(false);
    const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>("idle");
    const [verifiedName, setVerifiedName] = useState<string | null>(null);
    const [verifyError, setVerifyError] = useState<string | null>(null);

    const verify = async (gameSlug: string, userId: string, zoneId: string) => {
        if (!userId.trim()) return;

        setIsVerifying(true);
        setVerifyStatus("idle");
        setVerifiedName(null);
        setVerifyError(null);

        try {
            const res = await fetch(`/api/verify/${gameSlug}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: userId.trim(), zoneId: zoneId.trim() }),
            });

            const result: {
                verified: boolean;
                playerName?: string;
                reason?: string;
                formatValid?: boolean;
            } = await res.json();

            if (result.verified && result.playerName) {
                setVerifyStatus("success");
                setVerifiedName(result.playerName);
            } else if (result.formatValid) {
                setVerifyStatus("format-ok");
            } else {
                setVerifyStatus("error");
                setVerifyError(result.reason ?? "Player not found. Check your ID and Zone ID.");
            }
        } catch {
            setVerifyStatus("error");
            setVerifyError("Could not connect to verification server. Please try again.");
        } finally {
            setIsVerifying(false);
        }
    };

    const reset = () => {
        setVerifyStatus("idle");
        setVerifiedName(null);
        setVerifyError(null);
    };

    const prefill = (name: string) => {
        setVerifyStatus("success");
        setVerifiedName(name);
        setVerifyError(null);
    };

    return { isVerifying, verifyStatus, verifiedName, verifyError, verify, reset, prefill };
}

// ─── useTransaction ───────────────────────────────────────────────────────────
// Manages the full lifecycle of a top-up transaction.
export function useTransaction() {
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<TransactionStatus>("IDLE");
    const [error, setError] = useState<string | null>(null);
    const [transactionId, setTransactionId] = useState<string | null>(null);
    const [paymentData, setPaymentData] = useState<{ qrCode: string; md5: string } | null>(null);

    // ── Polling logic for Bakong/KHQR ──────────────────────────────────────────
    useEffect(() => {
        if (status !== "PROCESSING" || !transactionId) return;

        console.log(`[useTransaction] Starting polling for TxID: ${transactionId}`);

        const pollInterval = setInterval(async () => {
            try {
                const res = await apiRequest<any>(`/transactions/${transactionId}/check-payment`, {
                    method: "POST",
                    body: JSON.stringify({ md5: paymentData?.md5 })
                });

                if (res.status === "COMPLETED") {
                    console.log(`[useTransaction] ✅ Payment confirmed for ${transactionId}`);
                    setPaymentData(null);
                    setStatus("COMPLETED");
                    historyService.updateStatus(transactionId, "COMPLETED");
                    clearInterval(pollInterval);
                } else if (res.status === "PROCESSING") {
                    // Payment verified, but delivery is still in progress
                    console.log(`[useTransaction] 💰 Payment verified, delivering... ${transactionId}`);
                    setPaymentData(null); // Hide QR modal now that user has paid
                    setStatus("PROCESSING");
                    historyService.updateStatus(transactionId, "PROCESSING");
                }
            } catch (err) {
                console.warn("[useTransaction] Polling check failed (will retry):", err);
            }
        }, 4000); // Poll every 4 seconds

        return () => clearInterval(pollInterval);
    }, [status, transactionId, paymentData]);

    const submit = async (params: {
        packageId: string;
        userId: string;
        zoneId: string;
        paymentMethod: string;
        playerName?: string;
    }) => {
        setIsLoading(true);
        setStatus("PENDING");
        setError(null);
        setTransactionId(null);

        try {
            const data = await apiRequest<any>("/transactions", {
                method: "POST",
                body: JSON.stringify({
                    packageId: params.packageId,
                    playerInfo: {
                        playerId: params.userId,
                        zoneId: params.zoneId,
                        playerName: params.playerName
                    },
                    paymentMethod: params.paymentMethod.toUpperCase(),
                }),
            });

            setTransactionId(data.id);

            // Record in local history
            historyService.add({
                id: data.id,
                gameName: params.playerName || "Gaming Platform",
                packageName: "Top-up Order",
                amount: data.totalAmount || 0,
                status: data.paymentData ? "PENDING" : "COMPLETED"
            });

            if (data.paymentData) {
                setPaymentData(data.paymentData);
                setStatus("PROCESSING");
            } else {
                setStatus("COMPLETED");
            }
        } catch (err: any) {
            setError(err.message ?? "Transaction failed.");
            setStatus("FAILED");
        } finally {
            setIsLoading(false);
        }
    };

    const reset = () => {
        setStatus("IDLE");
        setError(null);
        setPaymentData(null);
        setTransactionId(null);
    };

    return { isLoading, status, error, paymentData, transactionId, submit, reset, setPaymentData, setStatus };
}
