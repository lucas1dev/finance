const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class CustomerType extends Model {
    static associate(models) {
      this.belongsTo(models.Customer, {
        foreignKey: 'customer_id',
        as: 'customer'
      });
    }
  }

  CustomerType.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM('customer', 'supplier'),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'CustomerType',
    tableName: 'customer_types',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['customer_id', 'type']
      }
    ]
  });

  return CustomerType;
}; 