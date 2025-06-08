// 'use strict';
// const {
//   Model
// } = require('sequelize');
// module.exports = (sequelize, DataTypes) => {

import psql from 'sequelize'
import DB from '../config/db.mjs'
import messages_sent from './messages_sent.mjs';
import executed_queries from './executed_queries.mjs';
class users extends psql.Model {
  /**
   * Helper method for defining associations.
   * This method is not a part of Sequelize lifecycle.
   * The `models/index` file will call this method automatically.
   */
  static associate(models) {
    // define association here
    users.hasMany(messages_sent, { foreignKey: 'id_user' })
    users.hasMany(executed_queries, { foreignKey: 'id_user'})
  }
}
users.init({
  id: {
    autoIncrement: true,
    type: psql.INTEGER,
    allowNull: false,
    primaryKey: true,
  },
  name: psql.STRING,
  last_name: psql.STRING,
  user: { type: psql.STRING, unique: true },
  password: psql.STRING,
  active: psql.BOOLEAN
}, {
  sequelize: DB.connection(),
  modelName: 'Users',
  tableName: 'users',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});
export default users;
// };