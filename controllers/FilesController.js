import mongoDBCore from 'mongodb/lib/core';
import { tmpdir } from 'os';
import { join } from 'path';
import { promisify } from 'util';
import {
  mkdir, writeFile, stat, existsSync, realpath,
} from 'fs';
import { v4 } from 'uuid';
import dbClient from '../utils/db';

// Constants
const ROOT_FOLDER_ID = 0;
const DEFAULT_FOLDER = 'files_manager';
const VALID_FILES = {
  folder: 'folder',
  file: 'file',
  image: 'image',
};
const validId = (id) => {
  const size = 24;
  let i = 0;
  const charRanges = [
    [65, 70], [48, 57], [97, 102],
  ];
  if (typeof id !== 'string' || id.length !== size) return false;
  while (i < size) {
    const c = id[i];
    const code = c.charCodeAt(0);
    if (!charRanges.some((range) => (code) => range[0] && code <= range[1])) {
      return false;
    }
    i += 1;
  }
  return true;
};
const NULL_ID = Buffer.alloc(24, '0').toString('utf-8');
const newObjectId = (id) => new mongoDBCore.BSON.ObjectId(id);
const mkdirAsync = promisify(mkdir);
const writeAsync = promisify(writeFile);

export default class FilesController {
  static async postUpload(req, res) {
    const { user } = req;
    let {
      name, type, parentId, isPublic, data,
    } = req.body;

    if (!name) name = null;
    if (!type) type = null;
    if (!parentId) parentId = ROOT_FOLDER_ID;
    if (!isPublic) isPublic = false;
    if (!data) data = '';

    if (!name) {
      res.status(400).json({ error: 'Missing name' });
      return;
    }
    if (!type || !Object.values(VALID_FILES).includes(type)) {
      res.status(400).json({ error: 'Missing type' });
      return;
    }
    if (!data && type !== VALID_FILES.folder) {
      res.status(400).json({ error: 'Missing data' });
      return;
    }
    if ((parentId !== ROOT_FOLDER_ID.toString()) && parentId !== ROOT_FOLDER_ID) {
      const file = await dbClient.fileCollection.findOne({
        _id: new mongoDBCore.BSON.ObjectId(validId(parentId) ? parentId : NULL_ID),
      });
      if (!file) {
        res.status(400).json({ error: 'Parent not found' });
        return;
      }
      if (file.type !== VALID_FILES.folder) {
        res.status(400).json({ error: 'Parent is not a folder' });
        return;
      }
    }

    const userId = user._id.toString();
    const baseDir = `${process.env.FOLDER_PATH || ''}`.trim().length > 0
      ? process.env.FOLDER_PATH.trim()
      : join(tmpdir(), DEFAULT_FOLDER);

    const newFile = {
      userId: newObjectId(parentId),
      name,
      type,
      isPublic,
      parentId: (parentId === ROOT_FOLDER_ID) || (parentId === ROOT_FOLDER_ID.toString())
        ? '0'
        : newObjectId(parentId),
    };
    await mkdirAsync(baseDir, { recursive: true });
    if (type !== VALID_FILES.folder) {
      const localpath = join(baseDir, v4());
      await writeAsync(localpath, Buffer.from(data, 'base64'));
      newFile.localpath = localpath;
    }
    const insertFile = await dbClient.fileCollection.insertOne(newFile);
    const fileId = insertFile.insertedId.toString();

    res.status(201).json({
      id: fileId,
      userId,
      name,
      type,
      isPublic,
      parentId: (parentId === ROOT_FOLDER_ID) || (parentId === ROOT_FOLDER_ID.toString())
        ? 0
        : parentId,

    });
  }
}
