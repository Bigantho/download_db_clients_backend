// 'use strict';
// const {
//   Model
// } = require('sequelize');
import psql from 'sequelize'
import DB from '../config/db.mjs'
import users from './users.mjs';
class executed_queries extends psql.Model {
  static associate() {
    executed_queries.belongsTo(users , { foreignKey: 'id_user'})
  }
}
executed_queries.init({
  id: {
    autoIncrement: true,
    type: psql.INTEGER,
    allowNull: false,
    primaryKey: true,
  },
  id_user: psql.INTEGER,
  query: psql.JSON,
  created_at: psql.DATE,
  updated_at: psql.DATE
}, {
  sequelize: DB.connection(),
  modelName: 'executed_queries',
  tableName: 'executed_queries',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});
export default executed_queries;
