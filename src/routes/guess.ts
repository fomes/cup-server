import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate } from "../plugins/authenticate";

export async function guessRoutes(fastify: FastifyInstance) {
  fastify.get("/guesses/count", async () => {
    const count = await prisma.guess.count();

    return { count };
  });

  fastify.post(
    "/pools/:poolId/games/:gameId/guesses",
    { onRequest: [authenticate] },
    async (req, res) => {
      const createGuessParams = z.object({
        poolId: z.string(),
        gameId: z.string(),
      });

      const createGuessBody = z.object({
        firstTeamPoints: z.number(),
        secondTeamPoints: z.number(),
      });

      const { poolId, gameId } = createGuessParams.parse(req.params);
      const { firstTeamPoints, secondTeamPoints } = createGuessBody.parse(
        req.body
      );

      const participant = await prisma.participant.findUnique({
        where: {
          userId_poolId: {
            poolId,
            userId: req.user.sub,
          },
        },
      });

      if (!participant) {
        return res.status(400).send({
          message: "Você não tem permissão para participar desse bolão!",
        });
      }

      const guess = await prisma.guess.findUnique({
        where: {
          participantId_gameId: {
            participantId: participant.id,
            gameId,
          },
        },
      });

      if (guess) {
        return res
          .status(400)
          .send({ message: "Você já fez um palpite nesse jogo!" });
      }

      const game = await prisma.game.findUnique({
        where: {
          id: gameId,
        },
      });

      if (!game) {
        return res.status(400).send({
          message: "Game não encontrado!",
        });
      }

      if (game.date < new Date()) {
        return res.status(400).send({
          message: "Vocẽ não pode participar depois da data do jogo",
        });
      }

      await prisma.guess.create({
        data: {
          gameId,
          participantId: participant.id,
          firstTeamPoints,
          secondTeamPoints,
        },
      });

      return res.status(201).send();
    }
  );
}
