const express = require("express");
const { Sequelize } = require("sequelize");
const { noteModel } = require("./Note");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

const sequelize = new Sequelize("sql", "postgres", "kantarci12", {
  host: "localhost",
  dialect: "postgres",
});

const Note = noteModel(sequelize);

const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
    await sequelize.sync();
    console.log("Table created successfully");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

initializeDatabase();

app.post("/notes", async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res
        .status(400)
        .json({ error: "Title and description are required" });
    }

    const newNote = await Note.create({ title, description });

    res.status(201).json(newNote);
  } catch (error) {
    console.error("Error creating note:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/notes", async (req, res) => {
  try {
    const { page = 1, limit = 10, title } = req.query;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const offset = (pageNumber - 1) * limitNumber;

    const where = title
      ? { title: { [Sequelize.Op.iLike]: `%${title}%` } }
      : {};

    const { count, rows } = await Note.findAndCountAll({
      where,
      offset,
      limit: limitNumber,
      order: [["updatedAt", "DESC"]],
    });

    const totalPages = Math.ceil(count / limitNumber);

    res.status(200).json({
      data: rows,
      metadata: {
        totalNotes: count,
        totalPages,
        currentPage: pageNumber > totalPages ? totalPages : pageNumber,
      },
    });
  } catch (error) {
    console.error("Error retrieving notes:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/notes/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deletedNote = await Note.destroy({ where: { id } });

    if (!deletedNote) {
      return res.status(404).json({ error: "Note not found" });
    }

    res.status(200).json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/notes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    if (!title || !description) {
      return res
        .status(400)
        .json({ error: "Title and description are required" });
    }

    const [updated] = await Note.update(
      { title, description },
      { where: { id } }
    );

    if (!updated) {
      return res.status(404).json({ error: "Note not found" });
    }

    const updatedNote = await Note.findOne({ where: { id } });

    res.status(200).json({ message: "Note updated successfully", updatedNote });
  } catch (error) {
    console.error("Error updating note:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/notes/delete-many", async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json({ error: "Invalid or empty array of note IDs" });
    }

    const deletedNotes = await Note.destroy({ where: { id: ids } });

    if (deletedNotes === 0) {
      return res.status(404).json({ error: "No notes found to delete" });
    }

    res.status(200).json({
      message: "Notes deleted successfully",
      deletedCount: deletedNotes,
    });
  } catch (error) {
    console.error("Error deleting notes:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
