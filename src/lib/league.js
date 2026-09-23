import { supabase } from "./supabase";

export async function getRankings() {
  const { data, error } = await supabase
    .from("overall_rankings")
    .select("*");

  console.log("RANKINGS DATA:", data);
  console.log("RANKINGS ERROR:", error);

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getCurrentGameweek() {
  const { data, error } = await supabase
    .from("gameweeks")
    .select("*")
    .order("number", { ascending: true })
    .limit(1);

  console.log("GAMEWEEK DATA:", data);
  console.log("GAMEWEEK ERROR:", error);

  if (error) {
    throw error;
  }

  return data?.[0] ?? null;
}