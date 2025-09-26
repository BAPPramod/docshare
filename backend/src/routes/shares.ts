import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { shareDocument, unshareDocument, getUsers } from '../controllers/shareController';

const router = Router();

router.use(authenticate);

router.post('/:id/share', shareDocument);
router.delete('/:id/unshare', unshareDocument);
router.get('/users', getUsers);

export default router;