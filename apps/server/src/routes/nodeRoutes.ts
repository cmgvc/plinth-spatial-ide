import express from 'express';
import Node from '../models/Node';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const nodes = await Node.find();
    res.json(nodes);
  } catch (err) {
    res.status(500).json({ message: "Error fetching nodes" });
  }
});

router.post('/sync', async (req, res) => {
  try {
    const { nodes } = req.body; 

    const ops = nodes.map((node: any) => ({
      updateOne: {
        filter: { id: node.id },
        update: { $set: node },
        upsert: true,
      },
    }));

    await Node.bulkWrite(ops);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Error syncing nodes" });
  }
});

router.delete('/clear', async (req, res) => {
  try {
    await Node.deleteMany({});
    res.json({ message: "Workspace cleared" });
  } catch (err) {
    res.status(500).json({ message: "Error clearing nodes" });
  }
});

export default router;