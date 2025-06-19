const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Category extends Model {}

  Category.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      type: {
        type: DataTypes.ENUM('income', 'expense'),
        allowNull: false
      },
      color: {
        type: DataTypes.STRING(7),
        allowNull: true,
        defaultValue: '#4CAF50'
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      }
    },
    {
      sequelize,
      modelName: 'Category',
      tableName: 'categories',
      timestamps: true,
      underscored: true
    }
  );

  Category.associate = (models) => {
    Category.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    Category.hasMany(models.Transaction, {
      foreignKey: 'category_id',
      as: 'transactions'
    });
  };

  return Category;
}; 