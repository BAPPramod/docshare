import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const shareDocument = async (req: AuthRequest, res: Response) => {
  try {
    const documentId = parseInt(req.params.id);
    const { email } = req.body;
    const userId = req.user!.userId;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user owns the document
    const document = await prisma.document.findFirst({
      where: { id: documentId, ownerId: userId }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found or not owned by you' });
    }

    // Find the user to share with
    const targetUser = await prisma.user.findUnique({ where: { email } });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser.id === userId) {
      return res.status(400).json({ error: 'Cannot share with yourself' });
    }

    // Check if already shared
    const existingShare = await prisma.documentShare.findUnique({
      where: {
        documentId_userId: {
          documentId,
          userId: targetUser.id
        }
      }
    });

    if (existingShare) {
      return res.status(400).json({ error: 'Document already shared with this user' });
    }

    const share = await prisma.documentShare.create({
      data: {
        documentId,
        userId: targetUser.id
      },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    res.status(201).json(share);
  } catch (error) {
    res.status(500).json({ error: 'Failed to share document' });
  }
};

export const unshareDocument = async (req: AuthRequest, res: Response) => {
  try {
    const documentId = parseInt(req.params.id);
    const { userId: targetUserId } = req.body;
    const userId = req.user!.userId;

    // Check if user owns the document
    const document = await prisma.document.findFirst({
      where: { id: documentId, ownerId: userId }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found or not owned by you' });
    }

    await prisma.documentShare.delete({
      where: {
        documentId_userId: {
          documentId,
          userId: targetUserId
        }
      }
    });

    res.json({ message: 'Document unshared successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to unshare document' });
  }
};

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const search = req.query.search as string;

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: userId } },
          search ? {
            OR: [
              { email: { contains: search } },
              { name: { contains: search } }
            ]
          } : {}
        ]
      },
      select: { id: true, name: true, email: true },
      take: 10
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};