import readline from "node:readline";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Error: Missing PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("🔐 Create Admin User");

rl.question("Email: ", (email) => {
  rl.question("Password (min 6 chars): ", async (password) => {
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (error) {
        console.error("❌ Error:", error.message);
      } else {
        console.log("✅ User created successfully!");
        console.log("ID:", data.user.id);
        console.log("Email:", data.user.email);
      }
    } catch (err) {
      console.error("❌ Unexpected error:", err);
    } finally {
      rl.close();
    }
  });
});
