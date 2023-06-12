import { Schema, model } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { UUID, createHmac } from "crypto";
import { database } from "../database";



interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  created?: Date;
  updated?: Date;
  verified?: boolean;
}

const newUser = (name: string, email: string, password?: string): User => {
  const userID = uuidv4();
  return {
    id: userID,
    name,
    email,
    password: encryptPassword(userID, password || "123456"),
    created: new Date(),
    updated: new Date(),
    verified: false,
  }
}


const encryptPassword = (id: string, password: string): string => {
  if (!password) return "";
  try {
    return createHmac("sha1", id).update(password).digest("hex");
  } catch (err) {
    return "";
  }
}

const authenticate = (userID: string, plainText: string, hashed_password: string): boolean => {
  return encryptPassword(userID, plainText) === hashed_password;
}

const findUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const col = database.collection<User>("users");

    const user = await col.findOne({ email });
    return user;
  } catch (err) {
    return null;
  }
}

const findUserById = async (id: string): Promise<User | null> => {
  try {
    const col = database.collection<User>("users");

    const user = await col.findOne({ id });
    return user;
  } catch (err) {
    return null;
  }
}

const createUser = async (user: User) => {
  try {
    const col = database.collection<User>("users");
    await col.insertOne(user);
  } catch (err) {
    console.log(err);
  }
}





export { User, newUser, authenticate, findUserByEmail, findUserById, createUser }