import Property from "../models/Property.js";

/**
 * Property Controller
 *
 * Handles requests related to property
 */
const propertyController = {
  // -------------------------
  // 🔹 CRUD
  // -------------------------

  async create(req, res) {
    try {
      const property = await Property.create(req.body);
      res.status(201).json(property);
    } catch (error) {
      console.error("Error creating property:", error);
      res.status(400).json({ error: error.message });
    }
  },

  async findById(req, res) {
    try {
      const property = await Property.findById(req.params.id);
      if (!property) return res.status(404).json({ error: "Property not found" });
      res.json(property);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async findAll(req, res) {
    try {
      const { limit, offset } = req.query;
      const propertys = await Property.findAll({
        limit: Number.parseInt(limit) || 100,
        offset: Number.parseInt(offset) || 0,
      });
      res.json(propertys);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async update(req, res) {
    try {
      const property = await Property.update(req.params.id, req.body);
      res.json(property);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async remove(req, res) {
    try {
      await Property.delete(req.params.id);
      res.json({ message: "Property deleted" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

export default propertyController;
