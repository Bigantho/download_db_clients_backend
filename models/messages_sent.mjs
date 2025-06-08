// 'use strict';
// const {
//   Model
// } = require('sequelize');
import psql from 'sequelize'
import DB from '../config/db.mjs'
import users from './users.mjs';
class messages_sent extends psql.Model {
  static associate() {
    messages_sent.belongsTo(users , { foreignKey: 'id_user'})
  }
}
messages_sent.init({
  id: {
    autoIncrement: true,
    type: psql.INTEGER,
    allowNull: false,
    primaryKey: true,
  },
  id_user: psql.INTEGER,
  message: psql.STRING,
  phone_to: psql.STRING,
  phone_from: psql.STRING,
  is_callback: psql.BOOLEAN,
  delivered: psql.BOOLEAN,
  created_at: psql.DATE
}, {
  sequelize: DB.connection(),
  modelName: 'messages_sent',
  tableName: 'messages_sent',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});
export default messages_sent;
