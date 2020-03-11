require("dotenv").config();
import { isString } from "lodash";

// Validate each value on the environment and export and object where
// the types of the values are guaranteed to be strings
export default function requireEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!isString(value)) {
    throw new Error(`Expected ${key} to be set on the environment via .env!`);
  }
  return value;
}
