const { Sequelize } = require("sequelize");

const noteModel = (sequelize) => {
  const { DataTypes } = Sequelize;

  return sequelize.define("notes", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  });
};

module.exports = { noteModel };
