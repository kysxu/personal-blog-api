import { Router } from "express";

const profilesRouter = Router();

profilesRouter.get("/", (req, res) => {
  return res.json({
    data: {
      name: "john",
      age: 20,
    },
  });
});

export default profilesRouter;
