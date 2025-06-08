// 'use strict';
// const {
//   Model
// } = require('sequelize');

import psql from 'sequelize'
import DB from '../config/db.mjs'

// module.exports = (sequelize, DataTypes) => {

class restricted_phones extends psql.Model {
  /**
   * Helper method for defining associations.
   * This method is not a part of Sequelize lifecycle.
   * The `models/index` file will call this method automatically.
   */
  static associate(models) {
    // define association here
  }
}
restricted_phones.init({
  id: {
    autoIncrement: true,
    type: psql.INTEGER,
    allowNull: false,
    primaryKey: true,
  },
  phone: psql.STRING,
  blocked_at: psql.DATE,
  message_received: psql.STRING,
  active: psql.BOOLEAN,
  created_at: psql.DATE
}, {
  sequelize: DB.connection(),
  modelName: 'restricted_phones',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});
export default restricted_phones;
// };