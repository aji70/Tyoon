import Game from "../models/Game.js";
import GameSetting from "../models/GameSetting.js";

/**
 * Game Controller
 *
 * Handles requests related to game sessions.
 */
const gameController = {
  // -------------------------
  // 🔹 CRUD
  // -------------------------

  async create(req, res) {
    try {
      // 1. Create game
      const game = await Game.create(req.body);

      // 2. Insert default game settings automatically
      const defaultSettings = {
        game_id: game.id,
        auction: false,
        rent_in_prison: false,
        mortgage: false,
        even_build: false,
        randomize_play_order: false,
        starting_cash: 1500,
      };

      const settings = await GameSetting.create(defaultSettings);

      res.status(201).json({
        ...game,
        settings, // include settings in response
      });
    } catch (error) {
      console.error("Error creating game with settings:", error);
      res.status(400).json({ error: error.message });
    }
  },

  async findById(req, res) {
    try {
      const game = await Game.findById(req.params.id);
      if (!game) return res.status(404).json({ error: "Game not found" });

      // Attach settings
      const settings = await GameSetting.findByGameId(game.id);

      res.json({ ...game, settings });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async findAll(req, res) {
    try {
      const { limit, offset } = req.query;
      const games = await Game.findAll({
        limit: Number.parseInt(limit) || 100,
        offset: Number.parseInt(offset) || 0,
      });

      // Eager load settings for each game
      const withSettings = await Promise.all(
        games.map(async (g) => ({
          ...g,
          settings: await GameSetting.findByGameId(g.id),
        }))
      );

      res.json(withSettings);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async update(req, res) {
    try {
      const game = await Game.update(req.params.id, req.body);
      res.json(game);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async remove(req, res) {
    try {
      await Game.delete(req.params.id);
      res.json({ message: "Game deleted" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // -------------------------
  // 🔹 Extra Endpoints
  // -------------------------

  async findByCode(req, res) {
    try {
      const game = await Game.findByCode(req.params.code);
      if (!game) return res.status(404).json({ error: "Game not found" });
      res.json(game);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async findByWinner(req, res) {
    try {
      const { limit, offset } = req.query;
      const games = await Game.findByWinner(req.params.userId, {
        limit: Number.parseInt(limit) || 50,
        offset: Number.parseInt(offset) || 0,
      });
      res.json(games);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async findByCreator(req, res) {
    try {
      const { limit, offset } = req.query;
      const games = await Game.findByCreator(req.params.userId, {
        limit: Number.parseInt(limit) || 50,
        offset: Number.parseInt(offset) || 0,
      });
      res.json(games);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async findActive(req, res) {
    try {
      const { limit, offset } = req.query;
      const games = await Game.findActiveGames({
        limit: Number.parseInt(limit) || 50,
        offset: Number.parseInt(offset) || 0,
      });
      res.json(games);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

export default gameController;
