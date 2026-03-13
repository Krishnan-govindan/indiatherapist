import { Router } from 'express';

const router = Router();

// TODO: implement appointment endpoints
// POST  /api/appointments             — create appointment for a lead
// GET   /api/appointments/:id         — get appointment details
// PATCH /api/appointments/:id/status  — update appointment status
// POST  /api/appointments/:id/slots   — record offered slots from therapist

router.get('/', (_req, res) => {
  res.json({ message: 'appointments route — coming soon' });
});

export default router;
