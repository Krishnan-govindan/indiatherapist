import { Router } from 'express';

const router = Router();

// TODO: implement therapist endpoints
// GET  /api/therapists        — list active therapists (public)
// GET  /api/therapists/:slug  — get therapist profile by slug (public)

router.get('/', (_req, res) => {
  res.json({ message: 'therapists route — coming soon' });
});

export default router;
