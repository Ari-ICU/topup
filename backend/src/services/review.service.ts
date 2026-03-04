import { prisma } from "../lib/prisma.js";

// Public Services
export const getApprovedReviews = async () => {
    return prisma.review.findMany({
        where: { isApproved: true },
        orderBy: { createdAt: 'desc' },
        take: 10, // Get top 10 most recent
    });
};

export const createReview = async (data: { name: string; gameName: string; rating: number; comment: string }) => {
    return prisma.review.create({
        data: {
            name: data.name,
            gameName: data.gameName,
            rating: data.rating,
            comment: data.comment,
            isApproved: false, // Always false initially
        }
    });
};

// Admin Services
export const getAllReviews = async () => {
    return prisma.review.findMany({
        orderBy: { createdAt: 'desc' }
    });
};

export const approveReview = async (id: string, isApproved: boolean) => {
    return prisma.review.update({
        where: { id },
        data: { isApproved }
    });
};

export const deleteReview = async (id: string) => {
    return prisma.review.delete({
        where: { id }
    });
};
