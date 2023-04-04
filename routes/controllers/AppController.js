import redisClient from '../utils/redis';
import dbClient from '../utils/db';

export const getStatus(req, res) {
  res.status(200).send({
    redis: redisClient.isAlive(),
    db: dbClient.isAlive(),
  });
}

export const getStats(req, res) = async() => {
  res.status(200).send({
    users: await dbClient.nbUsers(),
    files: await dbClient.nbFiles(),
  });
}