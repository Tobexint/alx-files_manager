/* Users Controller */
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import { ObjectId } from 'mongodb';
import sha1 from 'sha1';

class UsersController {
  static async postNew(req, res) {
    const { email } = req.body;
    const { password } = req.body;
    if (!email) {
      res.status(400).send({ error: 'Missing email' });
      return;
    if (!password) {
      res.status(400).send({ error: 'Missing password' });
      return;
    }
    const users = dbClient.client.db().collection('users');
    
    const user = await users.findOne({ email });
    
    if (user) {
      res.status(400).send({ error: 'Already exist' });
      return;
    }
    
    const hashPwd = createHash('sha1').update(password).digest('hex');
    const newUser = await users.insertOne({
      email,
      password: hashPwd,
    });
    res.status(201).send({
      id: newUser.insertedId,
      email,
    });
  }

module.exports = UsersController;
