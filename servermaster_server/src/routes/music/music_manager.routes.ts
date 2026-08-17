import { Router } from 'express';
import { streamScanProgress } from '../../controllers/music/music_manager.controller.ts';
//import { getUserById, createUser } from '../controllers/user.controller.js';

const router = Router();

router.get('/', streamScanProgress);
// router.post('/', createUser);


export default router;