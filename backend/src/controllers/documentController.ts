import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

export const uploadDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const document = await prisma.document.create({
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        ownerId: req.user!.userId
      },
      include: {
        owner: { select: { id: true, name: true, email: true } }
      }
    });

    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload document' });
  }
};

export const getDocuments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const [ownedDocs, sharedDocs] = await Promise.all([
      prisma.document.findMany({
        where: { ownerId: userId },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          shares: { include: { user: { select: { id: true, name: true, email: true } } } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.document.findMany({
        where: {
          shares: { some: { userId } }
        },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          shares: { include: { user: { select: { id: true, name: true, email: true } } } }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    res.json({
      owned: ownedDocs,
      shared: sharedDocs
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
};

const getAuthorizedDocument = async (documentId: number, userId: number) => {
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      OR: [
        { ownerId: userId },
        { shares: { some: { userId } } }
      ]
    }
  });

  if (!document) {
    return null;
  }

  const filePath = path.resolve(document.path);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return { document, filePath };
};

export const viewDocument = async (req: AuthRequest, res: Response) => {
  try {
    const documentId = parseInt(req.params.id);
    const userId = req.user!.userId;

    const result = await getAuthorizedDocument(documentId, userId);
    if (!result) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const { document, filePath } = result;

    await prisma.auditLog.create({
      data: {
        action: 'view',
        documentId,
        userId
      }
    });

    res.setHeader('Content-Type', document.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(document.originalName)}"`
    );
    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ error: 'Failed to view document' });
  }
};

export const downloadDocument = async (req: AuthRequest, res: Response) => {
  try {
    const documentId = parseInt(req.params.id);
    const userId = req.user!.userId;

    const result = await getAuthorizedDocument(documentId, userId);
    if (!result) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const { document, filePath } = result;

    await prisma.auditLog.create({
      data: {
        action: 'download',
        documentId,
        userId
      }
    });

    res.download(filePath, document.originalName);
  } catch (error) {
    res.status(500).json({ error: 'Failed to download document' });
  }
};

export const deleteDocument = async (req: AuthRequest, res: Response) => {
  try {
    const documentId = parseInt(req.params.id);
    const userId = req.user!.userId;

    const document = await prisma.document.findFirst({
      where: { id: documentId, ownerId: userId }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete file from disk
    if (fs.existsSync(document.path)) {
      fs.unlinkSync(document.path);
    }

    await prisma.document.delete({ where: { id: documentId } });

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete document' });
  }
};