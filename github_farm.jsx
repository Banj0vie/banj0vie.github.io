import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import PanZoomViewport from "../layouts/PanZoomViewport";
import { FARM_BEES, FARM_HOTSPOTS, FARM_VIEWPORT, FARM_POSITIONS } from "../constants/scene_farm";
import { ID_FARM_HOTSPOTS } from "../constants/app_ids";
import FarmerDialog from "../containers/Farm_Farmer";
import FarmInterface from "../layouts/FarmInterface";
import FarmMenu from "../layouts/FarmInterface/FarmMenu";
import SelectSeedDialog from "../containers/Farm_SelectSeedDialog";
import { useItems } from "../hooks/useItems";
import { useFarming } from "../hooks/useContracts";
import { useNotification } from "../contexts/NotificationContext";
import { CropItemArrayClass } from "../models/crop";
import { handleContractError } from "../utils/errorHandler";
import { ID_POTION_ITEMS, ID_PRODUCE_ITEMS, ID_CHEST_ITEMS, ID_FISH_ITEMS, ID_SEEDS, ID_BAIT_ITEMS, ID_ITEM_CATEGORIES } from "../constants/app_ids";
import { ALL_ITEMS, IMAGE_URL_CROP } from "../constants/item_data";
import { clampVolume, getGrowthTime, getSubtype } from "../utils/basic";
import { ONE_SEED_HEIGHT, ONE_SEED_WIDTH } from "../constants/item_seed";
import { useAppSelector } from "../solana/store";
import { selectSettings } from "../solana/store/slices/uiSlice";
import { defaultSettings } from "../utils/settings";
import BaseDialog from "../containers/_BaseDialog";
import BaseButton from "../components/buttons/BaseButton";
import AdminPanel from "./index";
import WeatherOverlay, { getSimulatedDateInfo, getWeatherForDay } from "../components/WeatherOverlay";
import { useNavigate } from "react-router-dom";
import MissionBoard from "../containers/MissionBoard";
import Shop from "../containers/Shop";
import FarmCustomizePanel from "../containers/FarmCustomizePanel";
import PokemonPackRipDialog from "../containers/Market_Vendor/PokemonPackRipDialog";
import { getRaritySeedId } from "../constants/app_ids";

export const getQuestData = () => [

  // Wave 1: Early Bliss (0-60 min)

  {
    id: "q1_pabee_intro",
    type: "main",
    sender: "Pabee",
    subject: "Welcome to the Farm",
    body: [
      "Hey son, thanks for watching over my farm! There is alot for you to do and alot for you achieve, this is your farm now so make it yours and make it the best farm it can be!",
      "Ive left you some supplies make sure to read what they do...",
      "Also before I left the cat ran away again, please leave him a bowl of water and a nice fish, he should come back when he smells it, thank you and enjoy the wonders of being a farmer!"
    ],
    rewards: [
      { id: 'pabee_pack', count: 1, name: "Papabee's Pack", image: "/images/cardback/commonback.png" },
    ],
    reqs: [],
    unlockCondition: (step, completed) => true
  },

  {
    id: "q1b_pabee_first_crop",
    type: "main",
    sender: "Pabee",
    subject: "Your First Harvest",
    body: [
      "Great to hear you are settling in!",
      "Go ahead and plant a couple of those seeds I left you and bring me your first harvest.",
      "Farming is simple once you get the hang of it — and I want to make sure you get started right!"
    ],
    rewards: [
      { id: 'gold', count: 500, name: "Gold", image: "/images/items/gold.png" },
      { id: ID_SEEDS?.CARROT || 131848, count: 8, name: "Carrot Seeds", image: "/images/items/seeds.png" },
      { id: ID_BAIT_ITEMS?.BAIT_1 || 30001, count: 3, name: "Bait I", image: "/images/items/seeds.png" }
    ],
    reqs: [
      { id: ID_PRODUCE_ITEMS?.CARROT || 131588, count: 2, name: "Carrots", image: ALL_ITEMS[ID_PRODUCE_ITEMS?.CARROT]?.image || "/images/items/carrot.png" }
    ],
    unlockCondition: (step, completed) => step >= 32 && completed.includes("q1_pabee_intro")
  },

  {
    id: "q1c_uncle_bee_hello",
    type: "main",
    sender: "Great Uncle Sir Bee",
    subject: "A Letter from your Uncle",
    body: [
      "Nephew.",
      "I heard you took over the farm. Good.",
      "I have left a small contribution for your operations. Use it wisely — the valley does not reward laziness.",
      "Make me proud."
    ],
    rewards: [
      { id: 'gold', count: 800, name: "Gold", image: "/images/items/gold.png" },
      { id: ID_SEEDS?.POTATO || 131849, count: 6, name: "Potato Seeds", image: "/images/items/seeds.png" },
      { id: ID_SEEDS?.TOMATO || 131850, count: 6, name: "Tomato Seeds", image: "/images/items/seeds.png" }
    ],
    reqs: [],
    unlockCondition: (step, completed) => step >= 32 && completed.includes("q1b_pabee_first_crop")
  },

  {
    id: "q1d_mayor_intro",
    type: "main",
    sender: "Mayor Prezibee",
    subject: "Welcome to Harvest Valley!",
    body: [
      "Dear new Farmer,",
      "On behalf of everyone in Harvest Valley, welcome! We are thrilled to have such an energetic new member of our community.",
      "I have taken the liberty of stocking your supply with a little something to help you on your way. The valley takes care of its own!"
    ],
    rewards: [
      { id: 'gold', count: 600, name: "Gold", image: "/images/items/gold.png" },
      { id: ID_BAIT_ITEMS?.BAIT_1 || 30001, count: 5, name: "Bait I", image: "/images/items/seeds.png" },
      { id: ID_SEEDS?.CORN || 131851, count: 5, name: "Corn Seeds", image: "/images/items/seeds.png" }
    ],
    reqs: [],
    unlockCondition: (step, completed) => completed.includes("q1c_uncle_bee_hello")
  },

  // Wave 2: Unlocking the World (60-120 min)

  {
    id: "q2_unlock_dock",
    type: "main",
    sender: "Mayor Prezibee",
    subject: "The Old Dock",
    body: [
      "I have a small favour to ask.",
      "The old town dock has been sitting in disrepair for years. The anglers are miserable!",
      "If you can contribute 500 Gold toward the repairs, the town will handle the rest. And I promise we will make it worth your while."
    ],
    rewards: [
      { id: 'gold', count: 300, name: "Gold", image: "/images/items/gold.png" },
      { id: ID_BAIT_ITEMS?.BAIT_2 || 30002, count: 5, name: "Bait II", image: "/images/items/seeds.png" }
    ],
    reqs: [
      { id: 'gold', count: 500, name: "Gold", image: "/images/items/gold.png" }
    ],
    unlockCondition: (step, completed) => completed.includes("q1d_mayor_intro")
  },

  {
    id: "q2b_finn_welcome",
    type: "main",
    sender: "Fisherman Finn",
    subject: "Ahoy, Farmer!",
    body: [
      "Well I'll be! Someone finally fixed that dock!",
      "The name's Finn. I've been fishing these waters for 30 years and I know every current and every cove.",
      "Here, take this — I've been saving it. Start with the basics, there's plenty of fish out there waiting for you!"
    ],
    rewards: [
      { id: 'gold', count: 400, name: "Gold", image: "/images/items/gold.png" },
      { id: ID_BAIT_ITEMS?.BAIT_1 || 30001, count: 8, name: "Bait I", image: "/images/items/seeds.png" },
      { id: ID_BAIT_ITEMS?.BAIT_2 || 30002, count: 3, name: "Bait II", image: "/images/items/seeds.png" }
    ],
    reqs: [],
    unlockCondition: (step, completed) => completed.includes("q2_unlock_dock") && (localStorage.getItem('sandbox_dock_repaired') === 'true' || localStorage.getItem('sandbox_dock_unlocked') === 'true')
  },

  {
    id: "q2_rebuild_tavern",
    type: "main",
    sender: "Great Uncle Sir Bee",
    subject: "Rebuild the Tavern",
    body: [
      "Nephew.",
      "The local Tavern has fallen into ruin. It's an absolute disgrace to our family name.",
      "I need you to fund the repairs so the Potion Master can resume his brewing.",
      "Bring 500 Gold and 20 Potatoes to the Tavern. Do not dawdle."
    ],
    rewards: [
      { id: 'gold', count: 800, name: "Gold", image: "/images/items/gold.png" },
      { id: ID_POTION_ITEMS?.POTION_GROWTH_ELIXIR || 132104, count: 2, name: "Growth Elixir", image: ALL_ITEMS[ID_POTION_ITEMS?.POTION_GROWTH_ELIXIR]?.image || "/images/items/potion1.png" },
      { id: ID_BAIT_ITEMS?.BAIT_2 || 30002, count: 5, name: "Bait II", image: "/images/items/seeds.png" }
    ],
    reqs: [
      { id: 'gold', count: 500, name: "Gold", image: "/images/items/gold.png" },
      { id: ID_PRODUCE_ITEMS?.POTATO || 131586, count: 20, name: "Potatoes", image: ALL_ITEMS[ID_PRODUCE_ITEMS?.POTATO]?.image || "/images/items/potato.png" }
    ],
    unlockCondition: (step, completed) => completed.includes("q2b_finn_welcome")
  },

  // Wave 3: The Taper (120-180 min)

  {
    id: "q3_potion_master",
    type: "main",
    sender: "Potion Master",
    subject: "Alchemical Needs",
    body: [
      "Ah, the new farmer! The Tavern is looking much better.",
      "Your grandfather used to supply me with the rarest ingredients for my brews.",
      "I am currently working on a highly volatile concoction and I desperately need 15 Ladybugs.",
      "Catch them in the forest bushes using a Bug Net and I'll share a prototype potion with you."
    ],
    rewards: [
      { id: 'gold', count: 400, name: "Gold", image: "/images/items/gold.png" },
      { id: ID_POTION_ITEMS?.POTION_GROWTH_ELIXIR || 132104, count: 2, name: "Growth Elixir", image: ALL_ITEMS[ID_POTION_ITEMS?.POTION_GROWTH_ELIXIR]?.image || "/images/items/potion1.png" }
    ],
    reqs: [
      { id: ID_POTION_ITEMS?.LADYBUG || 132101, count: 15, name: "Ladybugs", image: "/images/items/ladybug.png" }
    ],
    unlockCondition: (step, completed) => completed.includes("q2_rebuild_tavern")
  },

  {
    id: "q3b_pabee_fish_fertilizer",
    type: "main",
    sender: "Pabee",
    subject: "A Secret Farming Trick",
    body: [
      "Hey son! I see you're getting the hang of farming. You're level 5 now!",
      "I wanted to share an old family secret with you.",
      "Before you place dirt in a hole, try adding a fish first! It acts as an amazing fertilizer and will make your crops grow bigger and faster.",
      "Give it a try next time you plant something!"
    ],
    rewards: [
      { id: 'gold', count: 250, name: "Gold", image: "/images/items/gold.png" },
      { id: ID_BAIT_ITEMS?.BAIT_2 || 30002, count: 3, name: "Bait II", image: "/images/items/seeds.png" }
    ],
    reqs: [],
    unlockCondition: (step, completed) => {
      const xp = parseInt(localStorage.getItem('sandbox_farming_xp') || '0', 10);
      const level = Math.floor(Math.sqrt((xp || 0) / 150)) + 1;
      return level >= 5;
    }
  },

  {
    id: "q4_prezibee_dock",
    type: "main",
    sender: "Mayor Prezibee",
    subject: "Town Appreciation",
    body: [
      "Dear Farmer,",
      "On behalf of the entire valley, I want to thank you for repairing the town dock! The anglers are thrilled.",
      "Please accept this premium bait as a token of our gratitude. It should make fishing a breeze!"
    ],
    rewards: [
      { id: 'gold', count: 200, name: "Gold", image: "/images/items/gold.png" },
      { id: ID_BAIT_ITEMS?.BAIT_1 || 30001, count: 3, name: "Bait I", image: "/images/items/seeds.png" }
    ],
    reqs: [],
    unlockCondition: (step, completed) => localStorage.getItem('sandbox_dock_repaired') === 'true' || localStorage.getItem('sandbox_dock_unlocked') === 'true'
  },

  {
    id: "q5_first_catch",
    type: "fishing",
    sender: "Fisherman Finn",
    subject: "The Basics of Angling",
    body: [
      "Ahoy there, Farmer!",
      "I heard you finally fixed up the old dock. Bout time!",
      "Why don't you try out that bait the Mayor gave you? Cast a line off the dock and bring me 3 Fish. Let's see what you've got!"
    ],
    rewards: [
      { id: 'gold', count: 200, name: "Gold", image: "/images/items/gold.png" },
      { id: ID_BAIT_ITEMS?.BAIT_1 || 30001, count: 3, name: "Bait I", image: "/images/items/seeds.png" },
      { id: 'honey', count: 150, name: "Honey", image: "/images/items/honey.png" }
    ],
    reqs: [
      { 
        id: 'tracked_fish_q5', 
        count: 3, 
        name: "Any Fish", 
        image: ALL_ITEMS[ID_FISH_ITEMS?.NORMAL_FISH || 10001]?.image || "/images/items/fish.png",
        fn: () => {
          const start = parseInt(localStorage.getItem('q5_start_catches') || '0', 10);
          const current = parseInt(localStorage.getItem('sandbox_fishing_catches') || '0', 10);
          return current - start;
        }
      }
    ],
    unlockCondition: (step, completed) => {
      const unlocked = localStorage.getItem('sandbox_dock_repaired') === 'true' || localStorage.getItem('sandbox_dock_unlocked') === 'true';
      if (unlocked && localStorage.getItem('q5_start_catches') === null) localStorage.setItem('q5_start_catches', localStorage.getItem('sandbox_fishing_catches') || '0');
      return unlocked;
    }
  },

  {
    id: "q6_hungry_town",
    type: "fishing",
    sender: "Tavern Barkeep",
    subject: "Fish Fry Friday!",
    body: [
      "Hey Farmer,",
      "The town is craving a massive fish fry, but Finn is too busy untangling his nets.",
      "Can you head to the pond and catch 5 more Fish for us? I'll make it worth your while!"
    ],
    rewards: [
      { id: 'gold', count: 200, name: "Gold", image: "/images/items/gold.png" },
      { id: ID_CHEST_ITEMS?.CHEST_BRONZE || 20001, count: 1, name: "Bronze Chest", image: "/images/items/chest.png" },
      { id: 'honey', count: 300, name: "Honey", image: "/images/items/honey.png" }
    ],
    reqs: [
      { 
        id: 'tracked_fish_q6', 
        count: 5, 
        name: "Any Fish", 
        image: ALL_ITEMS[ID_FISH_ITEMS?.NORMAL_FISH || 10001]?.image || "/images/items/fish.png",
        fn: () => {
          const start = parseInt(localStorage.getItem('q6_start_catches') || '0', 10);
          const current = parseInt(localStorage.getItem('sandbox_fishing_catches') || '0', 10);
          return current - start;
        }
      }
    ],
    unlockCondition: (step, completed) => {
      const unlocked = completed.includes("q5_first_catch");
      if (unlocked && localStorage.getItem('q6_start_catches') === null) localStorage.setItem('q6_start_catches', localStorage.getItem('sandbox_fishing_catches') || '0');
      return unlocked;
    }
  },

  {
    id: "q7_a_bigger_catch",
    type: "fishing",
    sender: "Fisherman Finn",
    subject: "A Bigger Catch",
    body: [
      "Not bad, kid! You've got a real knack for angling.",
      "But if you want to catch the really big ones, you can't just stand on the dock all day.",
      "Gather some materials so we can build you a Rowboat. Bring me 30 Wood Logs, 20 Sticks, and 10 Iron Ore!"
    ],
    rewards: [
      { id: 'gold', count: 300, name: "Gold", image: "/images/items/gold.png" },
      { id: ID_BAIT_ITEMS?.BAIT_2 || 30002, count: 5, name: "Bait II", image: "/images/items/seeds.png" },
      { id: 'honey', count: 500, name: "Honey", image: "/images/items/honey.png" }
    ],
    reqs: [
      { id: 9993, count: 30, name: "Wood Logs", image: "/images/forest/wood.png" },
      { id: 9995, count: 20, name: "Sticks", image: "/images/forest/wood.png" },
      { id: 9996, count: 10, name: "Iron Ore", image: "/images/forest/rock.png" }
    ],
    unlockCondition: (step, completed) => completed.includes("q6_hungry_town")
  },

  {
    id: "q8_first_harvest",
    type: "farming",
    sender: "Farmer Bob",
    subject: "Your First Big Harvest",
    body: [
      "Howdy neighbor!",
      "I see you've got the plots cleared out. Let's get to work.",
      "Grow 10 Potatoes and bring them to me. I'll give you some seeds to keep you going!"
    ],
    rewards: [
      { id: 'gold', count: 250, name: "Gold", image: "/images/items/gold.png" },
      { id: ID_SEEDS?.CARROT || 131848, count: 5, name: "Carrot Seeds", image: "/images/items/seeds.png" },
      { id: 'honey', count: 200, name: "Honey", image: "/images/items/honey.png" }
    ],
    reqs: [
      { id: ID_PRODUCE_ITEMS?.POTATO || 131586, count: 10, name: "Potatoes", image: ALL_ITEMS[ID_PRODUCE_ITEMS?.POTATO]?.image || "/images/items/potato.png" }
    ],
    unlockCondition: (step, completed) => completed.includes("q2_rebuild_tavern")
  },

  {
    id: "q9_cornucopia",
    type: "farming",
    sender: "Tavern Barkeep",
    subject: "Salad Days",
    body: [
      "We're updating the Tavern menu and we need fresh greens!",
      "Can you supply us with 5 Corn and 5 Tomatoes?",
      "I'll trade you some gold and a couple of chests for them."
    ],
    rewards: [
      { id: 'gold', count: 350, name: "Gold", image: "/images/items/gold.png" },
      { id: ID_CHEST_ITEMS?.CHEST_BRONZE || 20001, count: 2, name: "Bronze Chests", image: "/images/items/chest.png" }
    ],
    reqs: [
      { id: ID_PRODUCE_ITEMS?.CORN || 131590, count: 5, name: "Corn", image: ALL_ITEMS[ID_PRODUCE_ITEMS?.CORN]?.image || "/images/items/corn.png" },
      { id: ID_PRODUCE_ITEMS?.TOMATO || 131589, count: 5, name: "Tomatoes", image: ALL_ITEMS[ID_PRODUCE_ITEMS?.TOMATO]?.image || "/images/items/tomato.png" }
    ],
    unlockCondition: (step, completed) => completed.includes("q8_first_harvest")
  },

  {
    id: "q10_crab_mentality",
    type: "fishing",
    sender: "Fisherman Finn",
    subject: "Crab Mentality",
    body: [
      "Hook and line is fine, but if you want passive income, you need Crab Pots.",
      "Craft 3 Crab Pots and set them up. Bring me 5 Crabs to prove they work!"
    ],
    rewards: [
      { id: 'gold', count: 200, name: "Gold", image: "/images/items/gold.png" },
      { id: 'honey', count: 250, name: "Honey", image: "/images/items/honey.png" },
      { id: ID_CHEST_ITEMS?.CHEST_BRONZE || 20001, count: 1, name: "Bronze Chest", image: "/images/items/chest.png" }
    ],
    reqs: [
      { id: 9966, count: 3, name: "Crab Pots", image: "/images/items/crab_pot.png" },
      { id: 10002, count: 5, name: "Crabs", image: "/images/items/fish.png" }
    ],
    unlockCondition: (step, completed) => completed.includes("q7_a_bigger_catch")
  },

  {
    id: "q11_rainy_day",
    type: "fishing",
    sender: "Potion Master",
    subject: "Rainy Day Blues",
    body: [
      "I need the scales of a Gloomfish for a new potion.",
      "They only surface when it's raining. Take your Rowboat out on the next rainy day and catch one!"
    ],
    rewards: [
      { id: 'gold', count: 150, name: "Gold", image: "/images/items/gold.png" },
      { id: ID_POTION_ITEMS?.POTION_GROWTH_ELIXIR || 132104, count: 2, name: "Growth Elixir", image: "/images/items/potion1.png" },
      { id: 9998, count: 1, name: "Water Sprinkler", image: "/images/items/watersprinkler.png" }
    ],
    reqs: [
      { id: 10003, count: 1, name: "Gloomfish", image: "/images/items/fish.png" }
    ],
    unlockCondition: (step, completed) => completed.includes("q10_crab_mentality")
  },

  {
    id: "q12_sailing",
    type: "fishing",
    sender: "Great Uncle Sir Bee",
    subject: "Sailing the Open Seas",
    body: [
      "A Rowboat? How pedestrian. If you want to make this family proud, you need a vessel worthy of the open ocean.",
      "Build a Sailboat so you can catch the real prizes."
    ],
    rewards: [
      { id: 'gold', count: 100, name: "Gold", image: "/images/items/gold.png" },
      { id: ID_BAIT_ITEMS?.BAIT_3 || 30003, count: 10, name: "Bait III", image: "/images/items/seeds.png" }
    ],
    reqs: [
      { id: 9964, count: 1, name: "Sailboat", image: "/images/items/sailboat.png" }
    ],
    unlockCondition: (step, completed) => completed.includes("q11_rainy_day")
  },

  {
    id: "q13_storm_chaser",
    type: "fishing",
    sender: "Fisherman Finn",
    subject: "Storm Chaser",
    body: [
      "You're crazy if you go out there during a lightning storm... but if you do, the legendary Spark Eel is said to ride the waves.",
      "You'll need a Tesla Tower on your boat to survive!"
    ],
    rewards: [
      { id: 'gold', count: 100, name: "Gold", image: "/images/items/gold.png" },
      { id: 9954, count: 1, name: "Magic Ring", image: "/images/items/seeds.png" },
      { id: ID_CHEST_ITEMS?.CHEST_GOLD || 20003, count: 1, name: "Gold Chest", image: "/images/items/chest.png" }
    ],
    reqs: [
      { id: 10004, count: 1, name: "Spark Eel", image: "/images/items/fish.png" }
    ],
    unlockCondition: (step, completed) => completed.includes("q12_sailing")
  },

  {
    id: "q14_industrial",
    type: "main",
    sender: "Mayor Prezibee",
    subject: "Industrial Revolution",
    body: [
      "The town is booming, and we need more resources.",
      "Forging Steel Plates from Iron and Coal will let you build the ultimate fishing vessel."
    ],
    rewards: [
      { id: 'gold', count: 80, name: "Gold", image: "/images/items/gold.png" },
      { id: 9962, count: 1, name: "Engine", image: "/images/crafting/engine.png" }
    ],
    reqs: [
      { id: 9967, count: 50, name: "Steel Plates", image: "/images/crafting/steel_plate.png" }
    ],
    unlockCondition: (step, completed) => completed.includes("q13_storm_chaser")
  },

  {
    id: "q15_trawler",
    type: "fishing",
    sender: "Fisherman Finn",
    subject: "Industrial Fishing",
    body: [
      "With that Engine, you can finally build the Trawler.",
      "It's massive, loud, and can reach the deepest parts of the ocean."
    ],
    rewards: [
      { id: 'gold', count: 80, name: "Gold", image: "/images/items/gold.png" },
      { id: 'honey', count: 1000, name: "Honey", image: "/images/items/honey.png" }
    ],
    reqs: [
      { id: 9963, count: 1, name: "Trawler", image: "/images/items/trawler.png" }
    ],
    unlockCondition: (step, completed) => completed.includes("q14_industrial")
  },

  {
    id: "q16_kraken",
    type: "fishing",
    sender: "Mayor Prezibee",
    subject: "Monster of the Deep",
    body: [
      "Something has been sinking our trade ships in the Deep Ocean.",
      "Take the Trawler out and catch the Kraken. Be warned, it will put up the fight of a lifetime."
    ],
    rewards: [
      { id: 'gold', count: 50, name: "Gold", image: "/images/items/gold.png" },
      { id: 9961, count: 5, name: "Red Gem", image: "/images/items/seeds.png" }
    ],
    reqs: [
      { id: 10005, count: 1, name: "Kraken", image: "/images/items/fish.png" }
    ],
    unlockCondition: (step, completed) => completed.includes("q15_trawler")
  },

  {
    id: "q9b_ladybug_basics",
    type: "farming",
    sender: "Farmer Bob",
    subject: "Ladybug Basics",
    body: [
      "Looks like we have some pests starting to snoop around the crops!",
      "You should craft a Bug Net and head over to the Forest. Search the bushes there to catch some Ladybugs.",
      "Bring me 5 Ladybugs and 1 Bug Net so I know you're prepared!"
    ],
    rewards: [
      { id: 'gold', count: 150, name: "Gold", image: "/images/items/gold.png" },
      { id: ID_POTION_ITEMS?.POTION_GROWTH_ELIXIR || 132104, count: 1, name: "Growth Elixir", image: ALL_ITEMS[ID_POTION_ITEMS?.POTION_GROWTH_ELIXIR]?.image || "/images/items/potion1.png" }
    ],
    reqs: [
      { id: ID_POTION_ITEMS?.LADYBUG || 132101, count: 5, name: "Ladybugs", image: "/images/items/ladybug.png" },
      { id: 9971, count: 1, name: "Bug Net", image: "/images/items/bug_net.png" }
    ],
    unlockCondition: (step, completed) => completed.includes("q8_first_harvest")
  },

];

const TamagotchiDialog = ({ onClose, onFeed, onWater, catFeedTimeLeft, bowlWaterFilled, bowlFishId, starvingTime, isCatUnlocked, firstFedTime, catHappiness, currentHunger, catHealth }) => {
  const [activePet, setActivePet] = useState('felix');

  const isHungry = starvingTime > 0 || (currentHunger < 50);
  const isThirsty = starvingTime > 0 || !bowlWaterFilled;
  const isHappy = catHappiness >= 50;

  const happiness = Math.round(catHappiness || 0);
  const health = Math.round(catHealth || 100);
  const hunger = Math.round(currentHunger || 0);
  const thirst = bowlWaterFilled ? 100 : 15;

  const StatBar = ({ label, value, color }) => (
    <div style={{ width: '100%', marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '2px', color: '#ccc' }}>
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div style={{ width: '100%', height: '12px', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '6px', border: '1px solid #5a402a', overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', backgroundColor: color, transition: 'width 0.5s ease-in-out' }} />
      </div>
    </div>
  );

  return (
    <BaseDialog onClose={onClose} title="PETS" header="/images/dialog/modal-header-inventory.png" headerOffset={10} className="custom-modal-background">
      <div style={{ display: 'flex', width: '490px', height: '350px', fontFamily: 'monospace', color: '#fff', maxWidth: '90vw' }}>
        
        {/* Left Sidebar - Pet List */}
        <div style={{ width: '180px', borderRight: '2px solid #5a402a', padding: '15px', backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#ffea00', fontSize: '16px', borderBottom: '1px solid #5a402a', paddingBottom: '5px' }}>Your Pets</h3>
          
          <div 
            onClick={() => setActivePet('felix')}
            style={{ padding: '10px', backgroundColor: activePet === 'felix' ? 'rgba(0,255,65,0.2)' : 'rgba(0,0,0,0.5)', border: `1px solid ${activePet === 'felix' ? '#00ff41' : '#5a402a'}`, borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <span style={{ fontSize: '24px' }}>{isCatUnlocked ? '😺' : '❓'}</span>
            <span style={{ fontWeight: 'bold', color: activePet === 'felix' ? '#00ff41' : '#ccc' }}>{isCatUnlocked ? 'Felix' : '???'}</span>
          </div>

          <div style={{ padding: '10px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px dashed #5a402a', borderRadius: '8px', cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.5 }}>
            <span style={{ fontSize: '24px' }}>🐶</span>
            <span style={{ color: '#aaa', fontSize: '12px' }}>Locked</span>
          </div>
        </div>

        {/* Right Content - Pet Details */}
        <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {activePet === 'felix' ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ margin: 0, color: '#00ff41', fontSize: '28px' }}>{isCatUnlocked ? 'Felix The Cat' : 'Unknown Pet'}</h2>
                  <p style={{ margin: '5px 0 0 0', color: '#aaa', fontSize: '12px' }}>
                    {isCatUnlocked ? 'A wandering stray looking for snacks.' : (firstFedTime > 0 ? 'Something is smelling the food...' : 'Leave some food and water, maybe something will show up?')}
                  </p>
                </div>
                <div style={{ width: '80px', height: '80px', backgroundColor: '#9bbc0f', border: '4px solid #8bac0f', borderRadius: '8px', boxShadow: 'inset 2px 2px 10px rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                  <style>{`
                    @keyframes tamaBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
                    .tama-sprite { animation: tamaBounce 1s infinite steps(2); width: 48px; height: 48px; object-fit: contain; image-rendering: pixelated; }
                  `}</style>
                  {isCatUnlocked ? (
                    <img 
                      src={starvingTime > 0 ? "/images/pets/catangry.png" : "/images/pets/catface.png"} 
                      alt="Cat Status" 
                      className="tama-sprite"
                      onError={(e) => { e.target.src = starvingTime > 0 ? "/images/pets/catangry.png" : "/images/pets/catface.png"; }}
                    />
                  ) : (
                    <span style={{ fontSize: '40px', color: '#306030', fontWeight: 'bold' }}>?</span>
                  )}
                </div>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px', opacity: isCatUnlocked ? 1 : 0.3 }}>
                <StatBar label="Happiness" value={isCatUnlocked ? happiness : 0} color="#ffea00" />
                <StatBar label="Health" value={isCatUnlocked ? health : 0} color="#ff4444" />
                <StatBar label="Hunger" value={isCatUnlocked ? hunger : 0} color="#ff8800" />
                <StatBar label="Thirst" value={isCatUnlocked ? thirst : 0} color="#00bfff" />
              </div>

              {catFeedTimeLeft && isCatUnlocked && (
                <div style={{ color: '#00ff41', fontSize: '12px', textAlign: 'center', marginTop: '10px' }}>
                  Next interaction available in: {catFeedTimeLeft}
                </div>
              )}
              {firstFedTime > 0 && !isCatUnlocked && (
                <div style={{ color: '#ffea00', fontSize: '12px', textAlign: 'center', marginTop: '10px' }}>
                  Time until arrival: {(() => {
                     const rem = (firstFedTime + 60 * 60 * 1000) - Date.now();
                     if (rem <= 0) return "Arriving...";
                     const m = Math.floor(rem / 60000);
                     const s = Math.floor((rem % 60000) / 1000);
                     return `${m}m ${s}s`;
                  })()}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px' }}>
                <BaseButton small label={bowlWaterFilled ? "Water Full" : "Give Water 💧"} disabled={bowlWaterFilled} onClick={onWater} />
                <BaseButton small label={bowlFishId ? "Food Full" : "Give Fish 🐟"} disabled={!!bowlFishId} onClick={onFeed} />
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#aaa' }}>
              Select a pet to view details.
            </div>
          )}
        </div>
      </div>
    </BaseDialog>
  );
};

// Shared Protection Logic Map
const protectedPlotsBySpot = {
  1: [8, 9], // Spot 1 protects 8 and 9
  2: [0, 1], // Spot 2 protects these plots
  3: [7, 8], 
  10: [5, 6],
  11: [2, 3],
  4: [], // Spot 4
  5: [6, 7], // Spot 5
  6: [10, 11], // Spot 6
  7: [11, 12], // Spot 7
  8: [13, 14]  // Spot 8
};

const MOCK_LEADERBOARD = [
  { name: "FarmerBob", weight: "2.85" },
  { name: "AliceGrows", weight: "2.61" },
  { name: "CryptoVeggies", weight: "2.40" },
  { name: "OnionKing", weight: "2.15" },
];

// Dialog to prepare a plot for planting
const PlotPrepDialog = ({ onClose, onPlaceDirt, onAddFish, availableFish, farmingLevel }) => {
  const [showFish, setShowFish] = useState(false);

  return (
    <BaseDialog onClose={onClose} title="HOLE" header="/images/dialog/modal-header-inventory.png" headerOffset={10} className="custom-modal-background">
      <div style={{ padding: '20px', color: '#fff', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
        <h2 style={{ color: '#00ff41', margin: '0' }}>Inspect Hole</h2>
        <p style={{ margin: 0, color: '#ccc', textAlign: 'center' }}>
          {farmingLevel >= 5 ? "Do you want to add a fish to fertilize the hole, or place dirt directly?" : "Place dirt in the hole to prepare it for planting."}
        </p>
        
        {!showFish ? (
          <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
            {farmingLevel >= 5 && <BaseButton label="Add Fish" onClick={() => setShowFish(true)} />}
            <BaseButton label="Place Dirt" onClick={onPlaceDirt} />
          </div>
        ) : (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
            <h3 style={{ margin: '0', color: '#ffea00' }}>Select a Fish</h3>
            {availableFish.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', maxHeight: '200px', overflowY: 'auto', width: '100%' }}>
                {availableFish.map(fish => (
                  <div 
                    key={fish.id} 
                    onClick={() => onAddFish(fish.id)}
                    style={{ border: '2px solid #5a402a', borderRadius: '8px', padding: '10px', cursor: 'pointer', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', minWidth: '80px' }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#00ff41'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#5a402a'}
                  >
                    <img src={fish.image} alt={fish.label} style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                    <span style={{ fontSize: '12px', color: '#fff', textAlign: 'center' }}>{fish.label}</span>
                    <span style={{ fontSize: '10px', color: '#aaa' }}>x{fish.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#ff4444' }}>You have no fish!</p>
            )}
            <BaseButton small label="Back" onClick={() => setShowFish(false)} />
          </div>
        )}
      </div>
    </BaseDialog>
  );
};

const FishBowlDialog = ({ onClose, onAddFish, availableFish }) => {
  return (
    <BaseDialog onClose={onClose} title="PET BOWL" header="/images/dialog/modal-header-inventory.png" headerOffset={10} className="custom-modal-background">
      <div style={{ padding: '20px', color: '#fff', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
        <h2 style={{ color: '#ffea00', margin: '0' }}>Select a Fish</h2>
        <p style={{ margin: 0, color: '#ccc', textAlign: 'center' }}>Leave a fish for the stray cat.</p>
        
        {availableFish.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', maxHeight: '200px', overflowY: 'auto', width: '100%' }}>
            {availableFish.map(fish => (
              <div 
                key={fish.id} 
                onClick={() => onAddFish(fish.id)}
                style={{ border: '2px solid #5a402a', borderRadius: '8px', padding: '10px', cursor: 'pointer', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', minWidth: '80px' }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#00ff41'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#5a402a'}
              >
                <img src={fish.image} alt={fish.label} style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                <span style={{ fontSize: '12px', color: '#fff', textAlign: 'center' }}>{fish.label}</span>
                <span style={{ fontSize: '10px', color: '#aaa' }}>x{fish.count}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#ff4444' }}>You have no fish in your inventory!</p>
        )}
        <BaseButton small label="Cancel" onClick={onClose} />
      </div>
    </BaseDialog>
  );
};

const SkipGrowthDialog = ({ onClose, onConfirm }) => {
  return (
    <BaseDialog onClose={onClose} title="SPEED UP" header="/images/dialog/modal-header-inventory.png" headerOffset={10} className="custom-modal-background">
      <div style={{ padding: '20px', color: '#fff', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
        <h2 style={{ color: '#ffea00', margin: '0', textAlign: 'center' }}>Speed Up Growth?</h2>
        <p style={{ margin: 0, color: '#ccc', textAlign: 'center' }}>Spend 50 💎 Gems to instantly grow this crop?</p>
        <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
          <BaseButton label="Pay 50 Gems 💎" onClick={onConfirm} />
          <BaseButton label="Cancel" onClick={onClose} isError />
        </div>
      </div>
    </BaseDialog>
  );
};

// Inline the dialog to avoid any import/module resolution errors!

export const WeightContestDialog = ({ onClose, simulatedDay, targetProduceId, targetFishId, onProduceChange, onFishChange, targetProduceData, targetFishData, refetchItems }) => {
  const { show } = useNotification();
  
  const [chestResult, setChestResult] = useState(null);
  const [showChestDialog, setShowChestDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('produce'); // 'produce' or 'fish'
  
  const targetCropId = activeTab === 'produce' ? targetProduceId : targetFishId;
  const targetCropData = activeTab === 'produce' ? targetProduceData : targetFishData;
  const onCropChange = activeTab === 'produce' ? onProduceChange : onFishChange;
  const submissionKey = `weight_contest_submission_${activeTab}`;

  const [submission, setSubmission] = useState(() => {
    const saved = localStorage.getItem(submissionKey);
    if (!saved && activeTab === 'produce') {
      const legacy = localStorage.getItem('weight_contest_submission');
      if (legacy) return JSON.parse(legacy);
    }
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    let saved = localStorage.getItem(submissionKey);
    if (!saved && activeTab === 'produce') {
      const legacy = localStorage.getItem('weight_contest_submission');
      if (legacy) saved = legacy;
    }
    setSubmission(saved ? JSON.parse(saved) : null);
  }, [activeTab, submissionKey]);

  const targetCropName = targetCropData ? targetCropData.label : "Crop";

  const individualCrops = useMemo(() => {
    if (!targetCropData) return [];
    return Array.from({ length: targetCropData.count || 0 }).map((_, index) => {
      const randomFactor = Math.pow(Math.random(), 2.5);
      const weight = (0.5 + randomFactor * 1.5).toFixed(2);
      return {
        id: `crop-${index}`,
        name: `${targetCropName} ${index + 1}`,
        weight: weight,
      };
    });
  }, [targetCropData?.count, targetCropName]);

  const handleSelect = (crop) => {
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    const sandboxProduce = JSON.parse(localStorage.getItem('sandbox_produce') || '{}');
    let deducted = false;
    
    let produceCount = 0;
    if (Array.isArray(sandboxProduce[targetCropId])) {
      produceCount = sandboxProduce[targetCropId].length;
    } else {
      produceCount = Number(sandboxProduce[targetCropId]) || 0;
    }

    if (produceCount > 0) {
      if (Array.isArray(sandboxProduce[targetCropId])) {
        sandboxProduce[targetCropId].pop();
      } else {
        sandboxProduce[targetCropId] -= 1;
      }
      localStorage.setItem('sandbox_produce', JSON.stringify(sandboxProduce));
      deducted = true;
    } else if (sandboxLoot[targetCropId] > 0) {
      sandboxLoot[targetCropId] -= 1;
      localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
      deducted = true;
    }

    if (!deducted) {
      show(`You don't have any ${targetCropName}s to submit!`, "error");
      return;
    }

    if (refetchItems) refetchItems();

    const newSubmission = { weight: crop.weight, name: "You" };
    setSubmission(newSubmission);
    localStorage.setItem(submissionKey, JSON.stringify(newSubmission));
  };

  const isSunday = simulatedDay === 0;
  const daysUntilSunday = isSunday ? 0 : 7 - simulatedDay;

  const handleClaimPrize = () => {
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    const chestId = ID_CHEST_ITEMS.CHEST_BRONZE || ID_CHEST_ITEMS.BRONZE_CHEST;
    
    const mockRewards = [ID_PRODUCE_ITEMS.CARROT, ID_PRODUCE_ITEMS.TOMATO, ID_PRODUCE_ITEMS.POTATO, ID_PRODUCE_ITEMS.CORN];
    const mockRewardId = mockRewards[Math.floor(Math.random() * mockRewards.length)];
    
    sandboxLoot[mockRewardId] = (sandboxLoot[mockRewardId] || 0) + 1;
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    
    setChestResult({
      rewardId: mockRewardId,
      chestType: chestId,
      image: ALL_ITEMS[mockRewardId]?.image,
      label: ALL_ITEMS[mockRewardId]?.label || "Produce"
    });
    setShowChestDialog(true);

    setSubmission(null);
    localStorage.removeItem(submissionKey);
    if (activeTab === 'produce') localStorage.removeItem('weight_contest_submission');

    const isFish = activeTab === 'fish';
    let eligible;
    if (isFish) {
      eligible = Object.values(ID_FISH_ITEMS).filter(id => typeof id === 'number');
      if (eligible.length === 0) eligible = [ID_PRODUCE_ITEMS.ONION]; 
    } else {
      eligible = [ID_PRODUCE_ITEMS.ONION, ID_PRODUCE_ITEMS.CARROT, ID_PRODUCE_ITEMS.POTATO, ID_PRODUCE_ITEMS.TOMATO, ID_PRODUCE_ITEMS.CORN];
    }

    const nextCrops = eligible.filter(id => id !== targetCropId);
    const newCrop = nextCrops.length > 0 ? nextCrops[Math.floor(Math.random() * nextCrops.length)] : eligible[0];
    onCropChange(newCrop);
    localStorage.setItem(isFish ? 'weight_contest_fish' : 'weight_contest_produce', newCrop.toString());

    show("Prize claimed! Opening chest...", "success");
  };

  const currentLeaderboard = useMemo(() => {
    let board = [...MOCK_LEADERBOARD];
    if (submission) board.push(submission);
    board.sort((a, b) => parseFloat(b.weight) - parseFloat(a.weight));
    return board;
  }, [submission]);

  return (
    <>
      <BaseDialog onClose={onClose} title="WEIGHT CONTEST" header="/images/dialog/modal-header-inventory.png" headerOffset={10} className="custom-modal-background">
        <div style={{ padding: '20px', color: '#fff', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '10px' }}>
            <button 
              onClick={() => setActiveTab('produce')} 
              style={{ 
                padding: '10px 20px', 
                backgroundColor: activeTab === 'produce' ? 'rgba(0, 255, 65, 0.2)' : 'rgba(0, 0, 0, 0.5)', 
                color: activeTab === 'produce' ? '#00ff41' : '#ccc', 
                border: `2px solid ${activeTab === 'produce' ? '#00ff41' : '#5a402a'}`, 
                borderRadius: '8px', 
                cursor: 'pointer', 
                fontFamily: 'monospace', 
                fontWeight: 'bold',
                fontSize: '16px'
              }}
            >
              Produce Event
            </button>
            <button 
              onClick={() => setActiveTab('fish')} 
              style={{ 
                padding: '10px 20px', 
                backgroundColor: activeTab === 'fish' ? 'rgba(0, 191, 255, 0.2)' : 'rgba(0, 0, 0, 0.5)', 
                color: activeTab === 'fish' ? '#00bfff' : '#ccc', 
                border: `2px solid ${activeTab === 'fish' ? '#00bfff' : '#5a402a'}`, 
                borderRadius: '8px', 
                cursor: 'pointer', 
                fontFamily: 'monospace', 
                fontWeight: 'bold',
                fontSize: '16px'
              }}
            >
              Fish Event
            </button>
          </div>

          {isSunday ? (
            <>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ color: '#00ff41', margin: '0 0 10px 0' }}>🏆 Weekly {targetCropName} Weigh-In Results 🏆</h2>
                <p style={{ margin: 0, color: '#ccc' }}>The competition has ended! Here are the winners:</p>
              </div>
              <div style={{ backgroundColor: 'rgba(0,0,0,0.5)', border: '2px solid #5a402a', borderRadius: '8px', padding: '15px' }}>
                <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #5a402a', paddingBottom: '10px' }}>Final Standings</h3>
                {currentLeaderboard.map((entry, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed rgba(90, 64, 42, 0.5)' }}>
                    <span style={{ width: '30px', color: entry.name === 'You' ? '#00ff41' : '#fff' }}>#{index + 1}</span>
                    <span style={{ flex: 1, color: entry.name === 'You' ? '#00ff41' : '#aaa' }}>{entry.name}</span>
                    <span style={{ color: '#ffea00' }}>{entry.weight}kg</span>
                  </div>
                ))}
              </div>
              {submission && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                  <BaseButton label="Claim Prize" onClick={handleClaimPrize} />
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ color: '#00ff41', margin: '0 0 10px 0' }}>🏆 Weekly {targetCropName} Weigh-In 🏆</h2>
                {submission ? (
                  <div style={{ backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid #5a402a', borderRadius: '8px', padding: '15px', marginTop: '10px' }}>
                    <p style={{ color: '#00ff41', fontSize: '18px', margin: '0 0 10px 0', fontWeight: 'bold' }}>Ticket Submitted!</p>
                    <p style={{ margin: '0 0 10px 0' }}>Your Entry: <span style={{ color: '#ffea00' }}>{submission.weight}kg {targetCropName}</span></p>
                    <p style={{ color: '#ccc', margin: 0 }}>The competition ends in <strong style={{ color: '#fff' }}>{daysUntilSunday} {daysUntilSunday === 1 ? 'day' : 'days'}</strong> (on Sunday).</p>
                    <p style={{ color: '#aaa', fontSize: '12px', marginTop: '10px', fontStyle: 'italic' }}>* Leaderboard is hidden until the competition ends.</p>
                  </div>
                ) : (
                  <p style={{ margin: 0, color: '#ccc' }}>This week's weight competition is for {targetCropName}. Please submit your ticket and choose which {targetCropName.toLowerCase()} you want to enter.</p>
                )}
              </div>

              {!submission && (
                <div style={{ overflowY: 'auto', maxHeight: '300px', paddingRight: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {individualCrops.length > 0 ? individualCrops.map((crop) => (
                    <div key={crop.id} style={{ backgroundColor: 'rgba(31, 22, 16, 0.8)', border: '2px solid #5a402a', borderRadius: '8px', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          {targetCropData?.image && targetCropData.image.includes('crop') ? (
                             <div style={{ 
                                 width: `${ONE_SEED_WIDTH}px`, height: `${ONE_SEED_HEIGHT}px`, 
                                 backgroundImage: `url(${targetCropData.image})`, 
                                 backgroundPosition: `-${5 * ONE_SEED_WIDTH}px -${(targetCropData.pos || 0) * ONE_SEED_HEIGHT}px`,
                                 transform: 'scale(0.6)', backgroundRepeat: 'no-repeat'
                             }} />
                          ) : targetCropData?.image && targetCropData.image.includes('seeds') ? (
                             <div className="item-icon item-icon-seeds" style={{ width: '40px', height: '40px', transform: 'scale(0.8)', backgroundPositionY: targetCropData.pos ? `-${targetCropData.pos * ONE_SEED_HEIGHT * 0.308}px` : 0 }}></div>
                          ) : (
                             <img src={targetCropData?.image} alt={targetCropName} style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
                          )}
                        </div>
                        <span style={{ color: '#00ff41', fontWeight: 'bold', fontSize: '16px', fontFamily: 'monospace', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>{crop.name} - <span style={{ color: '#fff' }}>{crop.weight}kg</span></span>
                      </div>
                      <BaseButton small label="Submit" onClick={() => handleSelect(crop)} />
                    </div>
                  )) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#ff4444', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '8px', border: '1px solid #ff4444' }}>You don't have any {targetCropName}s to submit! Go farm some.</div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </BaseDialog>
    </>
  );
};

export const CalendarDialog = ({ onClose, simulatedDay, simulatedDate, refetch, onClaimed }) => {
  const { show } = useNotification();
  const estDate = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthName = monthNames[estDate.getMonth()];
  const year = estDate.getFullYear();
  const month = estDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = (firstDay + 6) % 7;

  const blanks = Array.from({ length: startOffset }, (_, i) => null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const [streak, setStreak] = useState(() => parseInt(localStorage.getItem('sandbox_login_streak') || '0', 10));
  const [lastClaimDate, setLastClaimDate] = useState(() => localStorage.getItem('sandbox_last_claim_date') || '');

  const today = new Date().toDateString();
  const canClaim = lastClaimDate !== today;

  const DAILY_REWARDS = [
    { day: 1, id: 9993, name: "Wood", count: 10, image: "/images/forest/wood.png" },
    { day: 2, id: 9994, name: "Stone", count: 10, image: "/images/forest/rock.png" },
    { day: 3, id: 'honey', name: "Honey", count: 100, image: "/images/items/honey.png" },
    { day: 4, id: 9995, name: "Sticks", count: 10, image: "/images/forest/wood.png" },
    { day: 5, id: 9996, name: "Iron Ore", count: 5, image: "/images/forest/ironrock.png" },
    { day: 6, id: 9997, name: "Gold Ore", count: 2, image: "/images/forest/goldrock.png" },
    { day: 7, id: 'chest', name: "Bronze Chest", count: 1, image: "/images/items/chest.png" }
  ];

  const handleClaim = () => {
    if (!canClaim) return;
    const reward = DAILY_REWARDS[streak % 7];

    if (reward.id === 'honey') {
      const currentHoney = parseInt(localStorage.getItem('sandbox_honey') || '0', 10);
      const newHoney = currentHoney + reward.count;
      localStorage.setItem('sandbox_honey', newHoney.toString());
      window.dispatchEvent(new CustomEvent('sandboxHoneyChanged', { detail: newHoney.toString() }));
    } else {
      const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
      const itemId = reward.id === 'chest' ? (ID_CHEST_ITEMS?.CHEST_BRONZE || 20001) : reward.id;
      sandboxLoot[itemId] = (sandboxLoot[itemId] || 0) + reward.count;
      localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    }

    const nextStreak = (streak + 1) % 7;
    setStreak(nextStreak);
    setLastClaimDate(today);
    localStorage.setItem('sandbox_login_streak', nextStreak.toString());
    localStorage.setItem('sandbox_last_claim_date', today);

    show(`Claimed ${reward.count}x ${reward.name}!`, "success");
    if (refetch) refetch();
    if (onClaimed) onClaimed();
  };

  const VISIBLE_WINDOW = 7;

  return (
    <BaseDialog onClose={onClose} title="CALENDAR" header="/images/dialog/modal-header-inventory.png" headerOffset={10} className="custom-modal-background">
      <div style={{ padding: '20px', color: '#fff', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', gap: '15px', width: '700px', maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: '#00ff41', margin: 0 }}>{monthName} {year}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            <span style={{ color: '#ccc', fontSize: '12px' }}>Login Streak: <span style={{ color: '#ffea00', fontWeight: 'bold' }}>{streak % 7 + 1}/7</span></span>
            <BaseButton small label={canClaim ? "Claim Today's Reward" : "Come back tomorrow!"} disabled={!canClaim} onClick={handleClaim} />
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '6px',
          backgroundColor: 'rgba(0,0,0,0.5)',
          border: '2px solid #5a402a',
          borderRadius: '8px',
          padding: '12px'
        }}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d} style={{ textAlign: 'center', color: '#ccc', fontWeight: 'bold', paddingBottom: '8px', borderBottom: '1px solid #5a402a', marginBottom: '4px', fontSize: '12px' }}>
              {d}
            </div>
          ))}
          {blanks.map((_, i) => (
            <div key={`blank-${i}`} style={{ height: '88px' }} />
          ))}
          {days.map(day => {
            const currentDayOfWeek = (startOffset + day - 1) % 7;
            const isSunday = currentDayOfWeek === 6;
            const isToday = day === simulatedDate;
            const isPast = day < simulatedDate;
            const daysFromToday = day - simulatedDate;
            const isBeyondWindow = daysFromToday >= VISIBLE_WINDOW;

            const weatherEmoji = getWeatherForDay(day);
            const weatherTitle = weatherEmoji === '⚡' ? 'Lightning Storm' : weatherEmoji === '🌧️' ? 'Rainy' : weatherEmoji === '☁️' ? 'Cloudy' : 'Sunny';

            // Which reward cycle position does this day map to?
            const rewardIndex = ((streak % 7) + Math.max(0, daysFromToday)) % 7;
            const reward = DAILY_REWARDS[rewardIndex];
            const isClaimed = isPast || (isToday && !canClaim);
            const showReward = !isPast;

            return (
              <div key={day} style={{
                height: '88px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
                padding: '4px',
                border: isToday ? '2px solid #00ff41' : '1px solid #5a402a',
                backgroundColor: isToday ? 'rgba(0,255,65,0.12)' : isPast ? 'rgba(20,14,10,0.8)' : 'rgba(31,22,16,0.8)',
                color: isToday ? '#00ff41' : isPast ? '#555' : '#fff',
                borderRadius: '4px',
                position: 'relative',
                overflow: 'hidden',
                filter: isBeyondWindow ? 'blur(4px)' : 'none',
                pointerEvents: isBeyondWindow ? 'none' : 'auto',
                userSelect: isBeyondWindow ? 'none' : 'auto',
              }}>
                {/* Date + weather row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ fontSize: '12px', opacity: isBeyondWindow ? 0 : 1 }} title={weatherTitle}>{weatherEmoji}</span>
                  <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{day}</span>
                </div>

                {/* Reward */}
                {showReward && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px', marginTop: '2px' }}>
                    <img
                      src={reward.image}
                      alt={reward.name}
                      style={{ width: '22px', height: '22px', objectFit: 'contain', opacity: isClaimed ? 0.4 : 1 }}
                      onError={(e) => { e.target.onerror = null; e.target.src = '/images/forest/rock.png'; }}
                    />
                    <span style={{ fontSize: '9px', color: isClaimed ? '#555' : '#ffea00', textAlign: 'center', lineHeight: 1.2 }}>
                      {reward.count}x {reward.name}
                    </span>
                  </div>
                )}

                {/* Claimed checkmark */}
                {isClaimed && (
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '22px', color: '#00ff41', textShadow: '0 0 6px #000', pointerEvents: 'none' }}>✓</div>
                )}

                {/* Sunday weigh-in icon */}
                {isSunday && !isBeyondWindow && (
                  <img src="/images/weight/weightcontest.png" alt="Weigh-in" style={{ width: '24px', height: '24px', position: 'absolute', bottom: '2px', right: '2px', opacity: 0.85, filter: 'drop-shadow(0px 1px 2px black)' }} title="Weekly Weigh-In!" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </BaseDialog>
  );
};

// Helper to calculate level from XP
const getLevelFromXp = (xp) => Math.floor(Math.sqrt((xp || 0) / 150)) + 1;

export const CraftingDialog = ({ onClose, refetchSeeds, tutorialStep, onAdvanceTutorial, craftingGoal }) => {
  const { all: allItems, refetch } = useItems();
  const { show } = useNotification();
  const [activeTab, setActiveTab] = useState(craftingGoal ? (craftingGoal.tab || 'items') : 'tools'); // 'tools' or 'items'
  const [craftAmounts, setCraftAmounts] = useState(craftingGoal ? { [craftingGoal.recipeId]: craftingGoal.amount || 1 } : {});
  
  const safeItems = allItems || [];
  const woodCount = safeItems.find(i => i.id === 9993)?.count || 0;
  const specialWoodCount = safeItems.find(i => i.id === 9942)?.count || 0;
  const stoneCount = safeItems.find(i => i.id === 9994)?.count || 0;
  const sticksCount = safeItems.find(i => i.id === 9995)?.count || 0;
  const stonePipeCount = safeItems.find(i => i.id === 9990)?.count || 0;
  const ironCount = safeItems.find(i => i.id === 9996)?.count || 0;
  const pumpkinCount = safeItems.find(i => i.id === ID_PRODUCE_ITEMS.PUMPKIN)?.count || 0;
  const cornCount = safeItems.find(i => i.id === ID_PRODUCE_ITEMS.CORN)?.count || 0;
  const plankCount = safeItems.find(i => i.id === 9989)?.count || 0;
  const axeCount = safeItems.find(i => i.id === 9991)?.count || 0;
  const pickaxeCount = safeItems.find(i => i.id === 9992)?.count || 0;
  const ironPickaxeCount = safeItems.find(i => i.id === 9981)?.count || 0;
  const ladybugScarecrowCount = safeItems.find(i => i.id === 9979)?.count || 0;
  const tier2ScarecrowCount = safeItems.find(i => i.id === 9978)?.count || 0;
  const tier3ScarecrowCount = safeItems.find(i => i.id === 9977)?.count || 0;
  const tier4ScarecrowCount = safeItems.find(i => i.id === 9976)?.count || 0;
  const teslaTowerCount = safeItems.find(i => i.id === 9975)?.count || 0;

  const ladybugCount = safeItems.find(i => i.id === ID_POTION_ITEMS.LADYBUG)?.count || 0;
  const scarecrowBaseCount = safeItems.find(i => i.id === ID_POTION_ITEMS.SCARECROW)?.count || 0;
  const leavesCount = safeItems.find(i => i.id === 9956)?.count || 0;
  
  const hempCount = safeItems.find(i => i.id === 9972)?.count || 0;
  const cottonCount = safeItems.find(i => i.id === 9971)?.count || 0;
  const ropeCount = safeItems.find(i => i.id === 9970)?.count || 0;
  const canvasCount = safeItems.find(i => i.id === 9969)?.count || 0;
  const copperCount = safeItems.find(i => i.id === 9974)?.count || 0;
  const coalCount = safeItems.find(i => i.id === 9973)?.count || 0;
  const nailsCount = safeItems.find(i => i.id === 9968)?.count || 0;
  const steelCount = safeItems.find(i => i.id === 9967)?.count || 0;
  const engineCount = safeItems.find(i => i.id === 9962)?.count || 0;

  const farmDataStr = localStorage.getItem('sandbox_animal_farm') || '{}';
  const farmData = JSON.parse(farmDataStr);
  const hasCoop = farmData?.coop?.status && farmData.coop.status !== 'unbuilt';
  const hasSheepcage = farmData?.sheepcage?.status && farmData.sheepcage.status !== 'unbuilt';
  const hasCowbarn = farmData?.cowbarn?.status && farmData.cowbarn.status !== 'unbuilt';

  const [craftingXp, setCraftingXp] = useState(() => parseInt(localStorage.getItem('sandbox_crafting_xp') || '0', 10));
  const craftingLevel = getLevelFromXp(craftingXp);
  const craftingProgress = ((craftingXp - Math.pow(craftingLevel - 1, 2) * 150) / (Math.pow(craftingLevel, 2) * 150 - Math.pow(craftingLevel - 1, 2) * 150)) * 100;

  useEffect(() => {
    const handleLsUpdate = (e) => {
      if (e.detail.key === 'sandbox_crafting_xp') setCraftingXp(parseInt(e.detail.value, 10));
    };
    window.addEventListener('ls-update', handleLsUpdate);
    return () => window.removeEventListener('ls-update', handleLsUpdate);
  }, []);

  const addCraftingXp = (amount) => {
    const oldLevel = getLevelFromXp(craftingXp);
    const newXp = craftingXp + amount;
    const newLevel = getLevelFromXp(newXp);
    setCraftingXp(newXp);
    localStorage.setItem('sandbox_crafting_xp', newXp.toString());
    if (newLevel > oldLevel) {
      window.dispatchEvent(new CustomEvent('levelUp', { detail: { skill: 'Crafting', level: newLevel } }));
    }
  };

  const handleCraftGeneric = (resultId, reqs, amount, xpReward) => {
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    const sandboxProduce = JSON.parse(localStorage.getItem('sandbox_produce') || '{}');
    
    for (const [id, count] of reqs) {
      let available = 0;
      if (Array.isArray(sandboxProduce[id])) available = sandboxProduce[id].length;
      else available = (Number(sandboxProduce[id]) || 0) + (Number(sandboxLoot[id]) || 0);
      if (available < count * amount) return;
    }
    
    for (const [id, count] of reqs) {
      let remaining = count * amount;
      if (sandboxProduce[id] !== undefined) {
        if (Array.isArray(sandboxProduce[id])) {
          while(remaining > 0 && sandboxProduce[id].length > 0) { sandboxProduce[id].pop(); remaining--; }
        } else {
          const deduct = Math.min(Number(sandboxProduce[id]) || 0, remaining);
          sandboxProduce[id] = (Number(sandboxProduce[id]) || 0) - deduct;
          remaining -= deduct;
        }
      }
      if (remaining > 0) sandboxLoot[id] = Math.max(0, (sandboxLoot[id] || 0) - remaining);
    }
    
    sandboxLoot[resultId] = (sandboxLoot[resultId] || 0) + amount;
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    localStorage.setItem('sandbox_produce', JSON.stringify(sandboxProduce));
    if (refetch) refetch();
    if (refetchSeeds) refetchSeeds();
    addCraftingXp(xpReward * amount);
    show(`Crafted successfully!`, "success");
  };

  const handleCraftSticks = (amount = 1) => {
    if (woodCount < 2 * amount) return;
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    sandboxLoot[9993] = Math.max(0, (sandboxLoot[9993] || 0) - 2 * amount);
    sandboxLoot[9995] = (sandboxLoot[9995] || 0) + 1 * amount;
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    if (refetch) refetch();
    if (refetchSeeds) refetchSeeds();
    addCraftingXp(5 * amount);
    show(`Crafted ${amount} Stick${amount > 1 ? 's' : ''}!`, "success");
  };

  const handleCraftPlank = (amount = 1) => {
    if (woodCount < 10 * amount) return;
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    sandboxLoot[9993] = Math.max(0, (sandboxLoot[9993] || 0) - 10 * amount);
    sandboxLoot[9989] = (sandboxLoot[9989] || 0) + 1 * amount;
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    if (refetch) refetch();
    if (refetchSeeds) refetchSeeds();
    addCraftingXp(15 * amount);
    show(`Crafted ${amount} Wooden Plank${amount > 1 ? 's' : ''}!`, "success");
  };

  const handleCraftStonePipe = (amount = 1) => {
    if (stoneCount < 2 * amount) return;
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    sandboxLoot[9994] = Math.max(0, (sandboxLoot[9994] || 0) - 2 * amount);
    sandboxLoot[9990] = (sandboxLoot[9990] || 0) + 2 * amount;
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    if (refetch) refetch();
    if (refetchSeeds) refetchSeeds();
    addCraftingXp(10 * amount);
    show(`Crafted ${2 * amount} Stone Pipes!`, "success");
  };

  const handleCraftScarecrow = (amount = 1) => {
    if (sticksCount < 3 * amount || pumpkinCount < 1 * amount) return;
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    const sandboxProduce = JSON.parse(localStorage.getItem('sandbox_produce') || '{}');

    sandboxLoot[9995] = Math.max(0, (sandboxLoot[9995] || 0) - 3 * amount);
    
    let remainingPumpkinToDeduct = 1 * amount;
    if (sandboxProduce[ID_PRODUCE_ITEMS.PUMPKIN] > 0) {
      const deduct = Math.min(sandboxProduce[ID_PRODUCE_ITEMS.PUMPKIN], remainingPumpkinToDeduct);
      sandboxProduce[ID_PRODUCE_ITEMS.PUMPKIN] -= deduct;
      remainingPumpkinToDeduct -= deduct;
      localStorage.setItem('sandbox_produce', JSON.stringify(sandboxProduce));
    }
    if (remainingPumpkinToDeduct > 0) {
      sandboxLoot[ID_PRODUCE_ITEMS.PUMPKIN] = Math.max(0, (sandboxLoot[ID_PRODUCE_ITEMS.PUMPKIN] || 0) - remainingPumpkinToDeduct);
    }
    
    sandboxLoot[ID_POTION_ITEMS.SCARECROW] = (sandboxLoot[ID_POTION_ITEMS.SCARECROW] || 0) + 1 * amount;
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    
    if (refetch) refetch();
    if (refetchSeeds) refetchSeeds();
    addCraftingXp(25 * amount);
    show(`Crafted ${amount} Scarecrow${amount > 1 ? 's' : ''}!`, "success");
  };

  const handleCraftUmbrella = (amount = 1) => {
    if (sticksCount < 2 * amount || cornCount < 5 * amount) return;
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    const sandboxProduce = JSON.parse(localStorage.getItem('sandbox_produce') || '{}');

    sandboxLoot[9995] = Math.max(0, (sandboxLoot[9995] || 0) - 2 * amount);
    
    let remainingCornToDeduct = 5 * amount;
    if (sandboxProduce[ID_PRODUCE_ITEMS.CORN] > 0) {
      const deduct = Math.min(sandboxProduce[ID_PRODUCE_ITEMS.CORN], remainingCornToDeduct);
      sandboxProduce[ID_PRODUCE_ITEMS.CORN] -= deduct;
      remainingCornToDeduct -= deduct;
      localStorage.setItem('sandbox_produce', JSON.stringify(sandboxProduce));
    }
    if (remainingCornToDeduct > 0) {
      sandboxLoot[ID_PRODUCE_ITEMS.CORN] = Math.max(0, (sandboxLoot[ID_PRODUCE_ITEMS.CORN] || 0) - remainingCornToDeduct);
    }
    
    sandboxLoot[9999] = (sandboxLoot[9999] || 0) + 1 * amount;
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    
    if (refetch) refetch();
    if (refetchSeeds) refetchSeeds();
    addCraftingXp(20 * amount);
    show(`Crafted ${amount} Umbrella${amount > 1 ? 's' : ''}!`, "success");
  };

  const handleCraftSprinkler = (amount = 1) => {
    if (stonePipeCount < 2 * amount || ironCount < 1 * amount) return;
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');

    sandboxLoot[9990] = Math.max(0, (sandboxLoot[9990] || 0) - 2 * amount);
    sandboxLoot[9996] = Math.max(0, (sandboxLoot[9996] || 0) - 1 * amount);
    
    sandboxLoot[9998] = (sandboxLoot[9998] || 0) + 1 * amount;
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    
    if (refetch) refetch();
    if (refetchSeeds) refetchSeeds();
    addCraftingXp(40 * amount);
    show(`Crafted ${amount} Water Sprinkler${amount > 1 ? 's' : ''}!`, "success");
  };

  const handleCraftAxe = (amount = 1) => {
    if (sticksCount < 3 * amount || stoneCount < 3 * amount) return;
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    sandboxLoot[9995] = Math.max(0, (sandboxLoot[9995] || 0) - 3 * amount);
    sandboxLoot[9994] = Math.max(0, (sandboxLoot[9994] || 0) - 3 * amount);
    sandboxLoot[9991] = (sandboxLoot[9991] || 0) + 1 * amount;
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    if (refetch) refetch();
    if (refetchSeeds) refetchSeeds();
    addCraftingXp(15 * amount);
    show(`Crafted ${amount} Axe${amount > 1 ? 's' : ''}!`, "success");
    if (tutorialStep === 26 && pickaxeCount > 0 && onAdvanceTutorial) onAdvanceTutorial();
  };

  const handleCraftPickaxe = (amount = 1) => {
    if (sticksCount < 3 * amount || stoneCount < 3 * amount) return;
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    sandboxLoot[9995] = Math.max(0, (sandboxLoot[9995] || 0) - 3 * amount);
    sandboxLoot[9994] = Math.max(0, (sandboxLoot[9994] || 0) - 3 * amount);
    sandboxLoot[9992] = (sandboxLoot[9992] || 0) + 1 * amount;
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    if (refetch) refetch();
    if (refetchSeeds) refetchSeeds();
    addCraftingXp(15 * amount);
    show(`Crafted ${amount} Pickaxe${amount > 1 ? 's' : ''}!`, "success");
    if (tutorialStep === 26 && axeCount > 0 && onAdvanceTutorial) onAdvanceTutorial();
  };

  const handleCraftIronPickaxe = (amount = 1) => {
    if (sticksCount < 3 * amount || ironCount < 3 * amount) return;
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    sandboxLoot[9995] = Math.max(0, (sandboxLoot[9995] || 0) - 3 * amount);
    sandboxLoot[9996] = Math.max(0, (sandboxLoot[9996] || 0) - 3 * amount);
    sandboxLoot[9981] = (sandboxLoot[9981] || 0) + 1 * amount;
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    if (refetch) refetch();
    if (refetchSeeds) refetchSeeds();
    addCraftingXp(50 * amount);
    show(`Crafted ${amount} Iron Pickaxe${amount > 1 ? 's' : ''}!`, "success");
  };

  const handleCraftLadybugScarecrow = (amount = 1) => {
    if (scarecrowBaseCount < 1 * amount || ladybugCount < 10 * amount || specialWoodCount < 1 * amount) return;
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    sandboxLoot[ID_POTION_ITEMS.SCARECROW] = Math.max(0, (sandboxLoot[ID_POTION_ITEMS.SCARECROW] || 0) - 1 * amount);
    sandboxLoot[ID_POTION_ITEMS.LADYBUG] = Math.max(0, (sandboxLoot[ID_POTION_ITEMS.LADYBUG] || 0) - 10 * amount);
    sandboxLoot[9942] = Math.max(0, (sandboxLoot[9942] || 0) - 1 * amount);
    sandboxLoot[9979] = (sandboxLoot[9979] || 0) + 1 * amount;
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    if (refetch) refetch();
    addCraftingXp(35 * amount);
    show(`Crafted ${amount} Ladybug Scarecrow${amount > 1 ? 's' : ''}!`, "success");
  };

  const handleCraftTier2 = (amount = 1) => {
    if (scarecrowBaseCount < 5 * amount || specialWoodCount < 1 * amount) return;
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    sandboxLoot[ID_POTION_ITEMS.SCARECROW] = Math.max(0, (sandboxLoot[ID_POTION_ITEMS.SCARECROW] || 0) - 5 * amount);
    sandboxLoot[9942] = Math.max(0, (sandboxLoot[9942] || 0) - 1 * amount);
    sandboxLoot[9978] = (sandboxLoot[9978] || 0) + 1 * amount;
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    if (refetch) refetch();
    addCraftingXp(50 * amount);
    show(`Crafted ${amount} Tier 2 Scarecrow${amount > 1 ? 's' : ''}!`, "success");
  };

  const handleCraftTier3 = (amount = 1) => {
    if (tier2ScarecrowCount < 4 * amount || woodCount < 10 * amount || specialWoodCount < 2 * amount) return;
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    sandboxLoot[9978] = Math.max(0, (sandboxLoot[9978] || 0) - 4 * amount);
    sandboxLoot[9993] = Math.max(0, (sandboxLoot[9993] || 0) - 10 * amount);
    sandboxLoot[9942] = Math.max(0, (sandboxLoot[9942] || 0) - 2 * amount);
    sandboxLoot[9977] = (sandboxLoot[9977] || 0) + 1 * amount;
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    if (refetch) refetch();
    addCraftingXp(100 * amount);
    show(`Crafted ${amount} Tier 3 Scarecrow${amount > 1 ? 's' : ''}!`, "success");
  };

  const handleCraftTier4 = (amount = 1) => {
    if (tier3ScarecrowCount < 3 * amount || (safeItems.find(i => i.id === 9997)?.count || 0) < 5 * amount || specialWoodCount < 5 * amount) return; // 9997 = Gold
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    sandboxLoot[9977] = Math.max(0, (sandboxLoot[9977] || 0) - 3 * amount);
    sandboxLoot[9997] = Math.max(0, (sandboxLoot[9997] || 0) - 5 * amount);
    sandboxLoot[9942] = Math.max(0, (sandboxLoot[9942] || 0) - 5 * amount);
    sandboxLoot[9976] = (sandboxLoot[9976] || 0) + 1 * amount;
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    if (refetch) refetch();
    addCraftingXp(250 * amount);
    show(`Crafted ${amount} Max Tier Scarecrow${amount > 1 ? 's' : ''}!`, "success");
  };

  const handleCraftTesla = (amount = 1) => {
    if (ironCount < 10 * amount || stonePipeCount < 5 * amount) return;
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    sandboxLoot[9996] = Math.max(0, (sandboxLoot[9996] || 0) - 10 * amount); // Iron
    sandboxLoot[9990] = Math.max(0, (sandboxLoot[9990] || 0) - 5 * amount);  // Pipes
    sandboxLoot[9975] = (sandboxLoot[9975] || 0) + 1 * amount;
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    if (refetch) refetch();
    addCraftingXp(150 * amount);
    show(`Crafted ${amount} Tesla Tower${amount > 1 ? 's' : ''}!`, "success");
  };

  const highlightSticks = tutorialStep === 26 && (axeCount === 0 || pickaxeCount === 0) && sticksCount < 3;
  const highlightAxe = tutorialStep === 26 && axeCount === 0 && sticksCount >= 3;
  const highlightPickaxe = tutorialStep === 26 && pickaxeCount === 0 && sticksCount >= 3;

  const recipes = {
    tools: [
      {
        id: 'axe',
        name: 'Axe',
        description: 'Used to chop down trees in the Forest for Wood and Leaves.',
        minLevel: 1,
        image: ALL_ITEMS[9991]?.image || '/images/forest/axe.png',
        costFunc: (amt) => `${3 * amt} Sticks, ${3 * amt} Stone`,
        canCraft: (amt) => sticksCount >= 3 * amt && stoneCount >= 3 * amt,
        onCraft: (amt) => handleCraftAxe(amt),
        highlight: highlightAxe,
        tutorialLocked: tutorialStep === 26 && axeCount > 0
      },
      {
        id: 'pickaxe',
        name: 'Pickaxe',
        description: 'Used to mine rocks in the Cave for Stone, Coal, and Ores.',
        minLevel: 1,
        image: ALL_ITEMS[9992]?.image || '/images/forest/picaxe.png',
        costFunc: (amt) => `${3 * amt} Sticks, ${3 * amt} Stone`,
        canCraft: (amt) => sticksCount >= 3 * amt && stoneCount >= 3 * amt,
        onCraft: (amt) => handleCraftPickaxe(amt),
        highlight: highlightPickaxe,
        tutorialLocked: tutorialStep === 26 && pickaxeCount > 0
      },
      {
        id: 'iron_pickaxe',
        name: 'Iron Pickaxe',
        description: 'A much stronger pickaxe required to mine Gold Rocks.',
        minLevel: 5,
        image: ALL_ITEMS[9981]?.image || '/images/forest/picaxe.png',
        imageFilter: 'drop-shadow(0px 0px 5px #00ff41) brightness(1.2)',
        costFunc: (amt) => `${3 * amt} Sticks, ${3 * amt} Iron`,
        canCraft: (amt) => sticksCount >= 3 * amt && ironCount >= 3 * amt,
        onCraft: (amt) => handleCraftIronPickaxe(amt),
        highlight: craftingGoal?.recipeId === 'iron_pickaxe'
      },
      {
        id: 'bug_net',
        name: 'Bug Net',
        description: 'Used to safely catch bugs hidden in Forest bushes.',
        minLevel: 2,
        image: '/images/forest/net.png',
        costFunc: (amt) => `${3 * amt} Sticks, ${4 * amt} Rope`,
        canCraft: (amt) => sticksCount >= 3 * amt && ropeCount >= 4 * amt,
        onCraft: (amt) => handleCraftGeneric(9988, [[9995, 3], [9970, 4]], amt, 25),
        highlight: craftingGoal?.recipeId === 'bug_net'
      }
    ],
    items: [
      {
        id: 'bucket',
        name: 'Bucket',
        description: 'Allows you to draw items and water from the Well.',
        minLevel: 2,
        image: ALL_ITEMS[9953]?.image || '/images/forest/wood.png',
        costFunc: (amt) => `${5 * amt} Wood, ${1 * amt} Sticks`,
        canCraft: (amt) => woodCount >= 5 * amt && sticksCount >= 1 * amt,
        onCraft: (amt) => {
          if (woodCount < 5 * amt || sticksCount < 1 * amt) return;
          const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
          sandboxLoot[9993] = Math.max(0, (sandboxLoot[9993] || 0) - 5 * amt);
          sandboxLoot[9995] = Math.max(0, (sandboxLoot[9995] || 0) - 1 * amt);
          sandboxLoot[9953] = (sandboxLoot[9953] || 0) + 1 * amt;
          localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
          if (refetch) refetch();
          addCraftingXp(15 * amt);
          show(`Crafted ${amt} Bucket${amt > 1 ? 's' : ''}!`, "success");
        },
        highlight: craftingGoal?.recipeId === 'bucket'
      },
      {
        id: 'plank',
        name: 'Wooden Plank',
        description: 'A refined wooden board used in advanced crafting.',
        minLevel: 1,
        image: ALL_ITEMS[9989]?.image || '/images/forest/wood.png',
        costFunc: (amt) => `${10 * amt} Wood`,
        canCraft: (amt) => woodCount >= 10 * amt,
        onCraft: (amt) => handleCraftPlank(amt),
        highlight: craftingGoal?.recipeId === 'plank'
      },
      {
        id: 'sticks',
        name: 'Sticks',
        description: 'Basic component for tool handles and structures.',
        minLevel: 1,
        image: ALL_ITEMS[9995]?.image || '/images/forest/wood.png',
        costFunc: (amt) => `${2 * amt} Wood`,
        canCraft: (amt) => woodCount >= 2 * amt,
        onCraft: (amt) => handleCraftSticks(amt),
        highlight: highlightSticks || craftingGoal?.recipeId === 'sticks'
      },
    {
        id: 'stone_pipe',
        name: 'Stone Pipe (x2)',
        description: 'Used to channel water for automated systems.',
        minLevel: 2,
        image: ALL_ITEMS[9990]?.image || '/images/forest/stone.png',
        costFunc: (amt) => `${2 * amt} Stone`,
        canCraft: (amt) => stoneCount >= 2 * amt,
        onCraft: (amt) => handleCraftStonePipe(amt),
        highlight: craftingGoal?.recipeId === 'stone_pipe'
      },
      {
        id: 'scarecrow',
        name: 'Scarecrow',
        description: 'Protects the specific plot it is placed on from crows.',
        minLevel: 1,
        image: ALL_ITEMS[ID_POTION_ITEMS?.SCARECROW]?.image || '/images/scarecrow/scarecrow1.png',
        costFunc: (amt) => `${3 * amt} Sticks, ${1 * amt} Pumpkin`,
        canCraft: (amt) => sticksCount >= 3 * amt && pumpkinCount >= 1 * amt,
        onCraft: (amt) => handleCraftScarecrow(amt),
        highlight: craftingGoal?.recipeId === 'scarecrow'
      },
      {
        id: 'umbrella',
        name: 'Umbrella',
        description: 'Protects crops from overwatering during storms.',
        minLevel: 3,
        image: ALL_ITEMS[9999]?.image || '/images/items/umbrella.png',
        costFunc: (amt) => `${2 * amt} Sticks, ${5 * amt} Corn`,
        canCraft: (amt) => sticksCount >= 2 * amt && cornCount >= 5 * amt,
        onCraft: (amt) => handleCraftUmbrella(amt),
        highlight: craftingGoal?.recipeId === 'umbrella'
      },
      {
        id: 'rope',
        name: 'Rope',
        description: 'Sturdy woven leaves used to tie things together.',
        minLevel: 2,
        image: '/images/crafting/hemp_rope.png',
        costFunc: (amt) => `${10 * amt} Leaves`,
        canCraft: (amt) => leavesCount >= 10 * amt,
        onCraft: (amt) => handleCraftGeneric(9970, [[9956, 10]], amt, 15),
        highlight: craftingGoal?.recipeId === 'rope'
      },
      {
        id: 'canvas',
        name: 'Canvas',
        description: 'Heavy fabric woven from cotton, essential for building sailboats.',
        minLevel: 5,
        image: '/images/crafting/canvas.png',
        costFunc: (amt) => `${10 * amt} Cotton`,
        canCraft: (amt) => cottonCount >= 10 * amt,
        onCraft: (amt) => handleCraftGeneric(9969, [[9971, 10]], amt, 25),
      },
      {
        id: 'copper_nails',
        name: 'Copper Nails',
        description: 'Strong nails used in shipwrighting.',
        minLevel: 4,
        image: '/images/crafting/copper_nails.png',
        costFunc: (amt) => `${2 * amt} Copper Ore`,
        canCraft: (amt) => copperCount >= 2 * amt,
        onCraft: (amt) => handleCraftGeneric(9968, [[9974, 2]], amt, 20),
      },
      {
        id: 'steel_plate',
        name: 'Steel Plate',
        description: 'Heavy armor plating for industrial machines.',
        minLevel: 10,
        image: '/images/crafting/steel_plate.png',
        costFunc: (amt) => `${2 * amt} Iron, ${1 * amt} Coal`,
        canCraft: (amt) => ironCount >= 2 * amt && coalCount >= 1 * amt,
        onCraft: (amt) => handleCraftGeneric(9967, [[9996, 2], [9973, 1]], amt, 40),
      },
      {
        id: 'crab_pot',
        name: 'Crab Pot',
        description: 'Catches crabs passively over time in the water.',
        minLevel: 10,
        image: '/images/items/crab_pot.png',
        costFunc: (amt) => `${10 * amt} Wood, ${2 * amt} Iron, ${3 * amt} Rope`,
        canCraft: (amt) => woodCount >= 10 * amt && ironCount >= 2 * amt && ropeCount >= 3 * amt,
        onCraft: (amt) => handleCraftGeneric(9966, [[9993, 10], [9996, 2], [9970, 3]], amt, 50),
      },
      {
        id: 'rowboat',
        name: 'Rowboat',
        description: 'A small boat to fish in the local lake.',
        minLevel: 5,
        image: '/images/items/rowboat.png',
        costFunc: (amt) => `${30 * amt} Wood, ${20 * amt} Sticks, ${10 * amt} Iron`,
        canCraft: (amt) => woodCount >= 30 * amt && sticksCount >= 20 * amt && ironCount >= 10 * amt && ropeCount >= 5 * amt,
        onCraft: (amt) => handleCraftGeneric(9965, [[9993, 30], [9995, 20], [9996, 10], [9970, 5]], amt, 200),
      },
      {
        id: 'sailboat',
        name: 'Sailboat',
        description: 'A larger vessel to brave the open ocean.',
        minLevel: 15,
        image: '/images/items/sailboat.png',
        costFunc: (amt) => `${100 * amt} Wood, ${50 * amt} Iron, ${20 * amt} Canvas`,
        canCraft: (amt) => woodCount >= 100 * amt && ironCount >= 50 * amt && canvasCount >= 20 * amt && nailsCount >= 20 * amt,
        onCraft: (amt) => handleCraftGeneric(9964, [[9993, 100], [9996, 50], [9969, 20], [9968, 20]], amt, 500),
      },
      {
        id: 'trawler',
        name: 'Trawler',
        description: 'A massive industrial ship for deep sea fishing.',
        minLevel: 30,
        image: '/images/items/trawler.png',
        costFunc: (amt) => `${100 * amt} Wood, ${50 * amt} Steel, ${1 * amt} Engine`,
        canCraft: (amt) => woodCount >= 100 * amt && steelCount >= 50 * amt && engineCount >= 1 * amt,
        onCraft: (amt) => handleCraftGeneric(9963, [[9993, 100], [9967, 50], [9962, 1]], amt, 1500),
      },
      {
        id: 'sprinkler',
        name: 'Sprinkler',
        description: 'Automatically waters crops so you don\'t have to.',
        minLevel: 4,
        image: ALL_ITEMS[9998]?.image || '/images/items/watersprinkler.png',
        costFunc: (amt) => `${2 * amt} Pipes, ${1 * amt} Iron`,
        canCraft: (amt) => stonePipeCount >= 2 * amt && ironCount >= 1 * amt,
        onCraft: (amt) => handleCraftSprinkler(amt),
        highlight: craftingGoal?.recipeId === 'sprinkler'
      },
      {
        id: 'ladybug_scarecrow',
        name: 'Ladybug Scarecrow',
        description: 'Protects crops from pests and attracts friendly bugs.',
        minLevel: 5,
        image: ALL_ITEMS[9979]?.image || '/images/scarecrow/ladybug_scarecrow.png',
        costFunc: (amt) => `${1 * amt} Scarecrow, ${10 * amt} Ladybugs, ${1 * amt} Sp. Wood`,
        canCraft: (amt) => scarecrowBaseCount >= 1 * amt && ladybugCount >= 10 * amt && specialWoodCount >= 1 * amt,
        onCraft: (amt) => handleCraftLadybugScarecrow(amt),
        highlight: craftingGoal?.recipeId === 'ladybug_scarecrow'
      },
      {
        id: 'tier2_scarecrow',
        name: 'Tier 2 Scarecrow',
        description: 'Protects a wider radius of crops (up to 2 plots away).',
        minLevel: 6,
        image: ALL_ITEMS[9978]?.image || '/images/scarecrow/tier2.png',
        costFunc: (amt) => `${5 * amt} Scarecrows, ${1 * amt} Sp. Wood`,
        canCraft: (amt) => scarecrowBaseCount >= 5 * amt && specialWoodCount >= 1 * amt,
        onCraft: (amt) => handleCraftTier2(amt),
        highlight: craftingGoal?.recipeId === 'tier2_scarecrow'
      },
      {
        id: 'tier3_scarecrow',
        name: 'Tier 3 Scarecrow',
        description: 'Protects a massive radius of crops (up to 5 plots away).',
        minLevel: 8,
        image: ALL_ITEMS[9977]?.image || '/images/scarecrow/tier3.png',
        costFunc: (amt) => `${4 * amt} Tier-2 Scarecrows, ${10 * amt} Wood, ${2 * amt} Sp. Wood`,
        canCraft: (amt) => tier2ScarecrowCount >= 4 * amt && woodCount >= 10 * amt && specialWoodCount >= 2 * amt,
        onCraft: (amt) => handleCraftTier3(amt),
        highlight: craftingGoal?.recipeId === 'tier3_scarecrow'
      },
      {
        id: 'tier4_scarecrow',
        name: 'Max Tier Scarecrow',
        description: 'The ultimate scarecrow. Protects the entire farm!',
        minLevel: 10,
        image: ALL_ITEMS[9976]?.image || '/images/scarecrow/tier4.png',
        costFunc: (amt) => `${3 * amt} Tier-3 Scarecrows, ${5 * amt} Gold Ore, ${5 * amt} Sp. Wood`,
        canCraft: (amt) => tier3ScarecrowCount >= 3 * amt && (allItems.find(i => i.id === 9997)?.count || 0) >= 5 * amt && specialWoodCount >= 5 * amt,
        onCraft: (amt) => handleCraftTier4(amt),
        highlight: craftingGoal?.recipeId === 'tier4_scarecrow'
      },
      {
        id: 'tesla_tower',
        name: 'Tesla Tower',
        description: 'Grounds lightning strikes to protect your farm layout.',
        minLevel: 12,
        image: ALL_ITEMS[9975]?.image || '/images/items/tesla.png',
        costFunc: (amt) => `${10 * amt} Iron, ${5 * amt} Stone Pipes`,
        canCraft: (amt) => ironCount >= 10 * amt && stonePipeCount >= 5 * amt,
        onCraft: (amt) => handleCraftTesla(amt),
        highlight: craftingGoal?.recipeId === 'tesla_tower'
      },
      {
        id: 'yarn',
        name: 'Yarn',
        description: 'A throwable toy that drastically increases the cat\'s happiness.',
        minLevel: 2,
        image: ALL_ITEMS[9955]?.image || '/images/pets/yarn.png',
        costFunc: (amt) => `${2 * amt} Cotton, ${1 * amt} Rope`,
        canCraft: (amt) => cottonCount >= 2 * amt && ropeCount >= 1 * amt,
        onCraft: (amt) => handleCraftGeneric(9955, [[9971, 2], [9970, 1]], amt, 25),
        highlight: craftingGoal?.recipeId === 'yarn'
      },
      {
        id: 'egg_basket',
        name: 'Egg Basket',
        description: 'Used to safely collect and store eggs from your chickens.',
        minLevel: 5,
        image: ALL_ITEMS[9940]?.image || '/images/barn/basket.png',
        costFunc: (amt) => `${5 * amt} Sticks, ${5 * amt} Rope`,
        canCraft: (amt) => sticksCount >= 5 * amt && ropeCount >= 5 * amt,
        onCraft: (amt) => handleCraftGeneric(9940, [[9995, 5], [9970, 5]], amt, 25),
        highlight: craftingGoal?.recipeId === 'egg_basket'
      }
    ],
    buildings: [
      {
        id: 'coop',
        name: 'Chicken Coop',
        description: 'Houses up to 10 chickens that lay eggs daily.',
        minLevel: 1,
        image: '/images/barn/coop.png',
        costFunc: (amt) => `50 Wood, 30 Stone\n10 Iron, 500 Honey`,
        canCraft: (amt) => !hasCoop && woodCount >= 50 && stoneCount >= 30 && ironCount >= 10 && parseInt(localStorage.getItem('sandbox_honey')||'0', 10) >= 500,
        onCraft: (amt) => {
           if (hasCoop) return;
           const honey = parseInt(localStorage.getItem('sandbox_honey')||'0', 10);
           if (woodCount < 50 || stoneCount < 30 || ironCount < 10 || honey < 500) return;
           
           localStorage.setItem('sandbox_honey', (honey - 500).toString());
           window.dispatchEvent(new CustomEvent('sandboxHoneyChanged', { detail: (honey - 500).toString() }));

           const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
           sandboxLoot[9993] = Math.max(0, (sandboxLoot[9993] || 0) - 50);
           sandboxLoot[9994] = Math.max(0, (sandboxLoot[9994] || 0) - 30);
           sandboxLoot[9996] = Math.max(0, (sandboxLoot[9996] || 0) - 10);
           localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
           if (refetch) refetch();

           const fd = JSON.parse(localStorage.getItem('sandbox_animal_farm') || '{}');
           if (!fd.coop) fd.coop = { status: 'unbuilt', buildStartTime: 0, chickens: [] };
           fd.coop.status = 'building';
           fd.coop.buildStartTime = Date.now();
           localStorage.setItem('sandbox_animal_farm', JSON.stringify(fd));
           
           addCraftingXp(500);
           show("Started building Chicken Coop! Check Animal Farm.", "success");
        },
        highlight: craftingGoal?.recipeId === 'coop',
        used: hasCoop,
        hideAmount: true
      },
      {
        id: 'sheepcage',
        name: 'Sheep Cage',
        description: 'Houses up to 5 sheep that produce wool daily.',
        minLevel: 1,
        image: '/images/barn/sheepcage.png',
        costFunc: (amt) => `50 Wood, 30 Stone\n10 Iron, 500 Honey`,
        canCraft: (amt) => !hasSheepcage && woodCount >= 50 && stoneCount >= 30 && ironCount >= 10 && parseInt(localStorage.getItem('sandbox_honey')||'0', 10) >= 500,
        onCraft: (amt) => {
           if (hasSheepcage) return;
           const honey = parseInt(localStorage.getItem('sandbox_honey')||'0', 10);
           if (woodCount < 50 || stoneCount < 30 || ironCount < 10 || honey < 500) return;
           
           localStorage.setItem('sandbox_honey', (honey - 500).toString());
           window.dispatchEvent(new CustomEvent('sandboxHoneyChanged', { detail: (honey - 500).toString() }));

           const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
           sandboxLoot[9993] = Math.max(0, (sandboxLoot[9993] || 0) - 50);
           sandboxLoot[9994] = Math.max(0, (sandboxLoot[9994] || 0) - 30);
           sandboxLoot[9996] = Math.max(0, (sandboxLoot[9996] || 0) - 10);
           localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
           if (refetch) refetch();

           const fd = JSON.parse(localStorage.getItem('sandbox_animal_farm') || '{}');
           if (!fd.sheepcage) fd.sheepcage = { status: 'unbuilt', buildStartTime: 0, sheep: [] };
           fd.sheepcage.status = 'building';
           fd.sheepcage.buildStartTime = Date.now();
           localStorage.setItem('sandbox_animal_farm', JSON.stringify(fd));
           
           addCraftingXp(500);
           show("Started building Sheep Cage! Check Animal Farm.", "success");
        },
        highlight: craftingGoal?.recipeId === 'sheepcage',
        used: hasSheepcage,
        hideAmount: true
      },
      {
        id: 'cowbarn',
        name: 'Cow Barn',
        description: 'Houses up to 3 cows that produce milk daily.',
        minLevel: 1,
        image: '/images/barn/cowbarn.png',
        costFunc: (amt) => `50 Wood, 30 Stone\n10 Iron, 500 Honey`,
        canCraft: (amt) => !hasCowbarn && woodCount >= 50 && stoneCount >= 30 && ironCount >= 10 && parseInt(localStorage.getItem('sandbox_honey')||'0', 10) >= 500,
        onCraft: (amt) => {
           if (hasCowbarn) return;
           const honey = parseInt(localStorage.getItem('sandbox_honey')||'0', 10);
           if (woodCount < 50 || stoneCount < 30 || ironCount < 10 || honey < 500) return;
           
           localStorage.setItem('sandbox_honey', (honey - 500).toString());
           window.dispatchEvent(new CustomEvent('sandboxHoneyChanged', { detail: (honey - 500).toString() }));

           const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
           sandboxLoot[9993] = Math.max(0, (sandboxLoot[9993] || 0) - 50);
           sandboxLoot[9994] = Math.max(0, (sandboxLoot[9994] || 0) - 30);
           sandboxLoot[9996] = Math.max(0, (sandboxLoot[9996] || 0) - 10);
           localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
           if (refetch) refetch();

           const fd = JSON.parse(localStorage.getItem('sandbox_animal_farm') || '{}');
           if (!fd.cowbarn) fd.cowbarn = { status: 'unbuilt', buildStartTime: 0, cows: [] };
           fd.cowbarn.status = 'building';
           fd.cowbarn.buildStartTime = Date.now();
           localStorage.setItem('sandbox_animal_farm', JSON.stringify(fd));
           
           addCraftingXp(500);
           show("Started building Cow Barn! Check Animal Farm.", "success");
        },
        highlight: craftingGoal?.recipeId === 'cowbarn',
        used: hasCowbarn,
        hideAmount: true
      }
    ]
  };

  return (
    <>
    {tutorialStep === 26 && (
      <div style={{ position: 'fixed', right: '20px', bottom: '20px', zIndex: 100002 }}>
        <div style={{ position: 'relative', width: '490px' }}>
          <img src="/images/tutorial/tutmessagep1.png" alt="Tutorial" style={{ width: '490px', objectFit: 'contain' }} />
        </div>
      </div>
    )}
    <BaseDialog onClose={onClose} title="CRAFTING" header="/images/dialog/modal-header-inventory.png" headerOffset={10} className="custom-modal-background">
      <div style={{ padding: '20px', color: '#fff', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', gap: '20px', width: '490px', maxWidth: '90vw' }}>
        <h2 style={{ color: '#00ff41', margin: '0 0 10px 0', textAlign: 'center' }}>Crafting Workbench</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #5a402a', paddingBottom: '10px' }}>
          <h2 style={{ color: '#00ff41', margin: '0' }}>Crafting Workbench</h2>
          <div style={{ backgroundColor: 'rgba(0,0,0,0.5)', padding: '5px 10px', borderRadius: '8px', border: '1px solid #ffea00', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div>
              <span style={{ color: '#ccc', fontSize: '12px' }}>Crafting Level: </span>
              <span style={{ color: '#ffea00', fontWeight: 'bold', fontSize: '16px' }}>{craftingLevel}</span>
            </div>
            <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '3px', marginTop: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${craftingProgress}%`, height: '100%', backgroundColor: '#ffea00', transition: 'width 0.3s' }} />
            </div>
          </div>
        </div>
        
        {craftingGoal && craftingGoal.message && (
          <div style={{ backgroundColor: 'rgba(255, 234, 0, 0.2)', border: '1px solid #ffea00', padding: '10px', borderRadius: '8px', color: '#ffea00', textAlign: 'center', marginBottom: '10px', fontSize: '14px' }}>
            {craftingGoal.message}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
          <button 
            onClick={() => setActiveTab('tools')} 
            style={{ 
              padding: '10px 20px', 
              backgroundColor: activeTab === 'tools' ? 'rgba(0, 255, 65, 0.2)' : 'rgba(0, 0, 0, 0.5)', 
              color: activeTab === 'tools' ? '#00ff41' : '#ccc', 
              border: `2px solid ${activeTab === 'tools' ? '#00ff41' : '#5a402a'}`, 
              borderRadius: '8px', 
              cursor: 'pointer', 
              fontFamily: 'monospace', 
              fontWeight: 'bold',
              fontSize: '16px',
              position: 'relative'
            }}
          >
            Tools
            {(highlightAxe || highlightPickaxe) && activeTab !== 'tools' && (
              <div style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', animation: 'bounce 1s infinite' }}>
                <span style={{ fontSize: '24px', color: '#00ff41', filter: 'drop-shadow(0px 2px 2px black)' }}>⬇️</span>
              </div>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('items')} 
            style={{ 
              padding: '10px 20px', 
              backgroundColor: activeTab === 'items' ? 'rgba(0, 191, 255, 0.2)' : 'rgba(0, 0, 0, 0.5)', 
              color: activeTab === 'items' ? '#00bfff' : '#ccc', 
              border: `2px solid ${activeTab === 'items' ? '#00bfff' : '#5a402a'}`, 
              borderRadius: '8px', 
              cursor: 'pointer', 
              fontFamily: 'monospace', 
              fontWeight: 'bold',
              fontSize: '16px',
              position: 'relative'
            }}
          >
            Items
            {highlightSticks && activeTab !== 'items' && (
              <div style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', animation: 'bounce 1s infinite' }}>
                <span style={{ fontSize: '24px', color: '#00ff41', filter: 'drop-shadow(0px 2px 2px black)' }}>⬇️</span>
              </div>
            )}
          </button>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
              onClick={() => setActiveTab('buildings')}
              style={{
                padding: '10px 20px',
                backgroundColor: activeTab === 'buildings' ? 'rgba(255, 165, 0, 0.2)' : 'rgba(0, 0, 0, 0.5)',
                color: activeTab === 'buildings' ? '#ffa500' : tutorialStep < 32 ? '#555' : '#ccc',
                border: `2px solid ${activeTab === 'buildings' ? '#ffa500' : '#5a402a'}`,
                borderRadius: '8px',
                cursor: tutorialStep < 32 ? 'not-allowed' : 'pointer',
                fontFamily: 'monospace',
                fontWeight: 'bold',
                fontSize: '16px',
                pointerEvents: tutorialStep < 32 ? 'none' : 'auto',
                opacity: tutorialStep < 32 ? 0.5 : 1
              }}
            >
              Buildings
            </button>
            {tutorialStep < 32 && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', pointerEvents: 'all', cursor: 'not-allowed' }}>
                <span style={{ fontSize: '18px', filter: 'drop-shadow(0px 1px 2px black)' }}>🔒</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '15px', 
          overflowY: 'auto', 
          maxHeight: '400px',
          padding: '5px',
          paddingRight: '10px'
        }}>
          {recipes[activeTab].map(recipe => {
            const amt = craftAmounts[recipe.id] || 1;
            const isLocked = craftingLevel < recipe.minLevel;
            
            if (isLocked) return null;
            
            return (
              <div key={recipe.id} style={{
                backgroundColor: recipe.highlight ? 'rgba(0,255,65,0.2)' : 'rgba(0,0,0,0.5)',
                border: `2px solid ${recipe.highlight ? '#00ff41' : '#5a402a'}`,
                borderRadius: '8px',
                padding: '15px 10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '10px',
                position: 'relative',
                opacity: recipe.used ? 0.7 : 1
              }}>
                <div title={recipe.description} onClick={() => show(recipe.description, "info")} style={{ position: 'absolute', top: '5px', right: '5px', width: '20px', height: '20px', backgroundColor: 'rgba(0,191,255,0.2)', border: '1px solid #00bfff', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#00bfff', fontSize: '12px', fontWeight: 'bold', cursor: 'help' }}>i</div>
                {recipe.used && (
                   <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%) rotate(-15deg)', backgroundColor: 'rgba(255, 68, 68, 0.9)', color: 'white', padding: '5px 15px', borderRadius: '4px', fontWeight: 'bold', fontSize: '24px', letterSpacing: '2px', border: '2px solid white', zIndex: 10, pointerEvents: 'none' }}>USED</div>
                )}
                {recipe.tutorialLocked && (
                   <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, pointerEvents: 'all' }}>
                     <span style={{ color: '#aaa', fontFamily: 'monospace', fontSize: '13px', fontWeight: 'bold', letterSpacing: '1px' }}>CRAFTED</span>
                   </div>
                )}
                {recipe.highlight && (
                   <div style={{ position: 'absolute', top: '-30px', left: '50%', transform: 'translateX(-50%)', animation: 'bounce 1s infinite' }}>
                     <span style={{ fontSize: '30px', color: '#00ff41', filter: 'drop-shadow(0px 2px 2px black)' }}>⬇️</span>
                   </div>
                )}
                <div style={{ height: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <img src={recipe.image} alt={recipe.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', filter: recipe.imageFilter || 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }} />
                </div>
                <div style={{ fontSize: '14px', color: '#ffea00', fontWeight: 'bold', minHeight: '34px', display: 'flex', alignItems: 'center' }}>{recipe.name}</div>
                
                <div style={{ fontSize: '11px', color: '#aaa', minHeight: '30px', display: 'flex', alignItems: 'center' }}>
                  {recipe.costFunc(amt)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: 'auto', opacity: recipe.used ? 0.5 : 1, pointerEvents: recipe.used ? 'none' : 'auto' }}>
                  {!recipe.hideAmount && (
                    <input 
                      type="number" 
                      min="1" 
                      max="99" 
                      value={amt} 
                      onChange={(e) => setCraftAmounts({...craftAmounts, [recipe.id]: Math.max(1, parseInt(e.target.value) || 1)})}
                      style={{ width: '40px', backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid #5a402a', borderRadius: '4px', textAlign: 'center', fontFamily: 'monospace' }}
                    />
                  )}
                  <BaseButton small label={recipe.used ? "Built" : "Craft"} onClick={() => recipe.onCraft(amt)} disabled={!recipe.canCraft(amt) || recipe.used || recipe.tutorialLocked} />
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-around', backgroundColor: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '8px', border: '1px solid #5a402a', fontSize: '12px', color: '#ccc', flexWrap: 'wrap', gap: '10px' }}>
          <span>Wood: {woodCount}</span>
          <span>Sp. Wood: {specialWoodCount}</span>
          <span>Stone: {stoneCount}</span>
          <span>Sticks: {sticksCount}</span>
          <span>Leaves: {leavesCount}</span>
          <span>Rope: {ropeCount}</span>
          <span>Iron: {ironCount}</span>
          <span>Pipes: {stonePipeCount}</span>
          <span>Planks: {plankCount}</span>
        </div>
      </div>
    </BaseDialog>
    </>
  );
};

const ProtectorSpot = ({ spotId, pos, offsetX, offsetY, placingType, placedItem, onPlace, onRemove }) => {
  const [frame, setFrame] = useState(1);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showDebug, setShowDebug] = useState(() => localStorage.getItem('show_debug_labels') !== 'false');

  useEffect(() => {
    const handler = (e) => setShowDebug(e.detail);
    window.addEventListener('toggleDebugLabels', handler);
    return () => window.removeEventListener('toggleDebugLabels', handler);
  }, []);
  
  useEffect(() => {
    if (placedItem?.type !== 'scarecrow') return;
    // Animate base scarecrows
    if (placedItem?.type !== 'tier1' && placedItem?.type !== 'tier2' && placedItem?.type !== 'tier3' && placedItem?.type !== 'tier4' && placedItem?.type !== 'ladybug_scarecrow') return;
    
    const timer = setInterval(() => {
      setFrame(f => (f % 5) + 1);
    }, 200); // 5 frames, 200ms each
    return () => clearInterval(timer);
  }, [placedItem?.type]);

  useEffect(() => {
    if (!placedItem || !placedItem.expiryTime) return;
    

    const tick = () => {
      const now = Math.floor(Date.now() / 1000);
      const exp = typeof placedItem.expiryTime === 'number' ? placedItem.expiryTime : now - 1; 
      const remaining = exp - now;
      
      if (remaining <= 0) {
        setTimeLeft(0);
        if (placedItem.onExpire) placedItem.onExpire(spotId, placedItem.type);
      } else {
        setTimeLeft(remaining);
      }
    };
    
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [placedItem, spotId]);

  const isPlacing = !!placingType;
  const isPlaced = !!placedItem;

  if (!isPlacing && !isPlaced && !showDebug) return null;

  const leftVal = pos.left !== undefined ? (typeof pos.left === 'number' ? `${pos.left + offsetX}px` : `calc(${pos.left} + ${offsetX}px)`) : '0px';
  const topVal = pos.top !== undefined ? (typeof pos.top === 'number' ? `${pos.top + offsetY}px` : `calc(${pos.top} + ${offsetY}px)`) : '0px';

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    const pad = (n) => n.toString().padStart(2, '0');
    if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
    if (m > 0) return `${m}:${pad(s)}`;
    return `${s}s`;
  };

  let borderColor = 'white';
  let bgColor = 'rgba(255,255,255,0.4)';
  let textColor = '#00ff41';
  let imageSrc = null;
  let imageStyle = { width: '120%', height: '120%', objectFit: 'contain', pointerEvents: 'none', filter: 'drop-shadow(0px 0px 5px rgba(0,0,0,0.8))' };
  let topOffset = '-40px';

  if (isPlaced) {
    if (placedItem.type.includes('tier') || placedItem.type === 'ladybug_scarecrow') {
      textColor = '#00ff41';
      imageSrc = `/images/scarecrow/scarecrow${frame}.png`;
      imageStyle.width = '200%';
      imageStyle.height = '200%';
      topOffset = '-25px';
      
      if (placedItem.type === 'tier1') {
        imageSrc = `/images/scarecrow/scarecrow${frame}.png`;
      } else if (placedItem.type === 'tier2') {
        imageSrc = `/images/scarecrow/tier2.png`;
      } else if (placedItem.type === 'tier3') {
        imageSrc = `/images/scarecrow/tier3.png`;
      } else if (placedItem.type === 'tier4') {
        imageSrc = `/images/scarecrow/tier4.png`;
      } else if (placedItem.type === 'ladybug_scarecrow') {
        imageSrc = `/images/scarecrow/ladybug_scarecrow.png`;
      }
    } else if (placedItem.type === 'tesla') {
      textColor = '#00ffff';
      imageSrc = '/images/items/tesla.png';
      imageStyle.width = '150%';
      imageStyle.height = '150%';
      topOffset = '-25px';
    } else if (placedItem.type === 'ladybug') {
      textColor = '#ff4444';
      imageSrc = '/images/items/ladybug.png';
      imageStyle.width = '100%';
      imageStyle.height = '100%';
      topOffset = '-25px';
    } else if (placedItem.type === 'sprinkler') {
      textColor = '#00bfff';
      imageSrc = '/images/items/watersprinkler.png';
    } else if (placedItem.type === 'umbrella') {
      textColor = '#ff00ff';
      imageSrc = '/images/items/umbrella.png';
    }
  } else if (isPlacing) {
    if (placingType.includes('tier') || placingType === 'ladybug_scarecrow') {
      borderColor = 'white'; bgColor = 'rgba(255,255,255,0.4)';
    } else if (placingType === 'tesla') {
      borderColor = '#00ffff'; bgColor = 'rgba(0,255,255,0.3)';
    } else if (placingType === 'ladybug') {
      borderColor = '#ff4444'; bgColor = 'rgba(255,68,68,0.3)';
    } else if (placingType === 'sprinkler') {
      borderColor = '#00bfff'; bgColor = 'rgba(0,191,255,0.3)';
    } else if (placingType === 'umbrella') {
      borderColor = '#ff00ff'; bgColor = 'rgba(255,0,255,0.3)';
    }
  }

  return (
    <div
      onPointerDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (isPlacing && !isPlaced) {
          onPlace(spotId, placingType);
        } else if (isPlaced && onRemove) {
          onRemove(spotId, placedItem.type);
        }
      }}
      style={{
        position: 'absolute',
        left: leftVal,
        top: topVal,
        width: '50px',
        height: '50px',
        zIndex: 9999, 
        cursor: 'pointer',
        border: isPlacing && !isPlaced ? `3px dashed ${borderColor}` : 'none',
        backgroundColor: isPlacing && !isPlaced ? bgColor : 'transparent',
        borderRadius: '10px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: isPlacing || isPlaced ? 'auto' : 'none',
      }}
    >
      {showDebug && (isPlacing || isPlaced) && (
        <div style={{
          position: 'absolute',
          top: '-25px',
          left: '0px',
          backgroundColor: 'rgba(0,0,0,0.8)',
          color: borderColor,
          border: `1px solid ${borderColor}`,
          padding: '2px 6px',
          fontSize: '14px',
          fontWeight: 'bold',
          zIndex: 10001,
          pointerEvents: 'none'
        }}>
          Spot: {spotId}
        </div>
      )}
      {isPlaced && (
        <>
          <div style={{
            position: 'absolute',
            top: topOffset,
            color: textColor,
            fontWeight: 'bold',
            fontSize: '14px',
            textShadow: '1px 1px 2px black, -1px -1px 2px black, 1px -1px 2px black, -1px 1px 2px black',
            whiteSpace: 'nowrap',
            zIndex: 10000
          }}>
            {formatTime(timeLeft)}
          </div>
          {imageSrc && (
            <img 
              src={imageSrc} 
              alt={placedItem.type} 
              onError={(e) => { 
                if (placedItem.type === 'scarecrow') e.target.src = `/images/scarecrow/scarecrow${frame}.jpg`; 
                if (placedItem.type === 'tier1') e.target.src = `/images/scarecrow/scarecrow${frame}.jpg`; 
                else e.target.style.display = 'none'; 
              }}
              style={imageStyle}
            />
          )}
        </>
      )}
    </div>
  );
};

export const RegionalQuestBoard = ({ onClose, title, questType, tutorialStep, refetch, completedQuests, setCompletedQuests }) => {
  const { show } = useNotification();
  const [animState, setAnimState] = useState(0); 
  const [activeQuest, setActiveQuest] = useState(null);

  const allQuests = getQuestData();
  const availableQuests = allQuests.filter(q => q.type === questType && q.unlockCondition(tutorialStep, completedQuests));
  const activeQuestsList = availableQuests.filter(q => !completedQuests.includes(q.id));

  const checkRequirements = (reqs) => {
    if (!reqs || reqs.length === 0) return true;
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    const sandboxProduce = JSON.parse(localStorage.getItem('sandbox_produce') || '{}');
    
    for (const req of reqs) {
      if (req.fn) {
         const val = req.fn(sandboxLoot, sandboxProduce);
         if (typeof val === 'number') {
           if (val < req.count) return false;
         } else {
           if (!val) return false;
         }
         continue;
      }
      if (req.id === 'gold') {
        const gold = parseInt(localStorage.getItem('sandbox_gold') || '0', 10);
        if (gold < req.count) return false;
        continue;
      }
      let count = 0;
      const ids = Array.isArray(req.id) ? req.id : [req.id];
      for (const id of ids) {
        if (Array.isArray(sandboxProduce[id])) count += sandboxProduce[id].length;
        else count += (Number(sandboxProduce[id]) || 0) + (Number(sandboxLoot[id]) || 0);
      }
      if (count < req.count) return false;
    }
    return true;
  };

  const getRequirementCounts = (reqs) => {
    if (!reqs || reqs.length === 0) return [];
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    const sandboxProduce = JSON.parse(localStorage.getItem('sandbox_produce') || '{}');
    
    return reqs.map(req => {
      if (req.fn) {
         const val = req.fn(sandboxLoot, sandboxProduce);
         if (typeof val === 'number') {
           return { ...req, current: val };
         }
         return { ...req, current: val ? 1 : 0, count: req.count || 1 };
      }
      if (req.id === 'gold') {
        const gold = parseInt(localStorage.getItem('sandbox_gold') || '0', 10);
        return { ...req, current: gold };
      }
      let count = 0;
      const ids = Array.isArray(req.id) ? req.id : [req.id];
      for (const id of ids) {
        if (Array.isArray(sandboxProduce[id])) count += sandboxProduce[id].length;
        else count += (Number(sandboxProduce[id]) || 0) + (Number(sandboxLoot[id]) || 0);
      }
      return { ...req, current: count };
    });
  };

  const handleCompleteQuest = () => {
    const quest = activeQuest;
    if (!quest) return;

    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    const sandboxProduce = JSON.parse(localStorage.getItem('sandbox_produce') || '{}');
    
    for (const req of quest.reqs) {
      if (req.fn) continue;
      if (req.id === 'gold') {
        const currentGold = parseInt(localStorage.getItem('sandbox_gold') || '0', 10);
        const newGold = Math.max(0, currentGold - req.count);
        localStorage.setItem('sandbox_gold', newGold.toString());
        window.dispatchEvent(new CustomEvent('sandboxGoldChanged', { detail: newGold.toString() }));
        continue;
      }
      let remaining = req.count;
      const ids = Array.isArray(req.id) ? req.id : [req.id];
      
      for (const id of ids) {
        if (remaining <= 0) break;
        if (sandboxProduce[id] !== undefined) {
          if (Array.isArray(sandboxProduce[id])) {
            while (remaining > 0 && sandboxProduce[id].length > 0) {
              sandboxProduce[id].pop();
              remaining--;
            }
          } else {
            const deduct = Math.min(Number(sandboxProduce[id]) || 0, remaining);
            sandboxProduce[id] = (Number(sandboxProduce[id]) || 0) - deduct;
            remaining -= deduct;
          }
        }
        if (remaining > 0 && sandboxLoot[id]) {
          const deduct = Math.min(Number(sandboxLoot[id]), remaining);
          sandboxLoot[id] -= deduct;
          remaining -= deduct;
        }
      }
    }

    for (const reward of quest.rewards) {
      if (reward.id === 'honey') {
        const currentHoney = parseInt(localStorage.getItem('sandbox_honey') || '0', 10);
        const newHoney = currentHoney + reward.count;
        localStorage.setItem('sandbox_honey', newHoney.toString());
        window.dispatchEvent(new CustomEvent('sandboxHoneyChanged', { detail: newHoney.toString() }));
      } else if (reward.id === 'gold') {
        const currentGold = parseInt(localStorage.getItem('sandbox_gold') || '0', 10);
        const newGold = currentGold + reward.count;
        localStorage.setItem('sandbox_gold', newGold.toString());
        window.dispatchEvent(new CustomEvent('sandboxGoldChanged', { detail: newGold.toString() }));
      } else {
        sandboxLoot[reward.id] = (sandboxLoot[reward.id] || 0) + reward.count;
      }
    }
    
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    localStorage.setItem('sandbox_produce', JSON.stringify(sandboxProduce));

    const nextCompleted = [...completedQuests, quest.id];
    setCompletedQuests(nextCompleted);
    localStorage.setItem('sandbox_completed_quests', JSON.stringify(nextCompleted));

    let xpSkill = "";
    let xpKey = "";
    if (quest.type === 'farming' || quest.type === 'main') {
        xpSkill = 'Farming';
        xpKey = 'sandbox_farming_xp';
    } else if (quest.type === 'fishing') {
        xpSkill = 'Fishing';
        xpKey = 'sandbox_fishing_xp';
    }
    
    if (xpSkill) {
        const currentXp = parseInt(localStorage.getItem(xpKey) || '0', 10);
        const oldLevel = Math.floor(Math.sqrt((currentXp || 0) / 150)) + 1;
        const newXp = currentXp + 500;
        localStorage.setItem(xpKey, newXp.toString());
        window.dispatchEvent(new CustomEvent('ls-update', { detail: { key: xpKey, value: newXp.toString() } }));
        const newLevel = Math.floor(Math.sqrt((newXp || 0) / 150)) + 1;
        if (newLevel > oldLevel) {
            window.dispatchEvent(new CustomEvent('levelUp', { detail: { skill: xpSkill, level: newLevel } }));
        }
        setTimeout(() => { window.dispatchEvent(new CustomEvent('showNotification', { detail: { msg: `+500 ${xpSkill} XP!`, type: "info" } })); }, 1000);
    }

    if (refetch) refetch();
    setAnimState(2); 
  };

  if (animState > 0 && activeQuest) {
    const isReadyToTurnIn = checkRequirements(activeQuest.reqs);
    const reqCounts = getRequirementCounts(activeQuest.reqs);

    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 100000, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {animState === 2 && (
          <div style={{ backgroundColor: '#2c221a', border: '4px solid #a67c52', borderRadius: '16px', padding: '30px', textAlign: 'center', color: '#fff', fontFamily: 'monospace', boxShadow: '0 10px 25px rgba(0,0,0,0.8)', minWidth: '350px', animation: 'popIn 0.3s ease-out' }}>
            <style>{`@keyframes popIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
            <h2 style={{ color: '#ffea00', margin: '0 0 20px 0', fontSize: '24px' }}>Rewards Claimed!</h2>
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '30px', marginBottom: '30px' }}>
              {activeQuest.rewards.map((rew, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '60px', height: '60px', backgroundColor: 'rgba(0,0,0,0.5)', border: '2px solid #5a402a', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                    {ALL_ITEMS[rew.id]?.pos >= 0 ? (
                      <div style={{
                        width: '60px',
                        height: '60px',
                        backgroundImage: `url(/images/crops/seeds.webp)`,
                        backgroundSize: `${(159 * 60 / 207.7647).toFixed(1)}px auto`,
                        backgroundPositionX: 'center',
                        backgroundPositionY: `-${(ALL_ITEMS[rew.id].pos * 60).toFixed(1)}px`,
                        backgroundRepeat: 'no-repeat',
                      }} />
                    ) : (
                      <img src={ALL_ITEMS[rew.id]?.image || rew.image} alt={rew.name} style={{ width: '80%', height: '80%', objectFit: 'contain' }} onError={(e) => { e.target.onerror = null; }} />
                    )}
                  </div>
                  <span style={{ fontWeight: 'bold', color: '#00ff41', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>{rew.count} {rew.name}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
              <BaseButton label="Done" onClick={() => {
                if (activeQuest?.id === 'q1_pabee_intro') {
                  window.dispatchEvent(new CustomEvent('pabeePackOpen'));
                }
                setAnimState(0);
              }} />
            </div>
          </div>
        )}
        {animState === 1 && (
          <div style={{ backgroundColor: '#fff8dc', padding: '40px', borderRadius: '4px', maxWidth: '500px', width: '90%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', color: '#333', fontFamily: 'serif', boxShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>
            <h2 style={{ margin: '0 0 20px 0', borderBottom: '2px dashed #8c6b4a', paddingBottom: '10px', fontFamily: 'monospace', color: '#5a402a' }}>{activeQuest.subject}</h2>
            <div style={{ overflowY: 'auto', flex: 1, lineHeight: '1.8', fontSize: '18px', paddingRight: '10px', marginBottom: '20px' }}>
              {activeQuest.body.map((para, i) => (
                <p key={i} style={{ color: '#5a402a' }}>{para}</p>
              ))}
            </div>

            {activeQuest.reqs.length > 0 && (
              <div style={{ backgroundColor: 'rgba(90, 64, 42, 0.1)', border: '1px solid #8c6b4a', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontFamily: 'monospace' }}>Required:</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                  {reqCounts.map((req, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'monospace', fontSize: '14px' }}>
                      {req.image && <img src={req.image} style={{ width: '24px', height: '24px', objectFit: 'contain' }} alt={req.name} onError={(e) => { e.target.onerror = null; e.target.src = '/images/items/seeds.png'; }} />}
                      <span style={{ color: req.current >= req.count ? '#006400' : '#8b0000', fontWeight: 'bold' }}>
                        {req.name}: {req.current}/{req.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
              <BaseButton label={isReadyToTurnIn ? "Complete" : "Incomplete"} disabled={!isReadyToTurnIn} onClick={handleCompleteQuest} />
              <BaseButton label="Back" onClick={() => setAnimState(0)} />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <BaseDialog onClose={onClose} title={title} header="/images/dialog/modal-header-inventory.png" headerOffset={10} className="custom-modal-background">
      <div style={{ padding: '20px', color: '#fff', fontFamily: 'monospace', minWidth: '400px', maxHeight: '60vh', overflowY: 'auto' }}>
        <h2 style={{ color: '#ffea00', margin: '0 0 20px 0', textAlign: 'center' }}>{title}</h2>
        {activeQuestsList.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activeQuestsList.map(quest => (
              <div 
                key={quest.id}
                onClick={() => { setActiveQuest(quest); setAnimState(1); }} 
                style={{ 
                  backgroundColor: 'rgba(90, 64, 42, 0.4)', 
                  border: '2px solid #a67c52', 
                  padding: '15px', 
                  borderRadius: '4px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '15px', 
                  cursor: 'pointer', 
                  transition: 'all 0.2s',
                  boxShadow: '2px 2px 5px rgba(0,0,0,0.5)'
                }} 
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.backgroundColor = 'rgba(90, 64, 42, 0.6)'; }} 
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = 'rgba(90, 64, 42, 0.4)'; }}
              >
                <div style={{ fontSize: '30px' }}>📝</div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#ffea00', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>{quest.subject}</span>
                  <span style={{ fontSize: '12px', color: '#ccc', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>{quest.sender}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#aaa', fontStyle: 'italic', padding: '20px' }}>
            No missions available right now.
          </div>
        )}
      </div>
    </BaseDialog>
  );
};

export const MailboxDialog = ({ onClose, tutorialStep, refetch, onTutorialAdvance, completedQuests, setCompletedQuests, readQuests, setReadQuests }) => {
  const [animState, setAnimState] = useState(0); // 0: list, 1: opening, 2: reading, 3: claiming
  const [activeQuest, setActiveQuest] = useState(null);
  const [discardedQuests, setDiscardedQuests] = useState(() => JSON.parse(localStorage.getItem('sandbox_discarded_quests') || '[]'));
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const confirmDiscard = () => {
    const nextDiscarded = [...discardedQuests, activeQuest.id];
    setDiscardedQuests(nextDiscarded);
    localStorage.setItem('sandbox_discarded_quests', JSON.stringify(nextDiscarded));
    setShowDiscardConfirm(false);
    setAnimState(0);
  };

  const allQuests = getQuestData();
  const availableQuests = allQuests.filter(q => (!q.type || q.type === 'main') && q.unlockCondition(tutorialStep, completedQuests));
  const activeQuestsList = availableQuests.filter(q => !discardedQuests.includes(q.id));

  const checkRequirements = (reqs) => {
    if (!reqs || reqs.length === 0) return true;
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    const sandboxProduce = JSON.parse(localStorage.getItem('sandbox_produce') || '{}');
    
    for (const req of reqs) {
      if (req.fn) {
         const val = req.fn(sandboxLoot, sandboxProduce);
         if (typeof val === 'number') {
           if (val < req.count) return false;
         } else {
           if (!val) return false;
         }
         continue;
      }
      if (req.id === 'gold') {
        const gold = parseInt(localStorage.getItem('sandbox_gold') || '0', 10);
        if (gold < req.count) return false;
        continue;
      }
      let count = 0;
      const ids = Array.isArray(req.id) ? req.id : [req.id];
      for (const id of ids) {
        if (Array.isArray(sandboxProduce[id])) count += sandboxProduce[id].length;
        else count += (Number(sandboxProduce[id]) || 0) + (Number(sandboxLoot[id]) || 0);
      }
      if (count < req.count) return false;
    }
    return true;
  };

  const getRequirementCounts = (reqs) => {
    if (!reqs || reqs.length === 0) return [];
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    const sandboxProduce = JSON.parse(localStorage.getItem('sandbox_produce') || '{}');
    
    return reqs.map(req => {
      if (req.fn) {
         const val = req.fn(sandboxLoot, sandboxProduce);
         if (typeof val === 'number') {
           return { ...req, current: val };
         }
         return { ...req, current: val ? 1 : 0, count: req.count || 1 };
      }
      if (req.id === 'gold') {
        const gold = parseInt(localStorage.getItem('sandbox_gold') || '0', 10);
        return { ...req, current: gold };
      }
      let count = 0;
      const ids = Array.isArray(req.id) ? req.id : [req.id];
      for (const id of ids) {
        if (Array.isArray(sandboxProduce[id])) count += sandboxProduce[id].length;
        else count += (Number(sandboxProduce[id]) || 0) + (Number(sandboxLoot[id]) || 0);
      }
      return { ...req, current: count };
    });
  };

  const handleCompleteQuest = () => {
    const quest = activeQuest;
    if (!quest) return;

    // Deduct requirements
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    const sandboxProduce = JSON.parse(localStorage.getItem('sandbox_produce') || '{}');
    
    for (const req of quest.reqs) {
      if (req.fn) continue;
      if (req.id === 'gold') {
        const currentGold = parseInt(localStorage.getItem('sandbox_gold') || '0', 10);
        const newGold = Math.max(0, currentGold - req.count);
        localStorage.setItem('sandbox_gold', newGold.toString());
        window.dispatchEvent(new CustomEvent('sandboxGoldChanged', { detail: newGold.toString() }));
        continue;
      }
      let remaining = req.count;
      const ids = Array.isArray(req.id) ? req.id : [req.id];
      
      for (const id of ids) {
        if (remaining <= 0) break;
        if (sandboxProduce[id] !== undefined) {
          if (Array.isArray(sandboxProduce[id])) {
            while (remaining > 0 && sandboxProduce[id].length > 0) {
              sandboxProduce[id].pop();
              remaining--;
            }
          } else {
            const deduct = Math.min(Number(sandboxProduce[id]) || 0, remaining);
            sandboxProduce[id] = (Number(sandboxProduce[id]) || 0) - deduct;
            remaining -= deduct;
          }
        }
        if (remaining > 0 && sandboxLoot[id]) {
          const deduct = Math.min(Number(sandboxLoot[id]), remaining);
          sandboxLoot[id] -= deduct;
          remaining -= deduct;
        }
      }
    }

    // Give rewards
    for (const reward of quest.rewards) {
      if (reward.id === 'honey') {
        const currentHoney = parseInt(localStorage.getItem('sandbox_honey') || '0', 10);
        const newHoney = currentHoney + reward.count;
        localStorage.setItem('sandbox_honey', newHoney.toString());
        window.dispatchEvent(new CustomEvent('sandboxHoneyChanged', { detail: newHoney.toString() }));
      } else if (reward.id === 'gold') {
        const currentGold = parseInt(localStorage.getItem('sandbox_gold') || '0', 10);
        const newGold = currentGold + reward.count;
        localStorage.setItem('sandbox_gold', newGold.toString());
        window.dispatchEvent(new CustomEvent('sandboxGoldChanged', { detail: newGold.toString() }));
      } else {
        sandboxLoot[reward.id] = (sandboxLoot[reward.id] || 0) + reward.count;
      }
    }
    
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    localStorage.setItem('sandbox_produce', JSON.stringify(sandboxProduce));

    const nextCompleted = [...completedQuests, quest.id];
    setCompletedQuests(nextCompleted);
    localStorage.setItem('sandbox_completed_quests', JSON.stringify(nextCompleted));

    if (quest.id === "q2_rebuild_tavern") {
      localStorage.setItem('quest_q2_rebuild_tavern_completed', 'true');
      window.dispatchEvent(new CustomEvent('tavernUnlocked'));
    }
    if (quest.id === "q2_unlock_dock") {
      localStorage.setItem('sandbox_dock_unlocked', 'true');
      localStorage.setItem('sandbox_dock_repaired', 'true');
      window.dispatchEvent(new CustomEvent('dockRepaired'));
    }

    let xpSkill = "";
    let xpKey = "";
    if (quest.type === 'farming' || quest.type === 'main') {
        xpSkill = 'Farming';
        xpKey = 'sandbox_farming_xp';
    } else if (quest.type === 'fishing') {
        xpSkill = 'Fishing';
        xpKey = 'sandbox_fishing_xp';
    }

    if (xpSkill && quest.id !== 'q1_pabee_intro') {
        const currentXp = parseInt(localStorage.getItem(xpKey) || '0', 10);
        const oldLevel = Math.floor(Math.sqrt((currentXp || 0) / 150)) + 1;
        const newXp = currentXp + 500;
        localStorage.setItem(xpKey, newXp.toString());
        window.dispatchEvent(new CustomEvent('ls-update', { detail: { key: xpKey, value: newXp.toString() } }));
        const newLevel = Math.floor(Math.sqrt((newXp || 0) / 150)) + 1;
        if (newLevel > oldLevel) {
            window.dispatchEvent(new CustomEvent('levelUp', { detail: { skill: xpSkill, level: newLevel } }));
        }
        setTimeout(() => { window.dispatchEvent(new CustomEvent('showNotification', { detail: { msg: `+500 ${xpSkill} XP!`, type: "info" } })); }, 1000);
    }

    if (refetch) refetch();
    setAnimState(3); // Show rewards
  };

  const handleOpenLetter = (quest) => {
    setActiveQuest(quest);
    if (!readQuests.includes(quest.id)) {
      const nextRead = [...readQuests, quest.id];
      setReadQuests(nextRead);
      localStorage.setItem('sandbox_read_quests', JSON.stringify(nextRead));
    }
    setAnimState(1);
    setTimeout(() => setAnimState(2), 2000);
  };

  if (animState > 0 && activeQuest) {
    const isReadyToTurnIn = checkRequirements(activeQuest.reqs);
    const reqCounts = getRequirementCounts(activeQuest.reqs);

    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 100000, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {animState === 3 && (
          <div style={{ backgroundColor: '#2c221a', border: '4px solid #a67c52', borderRadius: '16px', padding: '30px', textAlign: 'center', color: '#fff', fontFamily: 'monospace', boxShadow: '0 10px 25px rgba(0,0,0,0.8)', minWidth: '350px', animation: 'popIn 0.3s ease-out' }}>
            <style>{`@keyframes popIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
            <h2 style={{ color: '#ffea00', margin: '0 0 20px 0', fontSize: '24px' }}>Rewards Claimed!</h2>
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '30px', marginBottom: '30px' }}>
              {activeQuest.rewards.map((rew, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '60px', height: '60px', backgroundColor: 'rgba(0,0,0,0.5)', border: '2px solid #5a402a', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                    {ALL_ITEMS[rew.id]?.pos >= 0 ? (
                      <div style={{
                        width: '60px',
                        height: '60px',
                        backgroundImage: `url(/images/crops/seeds.webp)`,
                        backgroundSize: `${(159 * 60 / 207.7647).toFixed(1)}px auto`,
                        backgroundPositionX: 'center',
                        backgroundPositionY: `-${(ALL_ITEMS[rew.id].pos * 60).toFixed(1)}px`,
                        backgroundRepeat: 'no-repeat',
                      }} />
                    ) : (
                      <img src={ALL_ITEMS[rew.id]?.image || rew.image} alt={rew.name} style={{ width: '80%', height: '80%', objectFit: 'contain' }} onError={(e) => { e.target.onerror = null; }} />
                    )}
                  </div>
                  <span style={{ fontWeight: 'bold', color: '#00ff41', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>{rew.count} {rew.name}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
              <BaseButton label="Done" onClick={() => {
                if (activeQuest.id === 'q1_pabee_intro') {
                  window.dispatchEvent(new CustomEvent('closeMailbox'));
                  onClose();
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('pabeePackOpen'));
                  }, 100);
                } else {
                  setAnimState(0);
                }
              }} />
            </div>
          </div>
        )}
        {animState === 1 && (
          <div style={{ fontSize: '150px', animation: 'envelopeOpen 2s forwards' }}>
            <style>{`
              @keyframes envelopeOpen {
                0% { transform: scale(0.1) translateY(500px); opacity: 0; }
                40% { transform: scale(1.2) translateY(0); opacity: 1; }
                60% { transform: scale(1.2) translateY(0) rotate(5deg); opacity: 1; }
                80% { transform: scale(1.5) translateY(-20px) rotate(-5deg); opacity: 1; }
                100% { transform: scale(2.5) translateY(-50px); opacity: 0; filter: blur(10px); }
              }
            `}</style>
            ✉️
          </div>
        )}
        {animState === 2 && (
          <div style={{ backgroundColor: '#f4e4bc', padding: '40px', borderRadius: '8px', maxWidth: '600px', width: '90%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', color: '#2c1e16', fontFamily: 'serif', boxShadow: '0 20px 50px rgba(0,0,0,0.8), inset 0 0 50px rgba(200,150,100,0.3)', animation: 'letterFadeIn 0.8s ease-out forwards', backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, rgba(0,0,0,0.05) 31px, rgba(0,0,0,0.05) 32px)', backgroundPositionY: '8px' }}>
            <style>{`@keyframes letterFadeIn { 0% { transform: scale(0.8) translateY(100px); opacity: 0; } 100% { transform: scale(1) translateY(0); opacity: 1; } }`}</style>
            <h2 style={{ margin: '0 0 20px 0', borderBottom: '2px solid #8c6b4a', paddingBottom: '10px', fontFamily: 'monospace', color: '#5a402a' }}>From: {activeQuest.sender}</h2>
            <div style={{ overflowY: 'auto', flex: 1, lineHeight: '2', fontSize: '20px', paddingRight: '15px', marginBottom: '20px' }}>
              {activeQuest.body.map((para, i) => (
                <p key={i} style={{ color: '#5a402a' }}>{para}</p>
              ))}
            </div>

            {activeQuest.reqs.length > 0 && !completedQuests.includes(activeQuest.id) && activeQuest.id !== 'q2_rebuild_tavern' && (
              <div style={{ backgroundColor: 'rgba(90, 64, 42, 0.1)', border: '1px solid #8c6b4a', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontFamily: 'monospace' }}>Required Items:</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                  {reqCounts.map((req, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'monospace', fontSize: '14px' }}>
                      <img src={req.image} style={{ width: '24px', height: '24px', objectFit: 'contain' }} alt={req.name} onError={(e) => { e.target.onerror = null; e.target.src = '/images/items/seeds.png'; }} />
                      <span style={{ color: req.current >= req.count ? '#006400' : '#8b0000', fontWeight: 'bold' }}>
                        {req.name}: {req.current}/{req.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeQuest.id === 'q2_rebuild_tavern' && !completedQuests.includes(activeQuest.id) && (
              <div style={{ backgroundColor: 'rgba(90, 64, 42, 0.15)', border: '1px solid #8c6b4a', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontFamily: 'monospace', color: '#8c6b4a', fontSize: '14px' }}>
                  Head to the <strong>Tavern</strong> to submit your materials and rebuild it.
                </p>
              </div>
            )}

            {!completedQuests.includes(activeQuest.id) && activeQuest.reqs.length === 0 && activeQuest.rewards.some(r => r.id === 'pabee_pack') && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <img
                  src="/images/cardback/commonback.png"
                  alt="Gift"
                  style={{ width: '90px', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.4)', animation: 'mapFloat 2s ease-in-out infinite' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
              {completedQuests.includes(activeQuest.id) ? (
                <>
                  <BaseButton label="Discard" onClick={() => setShowDiscardConfirm(true)} />
                  <BaseButton label="Fold Letter" onClick={() => setAnimState(0)} />
                </>
              ) : (
                <>
                  {activeQuest.id === 'q2_rebuild_tavern' ? (
                    <>
                      <BaseButton label="Discard" onClick={() => setShowDiscardConfirm(true)} />
                      <BaseButton label="Fold Letter" onClick={() => setAnimState(0)} />
                    </>
                  ) : activeQuest.reqs.length > 0 ? (
                    <BaseButton label={isReadyToTurnIn ? "Turn In & Claim" : "Not Enough Items"} disabled={!isReadyToTurnIn} onClick={handleCompleteQuest} />
                  ) : (
                    <BaseButton label="Claim Gifts" onClick={handleCompleteQuest} />
                  )}
                  {activeQuest.id !== 'q2_rebuild_tavern' && (
                    <BaseButton label="Fold Letter" onClick={() => setAnimState(0)} />
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Discard confirmation popup */}
        {showDiscardConfirm && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100001, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ backgroundColor: '#2a1a0e', border: '2px solid #8c6b4a', borderRadius: '12px', padding: '28px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', maxWidth: '340px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontFamily: 'monospace', color: '#e8d5b0', fontSize: '16px', lineHeight: 1.5 }}>
                Are you sure you want to discard this letter? This cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <BaseButton label="Yes, Discard" onClick={confirmDiscard} />
                <BaseButton label="Cancel" onClick={() => setShowDiscardConfirm(false)} />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 100000, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: '500px' }}>
        <img src="/images/mail/Mailboxx.png" alt="Mailbox" style={{ width: '100%', display: 'block', userSelect: 'none' }} draggable={false} />
        {/* Close button - mailboxclose image at top right */}
        <img src="/images/mail/mailboxclose.png" alt="Close" onClick={onClose} style={{ position: 'absolute', top: '11.2%', right: '-4.9%', width: '15%', cursor: 'pointer', zIndex: 2, userSelect: 'none', transition: 'transform 0.08s, filter 0.08s' }} draggable={false}
          onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.2)'; e.currentTarget.style.transform = 'scale(1.03)'; }}
          onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)'; e.currentTarget.style.transform = 'scale(1)'; }}
          onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.96)'; e.currentTarget.style.filter = 'brightness(0.85)'; }}
          onMouseUp={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.filter = 'brightness(1.2)'; }}
        />
        {/* Mail list content area */}
        <div style={{ position: 'absolute', top: '24%', left: '49%', transform: 'translateX(-50%)', width: '78%', bottom: '12%', overflowY: activeQuestsList.length > 5 ? 'auto' : 'visible', overflowX: 'visible', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          {activeQuestsList.length > 0 ? activeQuestsList.map(quest => {
            const isRead = readQuests.includes(quest.id);
            return (
              <div
                key={quest.id}
                onClick={() => handleOpenLetter(quest)}
                style={{ position: 'relative', cursor: 'pointer', transition: 'transform 0.15s', marginTop: '10px', width: '100%', overflow: 'visible' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <img src="/images/mail/mailpapabee.png" alt="" style={{ width: '88%', display: 'block', borderRadius: '10px', margin: '0 auto' }} draggable={false} />
                {!isRead && <img src="/images/mail/!.png" alt="!" style={{ position: 'absolute', top: '-11px', right: '14px', width: '28px', height: '28px' }} draggable={false} />}
                <div style={{ position: 'absolute', top: 0, left: 0, right: '23px', bottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'Cartoonist', fontSize: '14px', color: '#FFFFFF', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>{quest.subject}</span>
                </div>
              </div>
            );
          }) : (
            <div style={{ textAlign: 'center', color: '#8c6b4a', fontStyle: 'italic', padding: '20px', fontFamily: 'monospace' }}>No new mail.</div>
          )}
        </div>
      </div>
    </div>
  );
};

const EasterBasketDialog = ({ onClose }) => {
  const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
  const eggs = [
    { id: 9986, name: 'Green Egg', color: '#00ff41' },
    { id: 9985, name: 'Purple Egg', color: '#ff00ff' },
    { id: 9984, name: 'Blue Egg', color: '#00bfff' },
    { id: 9983, name: 'Yellow Egg', color: '#ffea00' },
    { id: 9982, name: 'Red Egg', color: '#ff4444' }
  ];

  return (
    <BaseDialog onClose={onClose} title="EASTER BASKET" header="/images/dialog/modal-header-inventory.png" headerOffset={10} className="custom-modal-background">
      <div style={{ padding: '20px', color: '#fff', fontFamily: 'monospace', textAlign: 'center', minWidth: '350px' }}>
        <h2 style={{ color: '#ffea00', margin: '0 0 20px 0' }}>Your Easter Egg Collection</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center', marginBottom: '20px' }}>
          {eggs.map(egg => {
            const hasEgg = sandboxLoot[egg.id] > 0;
            return (
              <div key={egg.id} style={{ width: '80px', height: '100px', backgroundColor: 'rgba(0,0,0,0.5)', border: `2px solid ${hasEgg ? egg.color : '#333'}`, borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: hasEgg ? 1 : 0.3 }}>
                <div style={{ fontSize: '40px', filter: hasEgg ? `drop-shadow(0 0 10px ${egg.color})` : 'grayscale(100%)' }}>
                  {hasEgg ? '🥚' : '❓'}
                </div>
                <span style={{ fontSize: '10px', marginTop: '5px', color: hasEgg ? egg.color : '#777' }}>{egg.name}</span>
              </div>
            );
          })}
        </div>
        {eggs.every(e => sandboxLoot[e.id] > 0) ? (
          <p style={{ color: '#00ff41', fontWeight: 'bold' }}>🎉 You found all the Easter Eggs! Happy Easter! 🎉</p>
        ) : (
          <p style={{ color: '#ccc', fontSize: '14px' }}>Keep searching the farm, forest, and pond for more eggs!</p>
        )}
        <div style={{ marginTop: '20px' }}><BaseButton label="Close" onClick={onClose} /></div>
      </div>
    </BaseDialog>
  );
};

const Farm = ({ isFarmMenu, setIsFarmMenu }) => {
  const { width, height } = FARM_VIEWPORT;
  const hotspots = FARM_HOTSPOTS;
  const settings = useAppSelector(selectSettings) || defaultSettings;
  const { seeds: currentSeeds, refetch: refetchSeeds, all: allItems, refetch } = useItems();
  const navigate = useNavigate();

  const [tutorialStep, setTutorialStep] = useState(() => parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10));
  const [tutorialCrowSpawned, setTutorialCrowSpawned] = useState(false);
  const [tutorialCrowDone, setTutorialCrowDone] = useState(false);
  const [tutorialGrowSkipped, setTutorialGrowSkipped] = useState(false);
  const [tutPage, setTutPage] = useState(1);
  const tutPageRef = useRef(1);
  const setTutPageSync = (val) => { tutPageRef.current = val; setTutPage(val); localStorage.setItem('sandbox_tut_page', String(val)); window.dispatchEvent(new CustomEvent('tutPageChanged')); };
  const [tutGemPopupOpen, setTutGemPopupOpen] = useState(false);
  const [tutGemPlotIndex, setTutGemPlotIndex] = useState(null);
  const [showMissionBoard, setShowMissionBoard] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showPabeePack, setShowPabeePack] = useState(false);
  const [showFarmCustomize, setShowFarmCustomize] = useState(false);

  const [farmingXp, setFarmingXp] = useState(() => parseInt(localStorage.getItem('sandbox_farming_xp') || '0', 10));
  const farmingLevel = getLevelFromXp(farmingXp);
  const farmingProgress = ((farmingXp - Math.pow(farmingLevel - 1, 2) * 150) / (Math.pow(farmingLevel, 2) * 150 - Math.pow(farmingLevel - 1, 2) * 150)) * 100;

  useEffect(() => {
      const handleLsUpdate = (e) => {
          if (e.detail.key === 'sandbox_farming_xp') setFarmingXp(parseInt(e.detail.value, 10));
      };
      window.addEventListener('ls-update', handleLsUpdate);
      return () => window.removeEventListener('ls-update', handleLsUpdate);
  }, []);

  useEffect(() => {
    const handler = () => {
      // Add the pack seeds to loot
      const loot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
      const packSeeds = [
        getRaritySeedId(ID_SEEDS.CARROT, 1),
        getRaritySeedId(ID_SEEDS.CARROT, 1),
        getRaritySeedId(ID_SEEDS.CARROT, 2),
        getRaritySeedId(ID_SEEDS.POTATO, 1),
        getRaritySeedId(ID_SEEDS.TOMATO, 1),
      ];
      for (const seedId of packSeeds) {
        loot[seedId] = (loot[seedId] || 0) + 1;
      }
      localStorage.setItem('sandbox_loot', JSON.stringify(loot));

      // Add 1000 honey (the in-game currency shown in the balance bar)
      const currentHoney = parseFloat(localStorage.getItem('sandbox_honey') || '0');
      const newHoney = currentHoney + 1000;
      localStorage.setItem('sandbox_honey', newHoney.toString());
      window.dispatchEvent(new CustomEvent('sandboxHoneyChanged', { detail: newHoney.toString() }));

      // Add 250 gems
      const currentGems = parseInt(localStorage.getItem('sandbox_gems') || '0', 10);
      const newGems = currentGems + 250;
      localStorage.setItem('sandbox_gems', newGems.toString());
      window.dispatchEvent(new CustomEvent('sandboxGemsChanged'));

      window.dispatchEvent(new CustomEvent('closeMailbox'));
      setShowPabeePack(true);
    };
    window.addEventListener('pabeePackOpen', handler);
    return () => window.removeEventListener('pabeePackOpen', handler);
  }, []);

  const safeItems = allItems || [];
  const axeCount = safeItems.find(i => i.id === 9991)?.count || 0;
  const pickaxeCount = safeItems.find(i => i.id === 9992)?.count || 0;
  const sticksCount = safeItems.find(i => i.id === 9995)?.count || 0;
  const {
    plantBatch,
    harvestMany,
    getMaxPlots,
    getUserCrops,
    applyGrowthElixir,
    applyPesticide,
    applyFertilizer,
    destroyCrop,
    loading: farmingLoading,
  } = useFarming();
  const { show } = useNotification();
  const [isPlanting, setIsPlanting] = useState(true);
  const [isSelectCropDialog, setIsSelectCropDialog] = useState(false);
  const [cropArray, setCropArray] = useState(() => new CropItemArrayClass(30));
  const [previewCropArray, setPreviewCropArray] = useState(
    () => new CropItemArrayClass(30)
  );
  const [currentFieldIndex, setCurrentFieldIndex] = useState(-1);
  const [selectedIndexes, setSelectedIndexes] = useState([]);
  const [selectedSeed, setSelectedSeed] = useState(null);
  const [, setGrowthTimer] = useState(null);
  const [maxPlots, setMaxPlots] = useState(0);
  const [previewUpdateKey, setPreviewUpdateKey] = useState(0);
  const [userCropsLoaded, setUserCropsLoaded] = useState(false);
  const [usedSeedsInPreview, setUsedSeedsInPreview] = useState({});
  const plantConfirmAudioRef = useRef(null);
  const harvestConfirmAudioRef = useRef(null);
  const tutPostWaterRef = useRef(false); // tracks when tut bug/crow sequence is active
  const tutWaterPlotRef = useRef(null);  // plot index used in tutorial sequence
  const bugsRef = useRef({}); // Tracks bugs currently on the farm
  const crowsRef = useRef({}); // Tracks crows currently on the farm
  const scarecrowsRef = useRef(JSON.parse(localStorage.getItem('sandbox_scarecrows') || '{}'));
  const ladybugsRef = useRef(JSON.parse(localStorage.getItem('sandbox_ladybugs') || '{}'));
  const sprinklersRef = useRef(JSON.parse(localStorage.getItem('sandbox_sprinklers') || '{}'));
  const umbrellasRef = useRef(JSON.parse(localStorage.getItem('sandbox_umbrellas') || '{}'));
  const teslaTowersRef = useRef(JSON.parse(localStorage.getItem('sandbox_tesla') || '{}'));
  
  const [isUsingPotion, setIsUsingPotion] = useState(false);
  const [selectedPotion, setSelectedPotion] = useState(null);
  const [isPlacingScarecrow, setIsPlacingScarecrow] = useState(false);
  const [placingScarecrowType, setPlacingScarecrowType] = useState('tier1'); // 'tier1', 'tier2', 'tier3', 'tier4', 'ladybug_scarecrow'
  
  const [isPlacingTesla, setIsPlacingTesla] = useState(false);
  const [teslaTowers, setTeslaTowers] = useState(teslaTowersRef.current);

  const [isPlacingLadybug, setIsPlacingLadybug] = useState(false);
  const [isPlacingSprinkler, setIsPlacingSprinkler] = useState(false);
  const [isPlacingUmbrella, setIsPlacingUmbrella] = useState(false);
  const [showFarmingBoard, setShowFarmingBoard] = useState(false);
  
  // Quest State
  const [completedQuests, setCompletedQuests] = useState(() => {
    const saved = JSON.parse(localStorage.getItem('sandbox_completed_quests') || '[]');
    // Backwards compat
    if (localStorage.getItem('sandbox_pabee_mail_claimed') === 'true' && !saved.includes('q1_pabee_intro')) {
      saved.push('q1_pabee_intro');
      localStorage.setItem('sandbox_completed_quests', JSON.stringify(saved));
    }
    return saved;
  });
  
  const hasBarnMissionUnlocked = useMemo(() => {
    return completedQuests.includes('q16_build_barn');
  }, [completedQuests]);

  const availableFarmingQuests = getQuestData().filter(q => q.type === 'farming' && q.unlockCondition(tutorialStep, completedQuests) && !completedQuests.includes(q.id));
  const activeFarmingIds = availableFarmingQuests.map(q => q.id);
  const seenFarmingIds = (localStorage.getItem('seen_farming_missions_ids') || '').split(',').filter(Boolean);
  const hasNewFarmingMissions = activeFarmingIds.some(id => !seenFarmingIds.includes(id));

  const [scarecrows, setScarecrows] = useState(scarecrowsRef.current);
  const [ladybugs, setLadybugs] = useState(ladybugsRef.current);
  const [sprinklers, setSprinklers] = useState(sprinklersRef.current);
  const [umbrellas, setUmbrellas] = useState(umbrellasRef.current);
  const [showEasterBasket, setShowEasterBasket] = useState(false);

  const [bowlWaterFilled, setBowlWaterFilled] = useState(() => localStorage.getItem('sandbox_bowl_water') === 'true');
  const [bowlFishId, setBowlFishId] = useState(() => localStorage.getItem('sandbox_bowl_fish') || null);
  const [showBowlFishDialog, setShowBowlFishDialog] = useState(false);
  
  const [showTamagotchiDialog, setShowTamagotchiDialog] = useState(false);
  const [isCatShaking, setIsCatShaking] = useState(false);
  const [catFeedTimeLeft, setCatFeedTimeLeft] = useState('');
  const [catPos, setCatPos] = useState({ left: 960, top: 500 });
  const [catState, setCatState] = useState('sit');
  const [catDirection, setCatDirection] = useState(1);
  const catSleepUntil = useRef(0);
  const catBusyUntil = useRef(0);
  const [skipGrowTarget, setSkipGrowTarget] = useState(null);
  const [tookHoney, setTookHoney] = useState(false);
  
  const [firstFedTime, setFirstFedTime] = useState(() => parseInt(localStorage.getItem('sandbox_cat_first_fed_time') || '0', 10));
  const [isCatUnlocked, setIsCatUnlocked] = useState(false);
  const [catHappiness, setCatHappiness] = useState(() => parseFloat(localStorage.getItem('sandbox_cat_happiness') || '50'));
  const [catHealth, setCatHealth] = useState(() => parseFloat(localStorage.getItem('sandbox_cat_health') || '100'));
  const [currentHunger, setCurrentHunger] = useState(0);
  const [yarnState, setYarnState] = useState(null);

  const forestTimestamp = parseInt(localStorage.getItem('forest_last_visited') || '0', 10);
  const starvingTime = parseInt(localStorage.getItem('sandbox_cat_starving_time') || '0', 10);
  const catWillAppear = isCatUnlocked;

  const [isGlobalDialogOpen, setIsGlobalDialogOpen] = useState(false);
  
  useEffect(() => {
    const handleGlobalDialog = (e) => setIsGlobalDialogOpen(e.detail);
    window.addEventListener('globalDialogOpen', handleGlobalDialog);
    return () => window.removeEventListener('globalDialogOpen', handleGlobalDialog);
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('petDialogOpen', { detail: showTamagotchiDialog || showBowlFishDialog }));
  }, [showTamagotchiDialog, showBowlFishDialog]);

  const hideIcons = isGlobalDialogOpen || showTamagotchiDialog || showBowlFishDialog || isSelectCropDialog;

  useEffect(() => {
    const checkUnlock = () => {
      if (firstFedTime > 0 && Date.now() - firstFedTime >= 60 * 60 * 1000) {
        setIsCatUnlocked(true);
      } else {
        setIsCatUnlocked(false);
        // Fix for early starving bug: clean it up if it was erroneously set
        if (localStorage.getItem('sandbox_cat_starving_time')) {
          localStorage.removeItem('sandbox_cat_starving_time');
        }
      }
    };
    checkUnlock();
    const interval = setInterval(checkUnlock, 1000);
    return () => clearInterval(interval);
  }, [firstFedTime]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('seedDialogOpen', { detail: isSelectCropDialog }));
  }, [isSelectCropDialog]);

  const [sirBeePos, setSirBeePos] = useState('-200px');


  useEffect(() => {
    if (tutorialStep === 1) {
      const t1 = setTimeout(() => setSirBeePos('670px'), 100);
      const t2 = setTimeout(() => {
         setTutorialStep(2);
         localStorage.setItem('sandbox_tutorial_step', '2');
      }, 2100);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    } else if (tutorialStep >= 2) {
      setSirBeePos('670px');
    }
  }, [tutorialStep]);
  
  useEffect(() => {
    if (tutorialStep === 24) {
      setTutorialStep(25);
      localStorage.setItem('sandbox_tutorial_step', '25');
    }
  }, [tutorialStep]);

  // Auto-open gem popup when advancing to tutPage 11
  useEffect(() => {
    if (tutorialStep !== 3 || tutPage !== 11) return;
    const plotIdx = tutWaterPlotRef.current;
    if (plotIdx !== null) {
      setTutGemPlotIndex(plotIdx);
      setTutGemPopupOpen(true);
      // Deselect watercan tool
      setSelectedTool(null);
      setIsWatering(false);
      // Freeze crop countdown — mark as ready so timer stops; popup blocks harvesting until paid
      const skipped = JSON.parse(localStorage.getItem('sandbox_skipped_crops') || '{}');
      skipped[plotIdx] = true;
      localStorage.setItem('sandbox_skipped_crops', JSON.stringify(skipped));
      setCropArray(prev => {
        const newArr = new CropItemArrayClass(30);
        newArr.copyFrom(prev);
        const item = newArr.getItem(plotIdx);
        if (item) { item.growStatus = 2; }
        return newArr;
      });
    }
  }, [tutPage, tutorialStep]);

  // Set market tutorial flag when user is on tutPage 12
  useEffect(() => {
    if (tutorialStep !== 3 || tutPage !== 12) return;
    const handleClick = (e) => {
      if (e.target.closest('a[href*="/market"]')) {
        localStorage.setItem('sandbox_tut_market', 'true');
      }
    };
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [tutorialStep, tutPage]);

  const [tutSticks, setTutSticks] = useState(0);
  const [tutAxe, setTutAxe] = useState(0);
  const [tutPickaxe, setTutPickaxe] = useState(0);

  useEffect(() => {
    if (tutorialStep === 26) {
      const updateTutCounts = () => {
        const loot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
        setTutSticks(loot[9995] || 0);
        setTutAxe(loot[9991] || 0);
        setTutPickaxe(loot[9992] || 0);
      };
      updateTutCounts();
      const timer = setInterval(updateTutCounts, 500);
      return () => clearInterval(timer);
    }
  }, [tutorialStep]);

  const autoSpawnRef = useRef(localStorage.getItem('auto_spawn_enabled') !== 'false');
  const [simulatedDay, setSimulatedDay] = useState(() => getSimulatedDateInfo().day);
  const [simulatedDate, setSimulatedDate] = useState(() => getSimulatedDateInfo().date);
  const simulatedDateRef = useRef(simulatedDate);
  useEffect(() => {
    simulatedDateRef.current = simulatedDate;
  }, [simulatedDate]);
  
  // Load Worker Bee Level
  const [workerBeeLevel, setWorkerBeeLevel] = useState(() => {
    const saved = parseInt(localStorage.getItem('sandbox_worker_bee_level'), 10);
    return isNaN(saved) ? 1 : saved;
  });

  // Sync Worker Bee Level Changes
  useEffect(() => {
    const handleBeeLevelChange = (e) => setWorkerBeeLevel(e.detail);
    window.addEventListener('workerBeeLevelChanged', handleBeeLevelChange);
    return () => window.removeEventListener('workerBeeLevelChanged', handleBeeLevelChange);
  }, []);

  const handleSkipGrowth = () => {
    const currentGems = parseInt(localStorage.getItem('sandbox_gems') || '0', 10);
    if (currentGems < 50) {
      show("You don't have enough Gems!", "error");
      setSkipGrowTarget(null);
      return;
    }

    const newGems = currentGems - 50;
    localStorage.setItem('sandbox_gems', newGems.toString());
    window.dispatchEvent(new CustomEvent('sandboxGemsChanged', { detail: newGems.toString() }));
    
    const skipped = JSON.parse(localStorage.getItem('sandbox_skipped_crops') || '{}');
    skipped[skipGrowTarget] = true;
    localStorage.setItem('sandbox_skipped_crops', JSON.stringify(skipped));
    
    const newWaterState = { ...waterStateRef.current };
    if (!newWaterState[skipGrowTarget]) {
      newWaterState[skipGrowTarget] = { needsInitial: false, needsMid: false, pausedMs: 0 };
    } else {
      newWaterState[skipGrowTarget].needsInitial = false;
      newWaterState[skipGrowTarget].needsMid = false;
    }
    newWaterState[skipGrowTarget].contractPlantedAt = 1; // instantly ready
    newWaterState[skipGrowTarget].pausedMs = 0;
    
    waterStateRef.current = newWaterState;
    localStorage.setItem('sandbox_water_state', JSON.stringify(newWaterState));
    
    setPreviewUpdateKey(prev => prev + 1); // trigger re-render
    
    show("Growth skipped! Crop is ready to harvest.", "success");
    setSkipGrowTarget(null);
  };

  // Plot Preparation State (0: Red X, 1: Hole, 2: Hole+Fish, 3: Dirt Pile)
  const [plotPrep, setPlotPrep] = useState(() => JSON.parse(localStorage.getItem('sandbox_plot_prep') || '{}'));
  const [prepDialogTarget, setPrepDialogTarget] = useState(null);

  // Watering State
  const waterStateRef = useRef(JSON.parse(localStorage.getItem('sandbox_water_state') || '{}'));
  const [isWatering, setIsWatering] = useState(false);
  const [isDigging, setIsDigging] = useState(false);
  const [isHoeing, setIsHoeing] = useState(false);
  const [isDirting, setIsDirting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [waterEffects, setWaterEffects] = useState([]);

  useEffect(() => {
    const handleShake = () => {
      setIsCatShaking(true);
      setTimeout(() => setIsCatShaking(false), 1500); // 3 shakes in 1.5 seconds
    };
    window.addEventListener('crazyCatShake', handleShake);
    return () => window.removeEventListener('crazyCatShake', handleShake);
  }, []);

  useEffect(() => {
    const handleCatAttack = (e) => {
      const { plotIndex } = e.detail;
      const target = FARM_POSITIONS[plotIndex];
      if (!target) return;
      
      const targetX = parseInt(target.left) || 500;
      const targetY = parseInt(target.top) || 300;
      
      setCatPos(prev => {
        const actualDeltaX = targetX - prev.left;
        setCatDirection(actualDeltaX > 0 ? -1 : 1);
        return { left: targetX, top: targetY - 40 };
      });
      setCatState('walk');
      catSleepUntil.current = 0;
      catBusyUntil.current = Date.now() + 4500;
      
      setTimeout(() => {
        const currentFedTime = parseInt(localStorage.getItem('sandbox_cat_fed_time') || '0', 10);
        if (currentFedTime > 0) {
           localStorage.setItem('sandbox_cat_fed_time', (currentFedTime - 4 * 60 * 60 * 1000).toString());
        }
        setBowlWaterFilled(false);
        localStorage.removeItem('sandbox_bowl_water');
        setCatState('sit');
      }, 3800);
    };
    window.addEventListener('animateCatAttack', handleCatAttack);
    return () => window.removeEventListener('animateCatAttack', handleCatAttack);
  }, [setCropArray]);

  useEffect(() => {
    const timer = setInterval(() => {
        const fedTime = parseInt(localStorage.getItem('sandbox_cat_fed_time') || '0', 10);
        const starvingTime = parseInt(localStorage.getItem('sandbox_cat_starving_time') || '0', 10);
        
        let hungerVal = 0;
        if (fedTime > 0) {
            const twelveHours = 12 * 60 * 60 * 1000;
            const endTime = fedTime + twelveHours;
            const remaining = endTime - Date.now();
            
            hungerVal = Math.max(0, 100 - ((Date.now() - fedTime) / twelveHours) * 100);
            setCurrentHunger(hungerVal);
            
            if (remaining > 0) {
                const hours = Math.floor(remaining / (1000 * 60 * 60));
                const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
                setCatFeedTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            } else {
                setCatFeedTimeLeft('');
            }
        } else if (starvingTime > 0) {
            setCurrentHunger(0);
            const twentyFourHours = 24 * 60 * 60 * 1000;
            const remaining = (starvingTime + twentyFourHours) - Date.now();
            if (remaining > 0) {
                const hours = Math.floor(remaining / (1000 * 60 * 60));
                const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
                setCatFeedTimeLeft(`ANGRY: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            } else {
                setCatFeedTimeLeft('');
            }
        } else {
            setCurrentHunger(0);
            setCatFeedTimeLeft('');
        }
        
        // Happiness and Health Decay or Increase
        let happy = parseFloat(localStorage.getItem('sandbox_cat_happiness') || '50');
        let hlth = parseFloat(localStorage.getItem('sandbox_cat_health') || '100');
        let lastUpdateStr = localStorage.getItem('sandbox_cat_happy_update');
        if (!lastUpdateStr) {
           lastUpdateStr = Date.now().toString();
           localStorage.setItem('sandbox_cat_happy_update', lastUpdateStr);
        }
        const lastUpdate = parseInt(lastUpdateStr, 10);
        const now = Date.now();
        const elapsedHours = (now - lastUpdate) / (1000 * 60 * 60);

        if (elapsedHours > 0) {
           if (hungerVal < 50) {
              happy = Math.max(0, happy - (10 * elapsedHours)); // 10% per hour
              localStorage.setItem('sandbox_cat_happiness', happy.toString());
           } else if (hungerVal >= 95 && bowlWaterFilled && starvingTime === 0) {
              happy = Math.min(100, happy + (10 * elapsedHours)); // +10% per hour increase
              localStorage.setItem('sandbox_cat_happiness', happy.toString());
           }
           
           if (starvingTime > 0) {
              hlth = Math.max(0, hlth - (20 * elapsedHours));
              localStorage.setItem('sandbox_cat_health', hlth.toString());
           } else if (hungerVal >= 80 && bowlWaterFilled) {
              hlth = Math.min(100, hlth + (10 * elapsedHours));
              localStorage.setItem('sandbox_cat_health', hlth.toString());
           }
           
           localStorage.setItem('sandbox_cat_happy_update', now.toString());
           setCatHappiness(happy);
           setCatHealth(hlth);
        }
    }, 1000);
    return () => clearInterval(timer);
  }, [bowlWaterFilled, bowlFishId]);

  useEffect(() => {
    if (!catWillAppear || tutorialStep < 11 || yarnState?.active) return;

    const catLoop = setInterval(() => {
      if (Date.now() < catBusyUntil.current) return;
      if (Date.now() < catSleepUntil.current) return;

      setCatPos(prev => {
        const isAngry = starvingTime > 0;
        if (isAngry) {
          setCatState('sit');
          return prev;
        }

        const randomAction = Math.random();
        if (randomAction < 0.4) {
          setCatState('walk');
          const deltaX = Math.random() * 1000 - 500;
          const deltaY = Math.random() * 500 - 250;
          const newLeft = prev.left + deltaX;
          const newTop = prev.top + deltaY;
          const clampedLeft = Math.max(95, Math.min(1126, newLeft));
          const clampedTop = Math.max(303, Math.min(803, newTop));
          const actualDeltaX = clampedLeft - prev.left;
          
          setCatDirection(actualDeltaX > 0 ? -1 : 1);
          return { left: clampedLeft, top: clampedTop };
        } else if (randomAction < 0.7) {
          setCatState('sit');
          return prev;
        } else {
          setCatState('sleep');
          catSleepUntil.current = Date.now() + (10 * 60 * 1000) + (Math.random() * 10 * 60 * 1000);
          return prev;
        }
      });
    }, 4000);

    return () => clearInterval(catLoop);
  }, [catWillAppear, tutorialStep, starvingTime, yarnState?.active]);

  useEffect(() => {
    if (bowlWaterFilled && bowlFishId !== null) {
      if (!localStorage.getItem('sandbox_cat_fed_time')) {
        localStorage.setItem('sandbox_cat_fed_time', Date.now().toString());
        localStorage.removeItem('sandbox_cat_starving_time');
      }
      if (!localStorage.getItem('sandbox_cat_first_fed_time')) {
         const now = Date.now();
         localStorage.setItem('sandbox_cat_first_fed_time', now.toString());
         setFirstFedTime(now);
      }
    } else {
      localStorage.removeItem('sandbox_cat_fed_time');
      if (isCatUnlocked && !localStorage.getItem('sandbox_cat_starving_time')) {
        localStorage.setItem('sandbox_cat_starving_time', Date.now().toString());
      }
    }
  }, [bowlWaterFilled, bowlFishId, isCatUnlocked]);
  
  // Forest Lock Timer
  const [forestLockTime, setForestLockTime] = useState(0);
  const [mineLockTime, setMineLockTime] = useState(0);
  const [selectedTool, setSelectedTool] = useState(null);
  const toggleTool = (name) => setSelectedTool(prev => prev === name ? null : name);

  useEffect(() => {
    const checkLock = () => {
      const lv = localStorage.getItem('forest_last_visited');
      if (lv) {
        const el = Date.now() - parseInt(lv, 10);
        const th = 45 * 60 * 1000; // 45 mins
        if (el < th) setForestLockTime(th - el);
        else setForestLockTime(0);
      } else setForestLockTime(0);
      
      const mlv = localStorage.getItem('mine_last_visited');
      if (mlv) {
        const el = Date.now() - parseInt(mlv, 10);
        const th = 45 * 60 * 1000; // 45 mins
        if (el < th) setMineLockTime(th - el);
        else setMineLockTime(0);
      } else setMineLockTime(0);
    };
    
    checkLock();
    const timer = setInterval(checkLock, 1000);

    window.cml = (cmd) => {
      if (cmd === 'forest' || cmd === 'forset') {
        localStorage.removeItem('forest_last_visited');
        setForestLockTime(0);
      }
      if (cmd === 'mine') {
        localStorage.removeItem('mine_last_visited');
        setMineLockTime(0);
      }
      if (cmd === 'skip') {
          setTutorialStep(9);
          localStorage.setItem('sandbox_tutorial_step', '9');
        setIsDigging(false);
        setIsDirting(false);
        setIsSeeding(false);
      }
      if (cmd === 'animal farm') {
        const comp = JSON.parse(localStorage.getItem('sandbox_completed_quests') || '[]');
        if (!comp.includes('q16_build_barn')) {
          comp.push('q16_build_barn');
          localStorage.setItem('sandbox_completed_quests', JSON.stringify(comp));
          setCompletedQuests(comp);
        }
        window.dispatchEvent(new CustomEvent('showNotification', { detail: { msg: "Animal Farm unlocked!", type: "success" } }));
      }
      if (cmd === 'skip time') {
        const skipAmount = 24 * 60 * 60 * 1000;
        const fVisit = localStorage.getItem('forest_last_visited');
        if (fVisit) localStorage.setItem('forest_last_visited', (parseInt(fVisit, 10) - skipAmount).toString());
        const mVisit = localStorage.getItem('mine_last_visited');
        if (mVisit) localStorage.setItem('mine_last_visited', (parseInt(mVisit, 10) - skipAmount).toString());
        window.dispatchEvent(new CustomEvent('skipTime'));
        window.dispatchEvent(new CustomEvent('showNotification', { detail: { msg: "Time skipped by 24 hours!", type: "success" } }));
      }
      if (cmd && cmd.startsWith('yarn')) {
        const parts = cmd.split(' ');
        const amt = parts[1] ? parseInt(parts[1], 10) : 1;
        const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
        sandboxLoot[9955] = Math.max(0, (sandboxLoot[9955] || 0) + amt);
        localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
        window.dispatchEvent(new CustomEvent('showNotification', { detail: { msg: `Added ${amt}x Yarn!`, type: "success" } }));
      }
      if (cmd && ['farming', 'fishing', 'foraging', 'mining', 'crafting'].some(s => cmd.startsWith(s))) {
        const parts = cmd.split(' ');
        const skillName = parts[0].toLowerCase();
        const level = parseInt(parts[1], 10);
        if (!isNaN(level)) {
          const xpNeeded = Math.pow(level - 1, 2) * 150;
          localStorage.setItem(`sandbox_${skillName}_xp`, xpNeeded.toString());
          window.dispatchEvent(new CustomEvent('ls-update', { detail: { key: `sandbox_${skillName}_xp`, value: xpNeeded.toString() } }));
          window.dispatchEvent(new CustomEvent('showNotification', { detail: { msg: `${skillName.charAt(0).toUpperCase() + skillName.slice(1)} level set to ${level}!`, type: "success" } }));
        }
      }
      if (cmd && cmd.startsWith('crop ')) {
        const amount = parseInt(cmd.split(' ')[1], 10);
        if (!isNaN(amount)) {
          localStorage.setItem('sandbox_total_crops', amount.toString());
          window.dispatchEvent(new CustomEvent('soilProgressChanged'));
          window.dispatchEvent(new CustomEvent('showNotification', { detail: { msg: `Crop count set to ${amount.toLocaleString()}!`, type: "success" } }));
        }
      }
      if (cmd && cmd.startsWith('weather ')) {
        const weather = cmd.split(' ')[1];
        if (['sunny', 'rain', 'storm', 'clear'].includes(weather)) {
          if (weather === 'clear') {
            localStorage.removeItem('sandbox_weather_override');
            window.dispatchEvent(new CustomEvent('showNotification', { detail: { msg: `Weather override cleared!`, type: "success" } }));
          } else {
            localStorage.setItem('sandbox_weather_override', weather);
            window.dispatchEvent(new CustomEvent('showNotification', { detail: { msg: `Weather forced to ${weather}!`, type: "success" } }));
          }
        }
      }
    };

    return () => {
      clearInterval(timer);
      delete window.cml;
    };
  }, []);

  // The Well Dropping Logic
  const handleWellDrop = () => {
    const loot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    if (!loot[9953] || loot[9953] <= 0) {
      show("You need to craft a Bucket first to use the Well!", "error");
      return;
    }
    const today = new Date().toDateString();
    const wellDate = localStorage.getItem('sandbox_well_date');
    let uses = parseInt(localStorage.getItem('sandbox_well_uses') || '0', 10);
    
    if (wellDate !== today) {
      uses = 0;
      localStorage.setItem('sandbox_well_date', today);
    }
    
    if (uses >= 5) {
      show("The well is drying up. Try again tomorrow!", "warning");
      return;
    }
    
    uses += 1;
    localStorage.setItem('sandbox_well_uses', uses.toString());
    
    if (Math.random() < 0.01) { // 1% chance
      loot[9954] = (loot[9954] || 0) + 1;
      localStorage.setItem('sandbox_loot', JSON.stringify(loot));
      const expiry = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem('sandbox_ring_expiry', expiry.toString());
      show("SPLASH! You pulled up a Magic Ring! Harvests are doubled for 24 hours!", "success");
      if (refetch) refetch();
    } else {
      show(`SPLASH! You pulled up some muddy water... (${5 - uses} attempts left today)`, "info");
    }
  };

  const updatePlotPrep = useCallback((index, prepData) => {
    setPlotPrep(prev => {
      const next = { ...prev, [index]: prepData };
      localStorage.setItem('sandbox_plot_prep', JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('plotPrepUpdated', { detail: next }));
      return next;
    });
  }, [setPlotPrep]);

  const handleRemoveScarecrow = useCallback((spotId) => {
    setScarecrows((prev) => {
      const newScarecrows = { ...prev };
      delete newScarecrows[spotId];
      scarecrowsRef.current = newScarecrows;
      localStorage.setItem('sandbox_scarecrows', JSON.stringify(newScarecrows));
      return newScarecrows;
    });
  }, []);

  const handleRemoveLadybug = useCallback((spotId) => {
    setLadybugs((prev) => {
      const newLadybugs = { ...prev };
      delete newLadybugs[spotId];
      ladybugsRef.current = newLadybugs;
      localStorage.setItem('sandbox_ladybugs', JSON.stringify(newLadybugs));
      return newLadybugs;
    });
  }, []);

  const handleRemoveSprinkler = useCallback((spotId) => {
    setSprinklers((prev) => {
      const next = { ...prev };
      delete next[spotId];
      sprinklersRef.current = next;
      localStorage.setItem('sandbox_sprinklers', JSON.stringify(next));
      return next;
    });
  }, []);

  const handleRemoveUmbrella = useCallback((spotId) => {
    setUmbrellas((prev) => {
      const next = { ...prev };
      delete next[spotId];
      umbrellasRef.current = next;
      localStorage.setItem('sandbox_umbrellas', JSON.stringify(next));
      return next;
    });
  }, []);

  const loadCropsFromContract = useCallback(
    async () => {
      try {
        setUserCropsLoaded(false);
        // Get all user crops in a single call
        const crops = await getUserCrops();

        // Collect unique seedIds to fetch growth times once per seed type
        const uniqueSeedIds = Array.from(
          new Set(
            crops
              .map((crop) => crop.seedId)
              .filter((sid) => sid && sid !== 0n)
          )
        );

        const growthTimeCache = new Map();
        const skippedCrops = JSON.parse(localStorage.getItem('sandbox_skipped_crops') || '{}');
        
        // WEATHER BUFFS/NERFS
        let weatherEmoji = getWeatherForDay(simulatedDate);
        const wOverride = localStorage.getItem('sandbox_weather_override');
        if (wOverride === 'sunny') weatherEmoji = '☀️';
        else if (wOverride === 'rain') weatherEmoji = '🌧️';
        else if (wOverride === 'storm') weatherEmoji = '⚡';

        let weatherMultiplier = 1;
        const currentTutorialStep = parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10);
        if (currentTutorialStep >= 32) {
          if (weatherEmoji === '☀️') weatherMultiplier = 1.10; // 10% faster
          else if (weatherEmoji === '🌧️' || weatherEmoji === '⚡') weatherMultiplier = 0.95; // 5% slower
        }

        let baseSpeedMultiplier = Number(localStorage.getItem('sandbox_crop_speed') || 100) / 100;
        if (isNaN(baseSpeedMultiplier) || baseSpeedMultiplier <= 0) baseSpeedMultiplier = 1;
        const currentSpeedMultiplier = baseSpeedMultiplier * weatherMultiplier;

        await Promise.all(
          uniqueSeedIds.map(async (sid) => {
            const baseGt = getGrowthTime(sid);
            const gt = Math.max(1, Math.floor(baseGt / currentSpeedMultiplier));
            const normalGt = Math.max(1, Math.floor(baseGt / baseSpeedMultiplier));
            growthTimeCache.set(sid.toString(), { gt, normalGt });
          })
        );

        const nowSec = Math.floor(Date.now() / 1000);
        const newCropArray = new CropItemArrayClass(30);
        for (const crop of crops) {
          if (crop.seedId && crop.seedId !== 0n) {
            const item = newCropArray.getItem(crop.plotNumber);
            if (item) {
              const seedIdBig = crop.seedId;
              item.seedId = seedIdBig;
              const endTime = Number(crop.endTime?.toString?.() || crop.endTime || 0);
              const growthTimeObj = growthTimeCache.get(seedIdBig.toString());
              const growthTime = growthTimeObj ? growthTimeObj.gt : 60;
              
              if (skippedCrops[crop.plotNumber]) {
                item.plantedAt = 1;
                item.contractPlantedAt = 1;
                item.growStatus = 2;
                item.growthTime = growthTime;
              } else {
                // Calculate plantedAt based on original growth time and current endTime
                // The endTime might be modified by Growth Elixir, so we need to account for that
                const originalEndTime = Math.floor((item.plantedAt || 0) / 1000) + growthTime;
                const timeDifference = originalEndTime - endTime;
                
                // Adjust plantedAt and record Growth Elixir application if any
                const originalPlantedAt = (endTime - growthTime) * 1000;
                item.contractPlantedAt = isNaN(originalPlantedAt) ? Date.now() : originalPlantedAt;
                let wState = waterStateRef.current[crop.plotNumber];
                let pausedMs = (wState && !isNaN(wState.pausedMs)) ? wState.pausedMs : 0;
                item.plantedAt = item.contractPlantedAt + pausedMs;
                item.growthElixirApplied = timeDifference > 0;
                
                item.growthTime = growthTime;
                const adjustedEndTime = Math.floor(item.plantedAt / 1000) + growthTime;
                const isReady = adjustedEndTime <= nowSec;
                item.growStatus = isReady ? 2 : 1;
              }
              
              // Store potion effect multipliers and growth elixir status for display
              item.produceMultiplierX1000 = crop.produceMultiplierX1000 || 1000;
              item.tokenMultiplierX1000 = crop.tokenMultiplierX1000 || 1000;
              item.growthElixirApplied = !!crop.growthElixirApplied;
              
              // Fetch Fish Fertilizer scaling
              const savedPlotPrep = JSON.parse(localStorage.getItem('sandbox_plot_prep') || '{}');
              const pData = savedPlotPrep[crop.plotNumber];
              if (pData && pData.fishId) {
                  const fishItem = ALL_ITEMS[pData.fishId];
                  let boost = 1.05; // 5% base
                  if (fishItem && fishItem.type) {
                      if (fishItem.type.includes('UNCOMMON')) boost = 1.08;
                      if (fishItem.type.includes('RARE')) boost = 1.10;
                      if (fishItem.type.includes('EPIC')) boost = 1.15;
                      if (fishItem.type.includes('LEGENDARY')) boost = 1.25;
                  }
                  item.fishScaleBonus = boost; // Scale to be applied in FarmInterface visual
              }

              // Re-inject bugs/crows so they don't blink or reset animations on reload
              item.bugCountdown = bugsRef.current[crop.plotNumber];
              item.crowCountdown = crowsRef.current[crop.plotNumber];
            }
          } else {
            newCropArray.removeCropAt(crop.plotNumber);
          }
        }

        // Force state updates to trigger re-renders
        setCropArray(newCropArray);
        setPreviewCropArray(newCropArray);
        setUserCropsLoaded(true);
        
        // Force a re-render by updating the preview key
        setPreviewUpdateKey(prev => prev + 1);
        
        // Clear any stale selection state when loading crops
        setSelectedIndexes([]);
        
      } catch (error) {
        const { message } = handleContractError(error, 'loading crops');
        console.error("Failed to load crops from contract:", message);
        const emptyArray = new CropItemArrayClass(30);
        setCropArray(emptyArray);
        setPreviewCropArray(emptyArray);
        setUserCropsLoaded(true);
      }
    },
    [getUserCrops, simulatedDate]
  );

  const handleForceSpawnBug = () => {
    const validPlots = [];
    const nowSec = Math.floor(Date.now() / 1000);

    for (let i = 0; i < 30; i++) {
      const item = cropArray.getItem(i);
      if (item && item.seedId && item.seedId !== 0n && bugsRef.current[i] === undefined) {
        let isProtected = false;
        for (const [spotId, protectedPlots] of Object.entries(protectedPlotsBySpot)) {
          const sc = scarecrowsRef.current[spotId];
          if (sc) {
             const exp = typeof sc === 'number' ? sc : sc.expiry;
             const type = typeof sc === 'number' ? 'tier1' : sc.type;
             if (exp > nowSec && type === 'ladybug_scarecrow' && protectedPlots.includes(i)) {
                 isProtected = true;
                 break;
             }
          }
          if (ladybugsRef.current[spotId] > nowSec && protectedPlots.includes(i)) {
            isProtected = true;
            break;
          }
        }
        if (!isProtected) validPlots.push(i);
      }
    }
    if (validPlots.length > 0) {
      const target = validPlots[Math.floor(Math.random() * validPlots.length)];
      bugsRef.current[target] = 60; // 60s timer
      show(`Bug spawned on plot ${target}!`, "warning");
    } else {
      show("No available crops for a bug!", "info");
    }
  };

  const handleForceSpawnCrow = () => {
    const validPlots = [];
    const nowSec = Math.floor(Date.now() / 1000);
    
    for (let i = 0; i < 30; i++) {
      const item = cropArray.getItem(i);
      if (item && item.seedId && item.seedId !== 0n && crowsRef.current[i] === undefined) {
        let isProtected = false;
        for (const [spotId, protectedPlots] of Object.entries(protectedPlotsBySpot)) {
          const sc = scarecrowsRef.current[spotId];
          if (sc) {
            const exp = typeof sc === 'number' ? sc : sc.expiry;
            const type = typeof sc === 'number' ? 'tier1' : sc.type;
            
            if (exp > nowSec) {
              let protectsThisPlot = false;
              if (type === 'tier4') protectsThisPlot = true;
              else if (type === 'tier3') protectsThisPlot = Math.abs(i - protectedPlots[0]) <= 5;
              else if (type === 'tier2') protectsThisPlot = Math.abs(i - protectedPlots[0]) <= 2;
              else protectsThisPlot = protectedPlots.includes(i);
              
              if (protectsThisPlot) {
                isProtected = true;
                break;
              }
            }
          }
        }
        if (!isProtected) validPlots.push(i);
      }
    }

    if (validPlots.length > 0) {
      const target = validPlots[Math.floor(Math.random() * validPlots.length)];
      crowsRef.current[target] = 30; // 30s timer
      show(`Crow spawned on plot ${target}!`, "warning");
    } else {
      show("No unprotected crops available for a crow!", "info");
    }
  };



  useEffect(() => {
    const onAdminDeleteSpot = (e) => {
      if (e.detail.id !== null) handleRemoveScarecrow(e.detail.id);
      else { setScarecrows({}); scarecrowsRef.current = {}; localStorage.setItem('sandbox_scarecrows', JSON.stringify({})); }
    };
    const onAdminDeleteLadybug = (e) => {
      if (e.detail.id !== null) handleRemoveLadybug(e.detail.id);
      else { setLadybugs({}); ladybugsRef.current = {}; localStorage.setItem('sandbox_ladybugs', JSON.stringify({})); }
    };
    const onAdminDeleteSprinkler = (e) => {
      if (e.detail.id !== null) handleRemoveSprinkler(e.detail.id);
      else { setSprinklers({}); sprinklersRef.current = {}; localStorage.setItem('sandbox_sprinklers', JSON.stringify({})); }
    };
    const onAdminDeleteUmbrella = (e) => {
      if (e.detail.id !== null) handleRemoveUmbrella(e.detail.id);
      else { setUmbrellas({}); umbrellasRef.current = {}; localStorage.setItem('sandbox_umbrellas', JSON.stringify({})); }
    };
    const onAdminDeleteTesla = (e) => {
      if (e.detail.id !== null) {
        setTeslaTowers(prev => { const next = { ...prev }; delete next[e.detail.id]; teslaTowersRef.current = next; localStorage.setItem('sandbox_tesla', JSON.stringify(next)); return next; });
      } else {
        setTeslaTowers({}); teslaTowersRef.current = {}; localStorage.setItem('sandbox_tesla', JSON.stringify({}));
      }
    };

    const onAdminClearCrops = () => {
      const emptyCrops = new Array(30).fill(null).map(() => ({ id: 0, endTime: 0, prodMultiplier: 1000, tokenMultiplier: 1000, growthElixir: 0 }));
      localStorage.setItem('sandbox_crops', JSON.stringify(emptyCrops));
      const emptyArray = new CropItemArrayClass(30);
      setCropArray(emptyArray);
      setPreviewCropArray(emptyArray);
      
      setPlotPrep({});
      localStorage.removeItem('sandbox_plot_prep');
      window.dispatchEvent(new CustomEvent('plotPrepUpdated', { detail: {} }));
      
      waterStateRef.current = {};
      localStorage.setItem('sandbox_water_state', JSON.stringify({}));
      localStorage.removeItem('sandbox_skipped_crops');

      setPreviewUpdateKey(prev => prev + 1);
    };
    const onAdminClearPests = () => {
      bugsRef.current = {};
      crowsRef.current = {};
      setCropArray(prev => {
        const newArr = new CropItemArrayClass(30);
        newArr.copyFrom(prev);
        for(let i = 0; i < 30; i++) {
           const item = newArr.getItem(i);
           if(item) {
             item.bugCountdown = undefined;
             item.crowCountdown = undefined;
           }
        }
        return newArr;
      });
    };
    const onToggleAutoSpawn = (e) => autoSpawnRef.current = e.detail;
    const onResetPlotPrep = (e) => updatePlotPrep(e.detail.plotIndex, { status: 0 });
    const onSetAllPlotsX = () => {
      const next = {};
      for (let i = 0; i < maxPlots; i++) next[i] = { status: 0 };
      setPlotPrep(next);
      localStorage.setItem('sandbox_plot_prep', JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('plotPrepUpdated', { detail: next }));
    };
    const onSkipTutorial = () => {
      setTutorialStep(32);
      localStorage.setItem('sandbox_tutorial_step', '32');
      setIsDigging(false);
      setIsDirting(false);
      setIsSeeding(false);
    };

    const onSkipTime = () => {
      const skipAmount = 24 * 60 * 60 * 1000;
      const currentWaterState = { ...waterStateRef.current };
      let changed = false;
      for (const idx in currentWaterState) {
        if (currentWaterState[idx].contractPlantedAt) {
          currentWaterState[idx].contractPlantedAt -= skipAmount;
          changed = true;
        }
      }
      if (changed) {
        waterStateRef.current = currentWaterState;
        localStorage.setItem('sandbox_water_state', JSON.stringify(currentWaterState));
        setPreviewUpdateKey(prev => prev + 1);
      }
    };

    const onSkipCatTime = () => {
      const fTime = localStorage.getItem('sandbox_cat_first_fed_time');
      if (fTime) setFirstFedTime(parseInt(fTime, 10));
    };

    const handleOpenCrafting = (e) => {
      setIsPlacingScarecrow(false);
      setIsPlacingLadybug(false);
      setIsPlacingSprinkler(false);
      setIsPlacingUmbrella(false);
      setIsPlacingTesla(false);
      setIsPlanting(false);
      setIsFarmMenu(false);
    };

    const onChangeSimulatedDate = (e) => {
      setSimulatedDay(e.detail.day);
      setSimulatedDate(e.detail.date);
    };

    window.addEventListener('forceSpawnBug', handleForceSpawnBug);
    window.addEventListener('forceSpawnCrow', handleForceSpawnCrow);
    window.addEventListener('adminDeleteSpot', onAdminDeleteSpot);
    window.addEventListener('adminDeleteLadybug', onAdminDeleteLadybug);
    window.addEventListener('adminDeleteSprinkler', onAdminDeleteSprinkler);
    window.addEventListener('adminDeleteUmbrella', onAdminDeleteUmbrella);
    window.addEventListener('adminDeleteTesla', onAdminDeleteTesla);
    window.addEventListener('adminClearCrops', onAdminClearCrops);
    window.addEventListener('adminClearPests', onAdminClearPests);
    window.addEventListener('changeSimulatedDate', onChangeSimulatedDate);
    window.addEventListener('toggleAutoSpawn', onToggleAutoSpawn);
    window.addEventListener('resetPlotPrep', onResetPlotPrep);
    window.addEventListener('setAllPlotsX', onSetAllPlotsX);
    window.addEventListener('skipTutorial', onSkipTutorial);
    window.addEventListener('skipTime', onSkipTime);
    window.addEventListener('skipCatTime', onSkipCatTime);
    window.addEventListener('openCraftingFor', handleOpenCrafting);

    return () => {
      window.removeEventListener('forceSpawnBug', handleForceSpawnBug);
      window.removeEventListener('forceSpawnCrow', handleForceSpawnCrow);
      window.removeEventListener('adminDeleteSpot', onAdminDeleteSpot);
      window.removeEventListener('adminDeleteLadybug', onAdminDeleteLadybug);
      window.removeEventListener('adminDeleteSprinkler', onAdminDeleteSprinkler);
      window.removeEventListener('adminDeleteUmbrella', onAdminDeleteUmbrella);
      window.removeEventListener('adminDeleteTesla', onAdminDeleteTesla);
      window.removeEventListener('adminClearCrops', onAdminClearCrops);
      window.removeEventListener('adminClearPests', onAdminClearPests);
      window.removeEventListener('changeSimulatedDate', onChangeSimulatedDate);
      window.removeEventListener('toggleAutoSpawn', onToggleAutoSpawn);
      window.removeEventListener('resetPlotPrep', onResetPlotPrep);
      window.removeEventListener('setAllPlotsX', onSetAllPlotsX);
      window.removeEventListener('skipTutorial', onSkipTutorial);
      window.removeEventListener('skipTime', onSkipTime);
      window.removeEventListener('skipCatTime', onSkipCatTime);
      window.removeEventListener('openCraftingFor', handleOpenCrafting);
    };
  }, [handleRemoveScarecrow, handleRemoveLadybug, handleRemoveSprinkler, handleRemoveUmbrella, loadCropsFromContract, cropArray, updatePlotPrep]);

  useEffect(() => {
    if (localStorage.getItem("pendingScarecrowPlacement") === "true") {
      localStorage.removeItem("pendingScarecrowPlacement");
      setPlacingScarecrowType('tier1');
      setIsPlacingScarecrow(true);
      setIsUsingPotion(false);
      setIsPlanting(false);
      setIsPlacingTesla(false);
      setIsFarmMenu(false); // Keep farm active so animations don't restart
      setTimeout(() => show("Select a white border to place your scarecrow!", "info"), 500);
    }
    
    if (localStorage.getItem("pendingLadybugPlacement") === "true") {
      localStorage.removeItem("pendingLadybugPlacement");
      setIsPlacingLadybug(true);
      setIsPlacingScarecrow(false);
      setIsPlacingSprinkler(false);
      setIsPlacingUmbrella(false);
      setIsUsingPotion(false);
      setIsPlanting(false);
      setIsFarmMenu(false); // Keep farm active
      setTimeout(() => show("Select a red border to place your ladybug!", "info"), 500);
    }
    
    if (localStorage.getItem("pendingSprinklerPlacement") === "true") {
      localStorage.removeItem("pendingSprinklerPlacement");
      setIsPlacingSprinkler(true);
      setIsPlacingScarecrow(false);
      setIsPlacingLadybug(false);
      setIsPlacingUmbrella(false);
      setIsUsingPotion(false);
      setIsPlanting(false);
      setIsFarmMenu(false);
      setTimeout(() => show("Select a blue border to place your sprinkler!", "info"), 500);
    }
    
    if (localStorage.getItem("pendingUmbrellaPlacement") === "true") {
      localStorage.removeItem("pendingUmbrellaPlacement");
      setIsPlacingUmbrella(true);
      setIsPlacingScarecrow(false);
      setIsPlacingLadybug(false);
      setIsPlacingSprinkler(false);
      setIsUsingPotion(false);
      setIsPlanting(false);
      setIsFarmMenu(false);
      setTimeout(() => show("Select a purple border to place your umbrella!", "info"), 500);
    }

    if (localStorage.getItem("pendingYarnPlacement") === "true") {
      localStorage.removeItem("pendingYarnPlacement");
      setYarnState({ active: true, phase: 'cursor', x: 960, y: 540, vx: 0, vy: 0, angle: 0, direction: 1 });
      setIsUsingPotion(false);
      setIsPlanting(false);
      setIsFarmMenu(false);
      
      const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
      sandboxLoot[9955] = Math.max(0, (sandboxLoot[9955] || 0) - 1);
      localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
      
      setTimeout(() => show("Click anywhere to place the yarn!", "info"), 500);
    }
  }, [show]);

  useEffect(() => {
    setPreviewUpdateKey(prev => prev + 1);
  }, [cropArray]);

  // Listen for potion usage events from inventory
  useEffect(() => {
    const handleStartPotionUsage = (event) => {
      const { id, name } = event.detail;
      
      const isScarecrowVariant = [ID_POTION_ITEMS.SCARECROW, 9979, 9978, 9977, 9976].includes(id);
      if (isScarecrowVariant) {
        if (id === ID_POTION_ITEMS.SCARECROW) setPlacingScarecrowType('tier1');
        else if (id === 9979) setPlacingScarecrowType('ladybug_scarecrow');
        else if (id === 9978) setPlacingScarecrowType('tier2');
        else if (id === 9977) setPlacingScarecrowType('tier3');
        else if (id === 9976) setPlacingScarecrowType('tier4');

        setIsPlacingScarecrow(true);
        setIsUsingPotion(false);
        setIsPlanting(false);
        setIsPlacingLadybug(false);
        setIsPlacingSprinkler(false);
        setIsPlacingUmbrella(false);
        setIsPlacingTesla(false);
        setIsFarmMenu(false); // Keep farm active so animations don't restart
        return;
      }
      
      if (id === 9975) { // Tesla Tower
        setIsPlacingTesla(true);
        setIsPlacingScarecrow(false);
        setIsPlacingLadybug(false);
        setIsPlacingSprinkler(false);
        setIsPlacingUmbrella(false);
        setIsUsingPotion(false);
        setIsPlanting(false);
        setIsFarmMenu(false);
        return;
      }
      
      if (id === ID_POTION_ITEMS.LADYBUG) {
        setIsPlacingLadybug(true);
        setIsPlacingScarecrow(false);
        setIsPlacingSprinkler(false);
        setIsPlacingUmbrella(false);
        setIsPlacingTesla(false);
        setIsUsingPotion(false);
        setIsPlanting(false);
        setIsFarmMenu(false); // Keep farm active
        return;
      }
      if (id === 9998) {
        setIsPlacingSprinkler(true);
        setIsPlacingScarecrow(false);
        setIsPlacingLadybug(false);
        setIsPlacingUmbrella(false);
        setIsPlacingTesla(false);
        setIsUsingPotion(false);
        setIsPlanting(false);
        setIsFarmMenu(false);
        return;
      }
      if (id === 9999) {
        setIsPlacingUmbrella(true);
        setIsPlacingScarecrow(false);
        setIsPlacingLadybug(false);
        setIsPlacingSprinkler(false);
        setIsPlacingTesla(false);
        setIsUsingPotion(false);
        setIsPlanting(false);
        setIsFarmMenu(false);
        return;
      }
      
      if (id === 9987) {
        setShowEasterBasket(true);
        setIsUsingPotion(false);
        setIsPlanting(false);
        setIsFarmMenu(false);
        return;
      }
      
      if (Number(id) === 9955) {
        setYarnState({ active: true, phase: 'cursor', x: 960, y: 540, vx: 0, vy: 0, angle: 0, direction: 1 });
        setIsUsingPotion(false);
        setIsPlanting(false);
        setIsFarmMenu(false);
        
        const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
        sandboxLoot[9955] = Math.max(0, (sandboxLoot[9955] || 0) - 1);
        localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
        if (refetch) refetch();
        
        show("Click anywhere to place the yarn!", "info");
        return;
      }

      setSelectedPotion({ id, name });
      setIsUsingPotion(true);
      setIsPlanting(false);
      setIsFarmMenu(true);
    };

    window.addEventListener('startPotionUsage', handleStartPotionUsage);
    
    return () => {
      window.removeEventListener('startPotionUsage', handleStartPotionUsage);
    };
  }, []);

  const getAvailableSeeds = useCallback(() => {
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    let seedsList = [...(currentSeeds || [])];

    if (allItems) {
      allItems.forEach(item => {
        const itemData = ALL_ITEMS[item.id];
        if (itemData?.category === ID_ITEM_CATEGORIES.SEED) {
          const localCount = sandboxLoot[item.id] || 0;
          if (localCount > 0) {
            const existing = seedsList.find(s => s.id === item.id);
            if (!existing) {
              seedsList.push({ ...item, count: localCount });
            } else {
              existing.count = Math.max(existing.count, localCount);
            }
          }
        }
      });
    }

    return seedsList
      .map((seed) => ({
        ...seed,
        count: Math.max(0, seed.count - (usedSeedsInPreview[seed.id] || 0)),
      }))
      .filter((seed) => seed.count > 0);
  }, [currentSeeds, allItems, usedSeedsInPreview]);

  const playPlantConfirmSound = useCallback(() => {
    if (!plantConfirmAudioRef.current) {
      plantConfirmAudioRef.current = new Audio("/sounds/FinalPlantConfirmButton.wav");
      plantConfirmAudioRef.current.preload = "auto";
    }
    const audio = plantConfirmAudioRef.current;
      const volumeSetting = parseFloat(settings?.soundVolume ?? defaultSettings.soundVolume) / 100;
      const volume = clampVolume(volumeSetting);
      if (volume <= 0) return;
      audio.volume = volume;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, [settings?.soundVolume]);

  useEffect(() => {
    if (waterEffects.length > 0) {
      const timer = setTimeout(() => {
        setWaterEffects(prev => prev.filter(e => Date.now() - e.time < 1000));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [waterEffects]);

  const playHarvestConfirmSound = useCallback(() => {
    if (!harvestConfirmAudioRef.current) {
      harvestConfirmAudioRef.current = new Audio("/sounds/FinalHarvestConfirmButton.wav");
      harvestConfirmAudioRef.current.preload = "auto";
    }
    const audio = harvestConfirmAudioRef.current;
    const volumeSetting = parseFloat(settings?.soundVolume ?? defaultSettings.soundVolume) / 100;
    const volume = clampVolume(volumeSetting);
    if (volume <= 0) return;
    audio.volume = volume;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, [settings?.soundVolume]);

  const playWaterSound = useCallback(() => {
    const audio = new Audio("/sounds/water.mp3");
    const volumeSetting = parseFloat(settings?.soundVolume ?? defaultSettings.soundVolume) / 100;
    const volume = clampVolume(volumeSetting);
    if (volume <= 0) return;
    audio.volume = volume;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, [settings?.soundVolume]);
  
  // Yarn mechanics loops
  useEffect(() => {
    if (!yarnState || !yarnState.active) return;
    let frameId;
    let lastTime = performance.now();
    const loop = (time) => {
      const dt = Math.max(1, Math.min(32, time - lastTime)); // Cap dt to avoid huge jumps
      lastTime = time;
      setYarnState(prev => {
        if (!prev || !prev.active) return prev;
        
        if (prev.phase === 'aiming') {
           let newAngle = (prev.angle || 0) + ((prev.direction || 1) * 0.18 * dt);
           let newDir = prev.direction || 1;
           if (newAngle > 75) { newAngle = 75; newDir = -1; }
           if (newAngle < -75) { newAngle = -75; newDir = 1; }
           return { ...prev, angle: newAngle, direction: newDir };
        }
        
        if (prev.phase === 'rolling') {
            let { x, y, vx, vy } = prev;
            if (Math.abs(vx) > 0.1 || Math.abs(vy) > 0.1) {
               x += vx;
               y += vy;
               vx *= 0.98;
               vy *= 0.98;
               
               if (x < 150) { x = 150; vx *= -0.8; }
               if (x > 1700) { x = 1700; vx *= -0.8; }
               if (y < 150) { y = 150; vy *= -0.8; }
               if (y > 900) { y = 900; vy *= -0.8; }
               return { ...prev, x, y, vx, vy };
            }
        }
        return prev;
      });
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [yarnState?.active]);

  useEffect(() => {
    if (!yarnState || !yarnState.active) return;
    const chaseInterval = setInterval(() => {
       setYarnState(currentYarn => {
          if (!currentYarn || currentYarn.phase !== 'rolling') return currentYarn;
          setCatPos(prev => {
             const dx = currentYarn.x - prev.left;
             const dy = currentYarn.y - prev.top;
             const dist = Math.hypot(dx, dy);

             if (dist < 60) {
                 let happy = parseFloat(localStorage.getItem('sandbox_cat_happiness') || '50');
                 happy = Math.min(100, happy + 40);
                 localStorage.setItem('sandbox_cat_happiness', happy.toString());
                 setCatHappiness(happy);

                 let hlth = parseFloat(localStorage.getItem('sandbox_cat_health') || '100');
                 hlth = Math.min(100, hlth + 20);
                 localStorage.setItem('sandbox_cat_health', hlth.toString());
                 setCatHealth(hlth);

                 show("Felix caught the yarn! Happiness +40%, Health +20%", "success");
                 
                 setTimeout(() => setYarnState(null), 10);
                 setCatState('sit');
                 return prev;
             }

             const speed = 25; 
             const moveX = (dx / dist) * speed;
             const moveY = (dy / dist) * speed;
             setCatState('walk');
             setCatDirection(moveX > 0 ? -1 : 1);
             return { left: prev.left + moveX, top: prev.top + moveY };
          });
          return currentYarn;
       });
    }, 50); 
    return () => clearInterval(chaseInterval);
  }, [yarnState?.active]);

  // Keep Farm updated with tutorial steps that progress outside of Farm
  useEffect(() => {
    const stepHandler = () => setTutorialStep(parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10));
    window.addEventListener('tutorialStepChanged', stepHandler);
    return () => window.removeEventListener('tutorialStepChanged', stepHandler);
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setMaxPlots(await getMaxPlots());
        await loadCropsFromContract();
      } catch (error) {
        const { message } = handleContractError(error, 'loading user data');
        console.error("Failed to load user data:", message);
      }
    };

    loadUserData();
  }, [loadCropsFromContract, getMaxPlots]);

  // Listen for crop refresh events (after planting)
  useEffect(() => {
    const handleCropsRefresh = async (event) => {
      console.log('Crops refresh event received:', event.detail);
      await loadCropsFromContract();
    };

    window.addEventListener('cropsRefreshed', handleCropsRefresh);
    
    return () => {
      window.removeEventListener('cropsRefreshed', handleCropsRefresh);
    };
  }, [loadCropsFromContract]);

  // Listen for bug interactions and destructions
  useEffect(() => {
    const handleTriggerDestroy = async (event) => {
      const { plotIndex } = event.detail;
      if (destroyCrop) {
        await destroyCrop(plotIndex);
        show(`Oh no! A bug ate your crop at plot ${plotIndex + 1}!`, "error");
        await loadCropsFromContract();
        setPreviewUpdateKey(prev => prev + 1);
      }
    };

    const handleSquashBug = (event) => {
      const { plotIndex } = event.detail;
      delete bugsRef.current[plotIndex];

      setCropArray(prev => {
        const newArr = new CropItemArrayClass(30);
        newArr.copyFrom(prev);
        const item = newArr.getItem(plotIndex);
        if (item) {
          item.bugCountdown = undefined;
          const wState = waterStateRef.current[plotIndex];
          if (wState) {
             const hasOtherPest = crowsRef.current[plotIndex] !== undefined;
             const isHalfway = wState.needsMid && (Date.now() - (wState.contractPlantedAt + (wState.pausedMs || 0))) >= (item.growthTime * 1000) / 2;
             item.needsWater = hasOtherPest || wState.needsInitial || isHalfway;
          }
        }
        return newArr;
      });
      show("Bug squashed!", "success");

      // After tutorial watering sequence: advance to tutPage 10 and spawn visual-only crow
      if (tutPostWaterRef.current) {
        tutPostWaterRef.current = false;
        setTutPageSync(10);
        setTimeout(() => {
          crowsRef.current[plotIndex] = 9999; // long countdown so it never harms crops
          setCropArray(prev => {
            const newArr = new CropItemArrayClass(30);
            newArr.copyFrom(prev);
            const item = newArr.getItem(plotIndex);
            if (item) item.crowCountdown = 9999;
            return newArr;
          });
        }, 1500);
      }
    };

    const handleScareCrow = (event) => {
      const { plotIndex } = event.detail;
      delete crowsRef.current[plotIndex];

      setCropArray(prev => {
        const newArr = new CropItemArrayClass(30);
        newArr.copyFrom(prev);
        const item = newArr.getItem(plotIndex);
        if (item) {
           item.crowCountdown = undefined;
           const wState = waterStateRef.current[plotIndex];
           if (wState) {
              const hasOtherPest = bugsRef.current[plotIndex] !== undefined;
              const isHalfway = wState.needsMid && (Date.now() - (wState.contractPlantedAt + (wState.pausedMs || 0))) >= (item.growthTime * 1000) / 2;
              item.needsWater = hasOtherPest || wState.needsInitial || isHalfway;
           }
        }
        return newArr;
      });
      show("Crow scared away!", "success");

    };

    window.addEventListener('triggerDestroyCrop', handleTriggerDestroy);
    window.addEventListener('squashBug', handleSquashBug);
    window.addEventListener('scareCrow', handleScareCrow);

    return () => {
      window.removeEventListener('triggerDestroyCrop', handleTriggerDestroy);
      window.removeEventListener('squashBug', handleSquashBug);
      window.removeEventListener('scareCrow', handleScareCrow);
    };
  }, [destroyCrop, loadCropsFromContract, show]);

  // Growth timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      // CAT TIMERS LOGIC
      const isWaterFilled = localStorage.getItem('sandbox_bowl_water') === 'true';
      const isFishFilled = localStorage.getItem('sandbox_bowl_fish') !== null;
      const fedTime = parseInt(localStorage.getItem('sandbox_cat_fed_time') || '0', 10);
      const starvingTime = parseInt(localStorage.getItem('sandbox_cat_starving_time') || '0', 10);
      
      if (fedTime > 0 && isWaterFilled && isFishFilled) {
        if (Date.now() - fedTime >= 12 * 60 * 60 * 1000) { // 12 Hours
          localStorage.removeItem('sandbox_bowl_water');
          localStorage.removeItem('sandbox_bowl_fish');
          localStorage.removeItem('sandbox_cat_fed_time');
          localStorage.setItem('sandbox_cat_starving_time', Date.now().toString());
          setBowlWaterFilled(false);
          setBowlFishId(null);
        }
      } else if (starvingTime > 0) {
        if (Date.now() - starvingTime >= 24 * 60 * 60 * 1000) { // 24 Hours
          localStorage.removeItem('sandbox_cat_starving_time');
        } else {
          const lastShake = parseInt(localStorage.getItem('sandbox_cat_last_shake') || starvingTime.toString(), 10);
          const fTimestamp = parseInt(localStorage.getItem('forest_last_visited') || '0', 10);
          const tStep = parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10);
          if (fTimestamp > 0 && tStep >= 4) {
            if (Date.now() - lastShake >= 60 * 60 * 1000) { // 1 Hour
              window.dispatchEvent(new CustomEvent('crazyCatShake'));
              localStorage.setItem('sandbox_cat_last_shake', Date.now().toString());
            }
          }
        }
      }

      // Only update growth when not in farm menu to prevent flickering during harvest selection
      if (!isFarmMenu) {
        // Lightning mechanic
        let currentWeather = getWeatherForDay(simulatedDateRef.current);
        const wOverride = localStorage.getItem('sandbox_weather_override');
        if (wOverride === 'sunny') currentWeather = '☀️';
        else if (wOverride === 'rain') currentWeather = '🌧️';
        else if (wOverride === 'storm') currentWeather = '⚡';

        const currentTutorialStep = parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10);
        // Check rain before tutorial override so rain always auto-waters crops
        const isRainingNow = currentWeather === '⚡' || currentWeather === '🌧️';
        if (currentTutorialStep < 32) currentWeather = null;
        if (currentWeather === '⚡') {
          // ~5% chance every 1.5 hours (5400 seconds)
          if (Math.random() < 0.00001) {
            const nowSeconds = Math.floor(Date.now() / 1000);
            
            let isTeslaProtected = false;
            for (const tExp of Object.values(teslaTowersRef.current)) {
               if (tExp > nowSeconds) {
                  isTeslaProtected = true;
                  break;
               }
            }
            
            if (isTeslaProtected) {
              window.dispatchEvent(new CustomEvent('showNotification', { detail: { msg: "⚡ Lightning struck, but your Tesla Tower safely grounded it!", type: "info" } }));
              return;
            }

            const activeScarecrows = Object.entries(scarecrowsRef.current).filter(([k,v]) => (typeof v === 'number' ? v : v.expiry) > nowSeconds);
            const activeLadybugs = Object.entries(ladybugsRef.current).filter(([k,v]) => v > nowSeconds);
            
            const total = activeScarecrows.length + activeLadybugs.length;
            if (total > 0) {
              const idx = Math.floor(Math.random() * total);
              if (idx < activeScarecrows.length) {
                handleRemoveScarecrow(activeScarecrows[idx][0]);
                show(`⚡ Lightning struck and destroyed a scarecrow!`, "error");
              } else {
                handleRemoveLadybug(activeLadybugs[idx - activeScarecrows.length][0]);
                show(`⚡ Lightning struck and destroyed a ladybug!`, "error");
              }
            }
          }
        }

        // Process bugs safely
        const currentBugs = { ...bugsRef.current };
        const currentCrows = { ...crowsRef.current };
        let cropsToDestroy = [];
        let pestsChanged = false;
        
        for (const idx in currentBugs) {
          if (currentBugs[idx] > 1) { // Cap bugs at 1 so they just pause and never destroy
            currentBugs[idx] -= 1;
            pestsChanged = true;
          }
        }
        for (const idx in currentCrows) {
          if (currentTutorialStep > 0 && currentTutorialStep < 32) {
            // During tutorial: freeze crow countdown so it never destroys the crop
            pestsChanged = true;
          } else {
            currentCrows[idx] -= 1;
            pestsChanged = true;
            if (currentCrows[idx] <= 0) {
              if (!cropsToDestroy.includes(Number(idx))) {
                cropsToDestroy.push(Number(idx));
              }
              delete currentCrows[idx];
            }
          }
        }
        bugsRef.current = currentBugs;
        crowsRef.current = currentCrows;

        const currentWaterState = waterStateRef.current;
        const now = Date.now();

        setCropArray((prevCropArray) => {
          let hasChanges = cropsToDestroy.length > 0 || pestsChanged;
          const newCropArray = new CropItemArrayClass(30);
          newCropArray.copyFrom(prevCropArray);
          
          const oldStatuses = [];
          for (let i = 0; i < 30; i++) {
             const item = prevCropArray.getItem(i);
             oldStatuses.push(item ? item.growStatus : null);
          }
          newCropArray.updateGrowth();
          for (let i = 0; i < 30; i++) {
             const newItem = newCropArray.getItem(i);
             if (newItem && newItem.growStatus !== oldStatuses[i]) {
                hasChanges = true;
             }
          }

          if (cropsToDestroy.length > 0) {
            cropsToDestroy.forEach(idx => {
              window.dispatchEvent(new CustomEvent('triggerDestroyCrop', { detail: { plotIndex: idx } }));
              // Instantly clear the crop on UI before the backend syncs
              const item = newCropArray.getItem(idx);
              if (item) {
                  item.seedId = 0n;
                  item.bugCountdown = undefined;
                  item.crowCountdown = undefined;
              }
              delete currentWaterState[idx];
            });
            localStorage.setItem('sandbox_water_state', JSON.stringify(currentWaterState));
          }
          
          // Randomly spawn pests
          for (let i = 0; i < 30; i++) {
            const item = newCropArray.getItem(i);
            if (item && item.seedId && item.seedId !== 0n && !cropsToDestroy.includes(i)) {
              let wState = currentWaterState[i];
              if (!wState) {
                wState = { needsInitial: true, needsMid: true, pausedMs: 0, contractPlantedAt: item.contractPlantedAt || item.plantedAt };
                currentWaterState[i] = wState;
                localStorage.setItem('sandbox_water_state', JSON.stringify(currentWaterState));
                hasChanges = true;
              }
              
              if (item.contractPlantedAt !== undefined && !isNaN(item.contractPlantedAt)) {
                wState.contractPlantedAt = item.contractPlantedAt;
                delete item.contractPlantedAt;
                hasChanges = true;
              } else if (wState.contractPlantedAt === undefined || isNaN(wState.contractPlantedAt)) {
                wState.contractPlantedAt = item.plantedAt || now;
                hasChanges = true;
              }
              if (isNaN(wState.pausedMs)) {
                 wState.pausedMs = 0;
                 hasChanges = true;
              }

              let basePlantedAt = wState.contractPlantedAt;
              let isPaused = false;
              const hasPest = bugsRef.current[i] !== undefined || crowsRef.current[i] !== undefined;

              if (wState.needsInitial) {
                isPaused = true;
                wState.pausedMs = now - basePlantedAt;
                hasChanges = true;
              } else if (wState.needsMid) {
                const elapsed = now - (basePlantedAt + wState.pausedMs);
                const halfTime = (item.growthTime * 1000) / 2;
                if (elapsed >= halfTime) {
                  isPaused = true;
                  wState.pausedMs = now - halfTime - basePlantedAt;
                  hasChanges = true;
                } else if (hasPest) {
                  isPaused = true;
                  wState.pausedMs += 1000; // Pause timer accumulation
                  hasChanges = true;
                }
              } else if (hasPest) {
                 isPaused = true;
                 wState.pausedMs += 1000; // Pause timer accumulation
                 hasChanges = true;
              }

              if (item.needsWater !== isPaused) {
                 item.needsWater = isPaused;
                 hasChanges = true;
              }
              const newPlantedAt = basePlantedAt + wState.pausedMs;
              if (item.plantedAt !== newPlantedAt) {
                 item.plantedAt = newPlantedAt;
                 hasChanges = true;
              }

              // Pest spawning logic
              const nowSec = Math.floor(Date.now() / 1000);
              
              let isProtectedFromCrows = false;
              let isProtectedFromBugs = false;
              let hasSprinkler = false;
              let hasUmbrella = false;
              for (const [spotId, protectedPlots] of Object.entries(protectedPlotsBySpot)) {
                // Check Advanced Scarecrow Protection Logic
                const sc = scarecrowsRef.current[spotId];
                if (sc) {
                  const exp = typeof sc === 'number' ? sc : sc.expiry;
                  const type = typeof sc === 'number' ? 'tier1' : sc.type;
                  
                  if (exp > nowSec) {
                    let protectsThisPlot = false;
                    if (type === 'tier4') protectsThisPlot = true;
                    else if (type === 'tier3') protectsThisPlot = Math.abs(i - protectedPlots[0]) <= 5; // Protects ~11 plots around it
                    else if (type === 'tier2') protectsThisPlot = Math.abs(i - protectedPlots[0]) <= 2; // Protects ~5 plots around it
                    else protectsThisPlot = protectedPlots.includes(i); // Tier 1 and Ladybug Scarecrow

                    if (protectsThisPlot) {
                      isProtectedFromCrows = true;
                      if (type === 'ladybug_scarecrow') isProtectedFromBugs = true;
                    }
                  }
                }
                
                // Check other protections
                if (protectedPlots.includes(i)) {
                  if (scarecrowsRef.current[spotId] > nowSec) isProtectedFromCrows = true;
                  if (ladybugsRef.current[spotId] > nowSec) isProtectedFromBugs = true;
                  if (sprinklersRef.current[spotId] > nowSec) hasSprinkler = true;
                  if (umbrellasRef.current[spotId] > nowSec) hasUmbrella = true;
                }
              }

              if (hasSprinkler || isRainingNow) {
                if (wState.needsInitial || wState.needsMid) {
                   wState.needsInitial = false;
                   wState.needsMid = false;
                   hasChanges = true;
                   localStorage.setItem('sandbox_water_state', JSON.stringify(currentWaterState));
                }
              }

              // Instantly clear existing crows if a scarecrow was just placed to protect this plot
              if (isProtectedFromCrows && crowsRef.current[i] !== undefined) {
                delete crowsRef.current[i];
                item.crowCountdown = undefined;
                hasChanges = true;
              }

              // Instantly clear existing bugs if a ladybug was just placed
              if (isProtectedFromBugs && bugsRef.current[i] !== undefined) {
                delete bugsRef.current[i];
                item.bugCountdown = undefined;
                hasChanges = true;
              }

              const tutPestsDone = localStorage.getItem('sandbox_tutorial_pests_done') === 'true';
              const tutStep = parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10);
              const inTutorial = tutStep > 0 && tutStep < 32;
              if (autoSpawnRef.current && bugsRef.current[i] === undefined && crowsRef.current[i] === undefined && !(inTutorial && tutPestsDone)) {
                const roll = Math.random();
                if (roll < 0.005) { // 0.5% chance per second for a crow
                  if (!isProtectedFromCrows && !inTutorial) {
                    crowsRef.current[i] = 30; // 30 seconds to click
                    item.crowCountdown = 30;
                    hasChanges = true;
                  }
                } else if (roll < 0.015) { // 1% chance per second for a bug
                  if (!inTutorial) {
                    bugsRef.current[i] = 60; // 60 seconds to click
                    item.bugCountdown = 60;
                    hasChanges = true;
                  }
                }
              }
              if (item.bugCountdown !== bugsRef.current[i] || item.crowCountdown !== crowsRef.current[i]) {
                 item.bugCountdown = bugsRef.current[i];
                 item.crowCountdown = crowsRef.current[i];
                 hasChanges = true;
              }
            } else {
              // Clean up if a crop was harvested legitimately
              if (bugsRef.current[i] !== undefined) {
                delete bugsRef.current[i];
                hasChanges = true;
              }
              if (crowsRef.current[i] !== undefined) {
                delete crowsRef.current[i];
                hasChanges = true;
              }
            }
          }
          return hasChanges ? newCropArray : prevCropArray;
        });
      }

      // Always update preview array growth, but only if we're in farm menu
      if (isFarmMenu) {
        setPreviewCropArray((prevPreviewCropArray) => {
          let hasChanges = false;
          const newPreviewCropArray = new CropItemArrayClass(30);
          newPreviewCropArray.copyFrom(prevPreviewCropArray);

          const oldStatuses = [];
          for (let i = 0; i < 30; i++) {
             const item = prevPreviewCropArray.getItem(i);
             oldStatuses.push(item ? item.growStatus : null);
          }
          newPreviewCropArray.updateGrowth();
          for (let i = 0; i < 30; i++) {
             const newItem = newPreviewCropArray.getItem(i);
             if (newItem && newItem.growStatus !== oldStatuses[i]) {
                hasChanges = true;
             }
          }

          // Sync preview array plantedAt with water state to pause preview correctly
          const currentWaterState = waterStateRef.current;
          for (let i = 0; i < 30; i++) {
            const item = newPreviewCropArray.getItem(i);
            if (item && item.seedId && item.seedId !== 0n) {
              const wState = currentWaterState[i];
              if (wState && wState.contractPlantedAt !== undefined && !isNaN(wState.contractPlantedAt)) {
                let pausedMs = isNaN(wState.pausedMs) ? 0 : wState.pausedMs;
                const newPlantedAt = wState.contractPlantedAt + pausedMs;
                if (item.plantedAt !== newPlantedAt) {
                   item.plantedAt = newPlantedAt;
                   hasChanges = true;
                }
                const isPaused = wState.needsInitial || (wState.needsMid && (Date.now() - item.plantedAt) >= (item.growthTime * 1000) / 2);
                if (item.needsWater !== isPaused) {
                   item.needsWater = isPaused;
                   hasChanges = true;
                }
              }
              
              if (item.bugCountdown !== bugsRef.current[i]) { item.bugCountdown = bugsRef.current[i]; hasChanges = true; }
              if (item.crowCountdown !== crowsRef.current[i]) { item.crowCountdown = crowsRef.current[i]; hasChanges = true; }
            }
          }

          return hasChanges ? newPreviewCropArray : prevPreviewCropArray;
        });
      }
    }, 1000); // Update every second

    setGrowthTimer(interval);
    return () => clearInterval(interval);
  }, [isFarmMenu]); // Add isFarmMenu as dependency

  const startPlanting = () => {
    // Check if userCrops are loaded before allowing planting mode
    if (!userCropsLoaded) {
      show("Please wait for your farm data to load before planting seeds.", "info");
      return;
    }

    // Check if user has unlocked farming plots
    if (maxPlots <= 0) {
      show("You need to level up to unlock farming plots!", "info");
      return;
    }

    if (!isFarmMenu) {
      setPreviewCropArray(cropArray);
      // Reset used seeds tracking when starting planting
      setUsedSeedsInPreview({});
    }
    setIsFarmMenu(true);
    setIsPlanting(true);
  };

  // Batch plant function - plant best seeds in all empty slots automatically
  const plantAll = useCallback(async () => {

    // Check if userCrops are loaded before allowing planting
    if (!userCropsLoaded) {
      show("Please wait for your farm data to load before planting seeds.", "info");
      return;
    }

    // Check if user has unlocked farming plots
    if (maxPlots <= 0) {
      show("You need to level up to unlock farming plots!", "info");
      return;
    }

    // Ensure farm menu is open to show preview
    if (!isFarmMenu) {
      setIsFarmMenu(true);
      setIsPlanting(true);
      // Reset used seeds tracking when opening farm menu
      setUsedSeedsInPreview({});
    }

    // Check if there are any empty plots available
    const occupiedPlots = [];
    const emptyPlotNumbers = [];
    for (let i = 0; i < maxPlots; i++) {
      const item = cropArray.getItem(i);
      if (item && (item.seedId === null || item.seedId === undefined || item.seedId === 0n)) {
        if (plotPrep[i]?.status === 3) {
          emptyPlotNumbers.push(i);
        }
      } else if (item && item.seedId) {
        occupiedPlots.push({
          plot: i,
          seedId: item.seedId,
          status: item.growStatus,
        });
      }
    }

    if (emptyPlotNumbers.length === 0) {
      show("No prepared dirt plots available! Click the red X to dig and place dirt.", "info");
      return;
    }

    const newWaterState = { ...waterStateRef.current };

    // Sort seeds by quality (best first): LEGENDARY > EPIC > RARE > UNCOMMON > COMMON
    const qualityOrder = {
      ID_RARE_TYPE_LEGENDARY: 5,
      ID_RARE_TYPE_EPIC: 4,
      ID_RARE_TYPE_RARE: 3,
      ID_RARE_TYPE_UNCOMMON: 2,
      ID_RARE_TYPE_COMMON: 1,
    };

    const sortedSeeds = (currentSeeds || [])
      .filter((seed) => seed.count > 0)
      .sort((a, b) => {
        const aQuality = qualityOrder[a.category] || 0;
        const bQuality = qualityOrder[b.category] || 0;
        if (aQuality !== bQuality) {
          return bQuality - aQuality; // Higher quality first
        }
        return (b.yield || 0) - (a.yield || 0); // Higher yield first for same quality
      });


    if (sortedSeeds.length === 0) {
      show("You don't have any seeds to plant!", "info");
      return;
    }

    // Plant seeds starting with the best quality
    const encodedIdsToPlant = [];
    const plantedSeedIds = [];
    for (const seed of sortedSeeds) {
      if (emptyPlotNumbers.length === 0) break;
      let countToPlant = Math.min(seed.count, emptyPlotNumbers.length);
      for (let i = 0; i < countToPlant; i++) {
          const plotIdx = emptyPlotNumbers.shift();
          const category = seed.id >> 8;
          const localId = seed.id & 0xFF;
          const subtype = getSubtype(seed.id);
          encodedIdsToPlant.push((plotIdx << 24) | (category << 16) | (subtype << 8) | localId);
          plantedSeedIds.push(seed.id);
          newWaterState[plotIdx] = { needsInitial: true, needsMid: tutorialStep >= 32, pausedMs: 0, contractPlantedAt: Date.now() };
      }
    }

    if (encodedIdsToPlant.length === 0) {
      show("No seeds were planted. All plots may already be occupied.", "info");
      return;
    }

    waterStateRef.current = newWaterState;
    localStorage.setItem('sandbox_water_state', JSON.stringify(newWaterState));

    playPlantConfirmSound();
    show(`Planting ${encodedIdsToPlant.length} seeds...`, "info");
    const result = await plantBatch(encodedIdsToPlant);
    if (result) {
        const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
        for (const sid of plantedSeedIds) {
            if (sandboxLoot[sid] > 0) sandboxLoot[sid] -= 1;
        }
        localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
        
        show(`✅ Successfully planted ${encodedIdsToPlant.length} seeds!`, "success");
        await loadCropsFromContract();
        if (typeof refetchSeeds === "function") refetchSeeds();
        setPreviewUpdateKey(prev => prev + 1);
        setIsFarmMenu(false);
    } else {
        show("❌ Failed to plant seeds.", "error");
    }
  }, [userCropsLoaded, maxPlots, isFarmMenu, cropArray, currentSeeds, show, plantBatch, loadCropsFromContract, refetchSeeds, playPlantConfirmSound]);

  const startHarvesting = () => {
    setPreviewCropArray(cropArray);
    setIsPlanting(false);
    setIsFarmMenu(true);
  };

  const startPotionUsage = (potionId, potionName) => {
    if (potionId === ID_POTION_ITEMS.SCARECROW) {
      setIsPlacingScarecrow(true);
      setIsPlacingTesla(false);
      setIsUsingPotion(false);
      setIsPlanting(false);
      setIsFarmMenu(false); // Keep farm active so animations don't restart
      show("Select a spot to place your scarecrow!", "info");
      return;
    }
    
    const isScarecrowVariant = [9979, 9978, 9977, 9976].includes(potionId);
    if (isScarecrowVariant) {
      if (potionId === 9979) setPlacingScarecrowType('ladybug_scarecrow');
      else if (potionId === 9978) setPlacingScarecrowType('tier2');
      else if (potionId === 9977) setPlacingScarecrowType('tier3');
      else if (potionId === 9976) setPlacingScarecrowType('tier4');

      setIsPlacingScarecrow(true);
      setIsUsingPotion(false);
      setIsPlanting(false);
      setIsPlacingLadybug(false);
      setIsPlacingSprinkler(false);
      setIsPlacingUmbrella(false);
      setIsPlacingTesla(false);
      setIsFarmMenu(false);
      show("Select a spot to place your advanced scarecrow!", "info");
      return;
    }
    
    if (potionId === 9975) {
      setIsPlacingTesla(true);
      setIsPlacingScarecrow(false);
      setIsPlacingLadybug(false);
      setIsPlacingSprinkler(false);
      setIsPlacingUmbrella(false);
      setIsPlacingTesla(false);
      setIsUsingPotion(false);
      setIsPlanting(false);
      setIsFarmMenu(false);
      show("Select a spot to place your Tesla Tower!", "info");
      return;
    }
    if (potionId === ID_POTION_ITEMS.LADYBUG) {
      setIsPlacingLadybug(true);
      setIsPlacingScarecrow(false);
      setIsPlacingSprinkler(false);
      setIsPlacingUmbrella(false);
      setIsPlacingTesla(false);
      setIsUsingPotion(false);
      setIsPlanting(false);
      setIsFarmMenu(false);
      show("Select a red border to place your ladybug!", "info");
      return;
    }
    if (potionId === 9998) {
      setIsPlacingSprinkler(true);
      setIsPlacingScarecrow(false);
      setIsPlacingLadybug(false);
      setIsPlacingUmbrella(false);
      setIsPlacingTesla(false);
      setIsUsingPotion(false);
      setIsPlanting(false);
      setIsFarmMenu(false);
      show("Select a blue border to place your sprinkler!", "info");
      return;
    }
    if (potionId === 9999) {
      setIsPlacingUmbrella(true);
      setIsPlacingScarecrow(false);
      setIsPlacingLadybug(false);
      setIsPlacingSprinkler(false);
      setIsPlacingTesla(false);
      setIsUsingPotion(false);
      setIsPlanting(false);
      setIsFarmMenu(false);
      show("Select a purple border to place your umbrella!", "info");
      return;
    }
    if (potionId === 9987) {
      setShowEasterBasket(true);
      setIsUsingPotion(false);
      setIsPlanting(false);
      setIsFarmMenu(false);
      return;
    }
    setSelectedPotion({ id: potionId, name: potionName });
    setIsUsingPotion(true);
    setIsPlanting(false);
    setIsFarmMenu(true);
  };

  const handlePlaceScarecrow = (spotId, type) => {
    let duration = 3; // default tier 1 and ladybug
    if (type === 'tier2') duration = 12;
    if (type === 'tier3') duration = 48; // 2 days
    if (type === 'tier4') duration = 120; // 5 days
    if (type === 'ladybug_scarecrow') duration = 4;

    const expiryTime = Math.floor(Date.now() / 1000) + duration * 60 * 60;
    const newScarecrows = { ...scarecrows, [spotId]: { expiry: expiryTime, type: type } };
    setScarecrows(newScarecrows);
    scarecrowsRef.current = newScarecrows;
    localStorage.setItem('sandbox_scarecrows', JSON.stringify(newScarecrows));
    show("Scarecrow placed to protect your crops!", "success");
    
    let friendlyName = type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    if (type === 'tier1') friendlyName = 'Scarecrow';
    
    show(`${friendlyName} placed to protect your crops!`, "success");
    setIsPlacingScarecrow(false);
    setIsFarmMenu(false);
    setIsPlanting(true);
    
    let itemId = ID_POTION_ITEMS.SCARECROW;
    if (type === 'tier2') itemId = 9978;
    if (type === 'tier3') itemId = 9977;
    if (type === 'tier4') itemId = 9976;
    if (type === 'ladybug_scarecrow') itemId = 9979;

    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    sandboxLoot[itemId] = Math.max(0, (sandboxLoot[itemId] || 0) - 1);
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    if (typeof refetchSeeds === "function") refetchSeeds();
  };

  const handlePlaceTesla = (spotId) => {
    const expiryTime = Math.floor(Date.now() / 1000) + 120 * 60 * 60; // 5 days
    const newTowers = { ...teslaTowers, [spotId]: expiryTime };
    setTeslaTowers(newTowers);
    teslaTowersRef.current = newTowers;
    localStorage.setItem('sandbox_tesla', JSON.stringify(newTowers));
    show("Tesla Tower placed to ground lightning!", "success");
    setIsPlacingTesla(false);
    setIsFarmMenu(false);
    setIsPlanting(true);
    
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    sandboxLoot[9975] = Math.max(0, (sandboxLoot[9975] || 0) - 1);
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    if (typeof refetchSeeds === "function") refetchSeeds();
  };

  const handlePlaceLadybug = (spotId) => {
    const expiryTime = Math.floor(Date.now() / 1000) + 3 * 60 * 60; // 3 hours
    const newLadybugs = { ...ladybugs, [spotId]: expiryTime };
    setLadybugs(newLadybugs);
    ladybugsRef.current = newLadybugs;
    localStorage.setItem('sandbox_ladybugs', JSON.stringify(newLadybugs));
    show("Ladybug placed to protect your crops!", "success");
    setIsPlacingLadybug(false);
    setIsFarmMenu(false);
    setIsPlanting(true);
    
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    sandboxLoot[ID_POTION_ITEMS.LADYBUG] = Math.max(0, (sandboxLoot[ID_POTION_ITEMS.LADYBUG] || 0) - 1);
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    if (typeof refetchSeeds === "function") refetchSeeds();
  };

  const handlePlaceSprinkler = (spotId) => {
    const expiryTime = Math.floor(Date.now() / 1000) + 2 * 60 * 60; // 2 hours
    const newSprinklers = { ...sprinklers, [spotId]: expiryTime };
    setSprinklers(newSprinklers);
    sprinklersRef.current = newSprinklers;
    localStorage.setItem('sandbox_sprinklers', JSON.stringify(newSprinklers));
    show("Water Sprinkler placed to auto-water crops!", "success");
    setIsPlacingSprinkler(false);
    setIsFarmMenu(false);
    setIsPlanting(true);
    
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    sandboxLoot[9998] = Math.max(0, (sandboxLoot[9998] || 0) - 1);
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    if (typeof refetchSeeds === "function") refetchSeeds();
  };

  const handlePlaceUmbrella = async (spotId) => {
    const expiryTime = Math.floor(Date.now() / 1000) + 2 * 60 * 60; // 2 hours
    const newUmbrellas = { ...umbrellas, [spotId]: expiryTime };
    setUmbrellas(newUmbrellas);
    umbrellasRef.current = newUmbrellas;
    localStorage.setItem('sandbox_umbrellas', JSON.stringify(newUmbrellas));
    show("Umbrella placed to protect crops from rain!", "success");
    setIsPlacingUmbrella(false);
    setIsFarmMenu(false);
    setIsPlanting(true);
    
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    sandboxLoot[9999] = Math.max(0, (sandboxLoot[9999] || 0) - 1);
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    if (typeof refetchSeeds === "function") refetchSeeds();

    await loadCropsFromContract();
  };

  const handleHarvestAll = async () => {
    try {
      const readySlots = [];
      let harvestedCarrot = false;
      const carrotSeed = (currentSeeds || []).find(s => s.label && s.label.toLowerCase().includes('carrot'));
      const currentTimeSeconds = Math.floor(Date.now() / 1000);

      let totalXpToAward = 0;

      for (let i = 0; i < cropArray.getLength(); i++) {
        const item = cropArray.getItem(i);
        if (item && item.seedId) {
          const endTime = Math.floor((item.plantedAt || 0) / 1000) + (item.growthTime || 0);
          const isReady = (item.growStatus === 2) || (currentTimeSeconds >= endTime);
          if (isReady) {
            readySlots.push(i);
            totalXpToAward += 10; // 10 Farming XP per crop
            if (carrotSeed && item.seedId.toString() === carrotSeed.id.toString()) harvestedCarrot = true;
          }
        }
      }

      if (readySlots.length === 0) {
        show("No crops are ready to harvest!", "info");
        return;
      }
      playHarvestConfirmSound();

      show(`Harvesting ${readySlots.length} ready crops...`, "info");

      let ok = false;
      try {
        if (readySlots.length > 1 && typeof harvestMany === "function") {
          const res = await harvestMany(readySlots);
          ok = !!res;
        } else if (readySlots.length === 1) {
          const res = await harvestMany(readySlots[0]);
          ok = !!res;
        } else {
          // Fallback if batch method is unavailable
          const res = await harvestMany(readySlots);
          ok = !!res;
        }
      } catch (error) {
        const { message } = handleContractError(error, 'harvesting crops');
        console.error("Failed to harvest crops:", message);
        show(`❌ ${message}`, "error");
      }

      if (!ok) {
        // show("❌ Failed to harvest crops. Please try again.", "error");
        return;
      }

      // Reload crops from contract to sync state
      // Small delay to ensure blockchain state is updated
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadCropsFromContract();
      if (typeof refetchSeeds === "function") refetchSeeds();
      
      // Force a re-render by updating the preview update key
      setPreviewUpdateKey(prev => prev + 1);

      // Award XP
      if (totalXpToAward > 0) {
        const currentFarmingXp = parseInt(localStorage.getItem('sandbox_farming_xp') || '0', 10);
        const oldLevel = getLevelFromXp(currentFarmingXp);
        const newFarmingXp = currentFarmingXp + totalXpToAward;
        localStorage.setItem('sandbox_farming_xp', newFarmingXp.toString());
        window.dispatchEvent(new CustomEvent('showNotification', { detail: { msg: `+${totalXpToAward} Farming XP!`, type: "info" } }));
        setFarmingXp(newFarmingXp);
        const newLevel = getLevelFromXp(newFarmingXp);
        if (newLevel > oldLevel) {
          window.dispatchEvent(new CustomEvent('levelUp', { detail: { skill: 'Farming', level: newLevel } }));
        }
      }

      // Track total crops and specific crop harvests for soil unlocks
      {
        const DRAGON_FRUIT_SEED_ID = (4 << 8) | 11;
        let dragonfruitCount = 0;
        for (let i = 0; i < cropArray.getLength(); i++) {
          const item = cropArray.getItem(i);
          if (item && item.seedId && readySlots.includes(i)) {
            const baseId = item.seedId & 0xFFF;
            if (baseId === DRAGON_FRUIT_SEED_ID) dragonfruitCount++;
          }
        }
        const prevTotal = parseInt(localStorage.getItem('sandbox_total_crops') || '0', 10);
        localStorage.setItem('sandbox_total_crops', (prevTotal + readySlots.length).toString());
        if (dragonfruitCount > 0) {
          const prevDragon = parseInt(localStorage.getItem('sandbox_dragonfruit_harvested') || '0', 10);
          localStorage.setItem('sandbox_dragonfruit_harvested', (prevDragon + dragonfruitCount).toString());
        }
        window.dispatchEvent(new CustomEvent('soilProgressChanged'));
      }

      show(`✅ Successfully harvested ${readySlots.length} crops!`, "success");
      // Clear any selection state after harvest all
      setSelectedIndexes([]);
      setIsFarmMenu(false);
      setIsPlanting(true);
      
      const skipped = JSON.parse(localStorage.getItem('sandbox_skipped_crops') || '{}');
      readySlots.forEach(idx => delete skipped[idx]);
      localStorage.setItem('sandbox_skipped_crops', JSON.stringify(skipped));

      // Reset water state for harvested crops
      const newWaterState = { ...waterStateRef.current };
      readySlots.forEach(idx => { delete newWaterState[idx]; });
      waterStateRef.current = newWaterState;
      localStorage.setItem('sandbox_water_state', JSON.stringify(newWaterState));

      // Reset plot prep to 0 (Red X) for harvested plots
      setPlotPrep(prev => {
        const next = { ...prev };
        readySlots.forEach(idx => { next[idx] = { status: 0 }; });
        localStorage.setItem('sandbox_plot_prep', JSON.stringify(next));
        window.dispatchEvent(new CustomEvent('plotPrepUpdated', { detail: next }));
        return next;
      });
      
      // Sync main crop array with latest growth data
      setCropArray((prevCropArray) => {
        const newCropArray = new CropItemArrayClass(30);
        newCropArray.copyFrom(prevCropArray);
        newCropArray.updateGrowth();
        return newCropArray;
      });
    } catch (error) {
      const { message } = handleContractError(error, 'harvesting all crops');
      console.error("Failed during Harvest All:", message);
      show(`❌ ${message}`, "error");
    }
  };

  const handlePlant = async () => {
    // Check if userCrops are loaded before allowing planting
    if (!userCropsLoaded) {
      show("Please wait for your farm data to load before planting seeds.", "info");
      return;
    }
    let loadingNotification = null;
    try {
      // Find all newly planted crops in preview (growStatus === -1)
      const cropsToPlant = [];
      for (let i = 0; i < previewCropArray.getLength(); i++) {
        const item = previewCropArray.getItem(i);
        if (item && item.growStatus === -1 && item.seedId) {
          cropsToPlant.push({
            seedId: item.seedId,
            plotNumber: i,
          });
        }
      }

      if (cropsToPlant.length === 0) {
        console.log("🚀 ~ handlePlant ~ selectedSeed:", selectedSeed)
        if (!selectedSeed) {
          show("Please select a seed first!", "info");
        } else {
          show(
            'No crops selected to plant. Please click on plots to plant seeds or use "Plant All".',
            "info"
          );
        }
        setIsFarmMenu(false);
        return;
      }
      // Show loading message that persists until transaction completes
      const loadingMessage =
        cropsToPlant.length === 1
          ? "Planting seed..."
          : `Planting ${cropsToPlant.length} seeds...`;
      playPlantConfirmSound();
      loadingNotification = show(loadingMessage, "info", 300000); // 5 minutes timeout

      // Batch plant
      const seedIds = cropsToPlant.map((crop) => {
        const numericSeedId = Number(crop.seedId);
        const category = numericSeedId >> 8;
        const id = numericSeedId & 0xFF;
        const subtype = getSubtype(numericSeedId);
        const plotId = crop.plotNumber;
        console.log("🚀 ~ handlePlant ~ plotId:", plotId, category, subtype, id)
        return (plotId << 24) | (category << 16) | (subtype << 8) | id
      });
      const result = await plantBatch(seedIds);
      if (result) {
        const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
        for (const crop of cropsToPlant) {
            const numericSeedId = Number(crop.seedId);
            if (sandboxLoot[numericSeedId] > 0) sandboxLoot[numericSeedId] -= 1;
        }
        localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
        
        const newWaterState = { ...waterStateRef.current };
        for (let i = 0; i < cropsToPlant.length; i++) {
          newWaterState[cropsToPlant[i].plotNumber] = { needsInitial: true, needsMid: tutorialStep >= 32, pausedMs: 0, contractPlantedAt: Date.now() };
        }
        waterStateRef.current = newWaterState;
        localStorage.setItem('sandbox_water_state', JSON.stringify(newWaterState));

        loadingNotification.dismiss();
        show(
          `✅ Successfully planted ${cropsToPlant.length} seeds!`,
          "success",
          3000 // 3 seconds timeout
        );
      } else {
        loadingNotification.dismiss();
        show("❌ Failed to plant seeds. Please try again.", "error", 3000);
        return;
      }

      // Update the main crop array immediately with planted crops before closing menu
      setCropArray((prevCropArray) => {
        const newCropArray = new CropItemArrayClass(30);
        newCropArray.copyFrom(prevCropArray);
        
        // Copy newly planted crops from preview to main array
        for (let i = 0; i < cropsToPlant.length; i++) {
          const cropToPlant = cropsToPlant[i];
          const previewItem = previewCropArray.getItem(cropToPlant.plotNumber);
          if (previewItem && previewItem.seedId) {
            const mainItem = newCropArray.getItem(cropToPlant.plotNumber);
            if (mainItem) {
              mainItem.seedId = previewItem.seedId;
              mainItem.plantedAt = previewItem.plantedAt;
              mainItem.growthTime = previewItem.growthTime;
              mainItem.growStatus = 1; // Mark as growing
            }
          }
        }
        
        return newCropArray;
      });

      // Reset any selection state after successful planting
      setSelectedIndexes([]);

      // Reload crops and seeds concurrently to reduce total wait time
      await Promise.all([
        loadCropsFromContract(),
          (async () => {
            try {
              if (typeof refetchSeeds === "function") {
                await refetchSeeds();
              }
            } catch (e) {
              // Failed to refetch seeds after planting
            }
          })(),
        ]);
        
      // Force a re-render by updating the preview update key
      setPreviewUpdateKey(prev => prev + 1);

      // Confirm planting in preview array (transition -1 to 1)
      setPreviewCropArray((prevPreviewCropArray) => {
        const newPreviewCropArray = new CropItemArrayClass(30);
        newPreviewCropArray.copyFrom(prevPreviewCropArray);
        newPreviewCropArray.confirmPlanting();
        return newPreviewCropArray;
      });

      // Reset used seeds tracking after successful planting
      setUsedSeedsInPreview({});

      // Reset planting state and close farm menu
      setIsPlanting(true); // Keep in planting mode for next time
      setIsFarmMenu(false); // Close the farm menu to show planted items
      
    } catch (error) {
      const { message } = handleContractError(error, 'planting crops');
      loadingNotification.dismiss();
      console.error("Failed to plant crops:", message);
      show(`❌ ${message}`, "error");
    }
  };

  const handleHarvest = async () => {
    if (!selectedIndexes || selectedIndexes.length === 0) {
      show("Please select crops to harvest first!", "info");
      return;
    }
    try {
      // Check which crops are actually ready to harvest
      const readyCrops = [];
      let harvestedCarrot = false;
      let totalXpToAward = 0;
      const carrotSeed = currentSeeds.find(s => s.label && s.label.toLowerCase().includes('carrot'));
      const currentTimeSec = Math.floor(Date.now() / 1000);

      for (const idx of selectedIndexes) {
        if (idx >= 0 && idx < cropArray.getLength()) {
          const item = cropArray.getItem(idx);
          const endTimeSec = Math.floor((item?.plantedAt || 0) / 1000) + (item?.growthTime || 0);
          const isActuallyReady = currentTimeSec >= endTimeSec;
          

          if (item && item.seedId && item.growStatus === 2 && isActuallyReady) {
            readyCrops.push(idx);
            totalXpToAward += 10;
            if (carrotSeed && item.seedId.toString() === carrotSeed.id.toString()) harvestedCarrot = true;
          }
        }
      }

      if (readyCrops.length === 0) {
        show(
          "No selected crops are ready to harvest! Make sure crops are fully grown.",
          "info"
        );
        return;
      }
      playHarvestConfirmSound();
      show(`Harvesting ${readyCrops.length} ready crops...`, "info");

      let successCount = 0;
      // Prefer batch harvest when multiple crops are ready
      const result = await harvestMany(readyCrops);
      if (result) {
        successCount = readyCrops.length;
      }
    
      // Small delay to ensure blockchain state is updated
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadCropsFromContract();
      if (typeof refetchSeeds === "function") refetchSeeds();
      
      // Force a re-render by updating the preview update key
      setPreviewUpdateKey(prev => prev + 1);

      if (successCount > 0) {
        // Award XP
        if (totalXpToAward > 0) {
          const currentFarmingXp = parseInt(localStorage.getItem('sandbox_farming_xp') || '0', 10);
          const newFarmingXp = currentFarmingXp + totalXpToAward;
          localStorage.setItem('sandbox_farming_xp', newFarmingXp.toString());
          window.dispatchEvent(new CustomEvent('showNotification', { detail: { msg: `+${totalXpToAward} Farming XP!`, type: "info" } }));
        }

        const ringExpiry = parseInt(localStorage.getItem('sandbox_ring_expiry') || '0', 10);
        if (ringExpiry > Date.now()) {
            const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
            const bonusItems = [ID_PRODUCE_ITEMS?.ONION || 131587, ID_PRODUCE_ITEMS?.POTATO || 131586, ID_PRODUCE_ITEMS?.CARROT || 131588, ID_PRODUCE_ITEMS?.TOMATO || 131589, ID_PRODUCE_ITEMS?.CORN || 131590];
            for (let i = 0; i < successCount; i++) {
                const r = bonusItems[Math.floor(Math.random() * bonusItems.length)];
                sandboxLoot[r] = (sandboxLoot[r] || 0) + 1;
            }
            localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
            show("✨ Magic Ring doubled your harvest yield!", "success");
        }

        if (harvestedCarrot && !localStorage.getItem('easter_purple_egg')) {
            localStorage.setItem('easter_purple_egg', 'true');
            const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
            sandboxLoot[9985] = (sandboxLoot[9985] || 0) + 1;
            sandboxLoot[9987] = 1;
            localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
            show("🐣 You unearthed the Purple Easter Egg!", "success");
        }

        // Track total crops and dragonfruit for soil unlocks
        {
          const DRAGON_FRUIT_SEED_ID = (4 << 8) | 11;
          let dragonfruitCount = 0;
          for (const idx of readyCrops) {
            const item = cropArray.getItem(idx);
            if (item && item.seedId && (item.seedId & 0xFFF) === DRAGON_FRUIT_SEED_ID) dragonfruitCount++;
          }
          const prevTotal = parseInt(localStorage.getItem('sandbox_total_crops') || '0', 10);
          localStorage.setItem('sandbox_total_crops', (prevTotal + successCount).toString());
          if (dragonfruitCount > 0) {
            const prevDragon = parseInt(localStorage.getItem('sandbox_dragonfruit_harvested') || '0', 10);
            localStorage.setItem('sandbox_dragonfruit_harvested', (prevDragon + dragonfruitCount).toString());
          }
          window.dispatchEvent(new CustomEvent('soilProgressChanged'));
        }

        show(`✅ Successfully harvested ${successCount} crops!`, "success");
        // Clear selection state after successful harvest
        setSelectedIndexes([]);
        setIsFarmMenu(false);
        setIsPlanting(true);
        
        // Reset water state for harvested crops
        const newWaterState = { ...waterStateRef.current };
        readyCrops.forEach(idx => { delete newWaterState[idx]; });
        waterStateRef.current = newWaterState;
        localStorage.setItem('sandbox_water_state', JSON.stringify(newWaterState));

        // Reset plot prep to 0 (Red X) for harvested crops
        setPlotPrep(prev => {
          const next = { ...prev };
          readyCrops.forEach(idx => { next[idx] = { status: 0 }; });
          localStorage.setItem('sandbox_plot_prep', JSON.stringify(next));
          window.dispatchEvent(new CustomEvent('plotPrepUpdated', { detail: next }));
          return next;
        });
        
        // Sync main crop array with latest growth data
        setCropArray((prevCropArray) => {
          const newCropArray = new CropItemArrayClass(30);
          newCropArray.copyFrom(prevCropArray);
          newCropArray.updateGrowth();
          return newCropArray;
        });
      } else {
        show("❌ Failed to harvest crops. Please try again.", "error");
        return;
      }
    } catch (error) {
      const { message } = handleContractError(error, 'harvesting crops');
      console.error("Failed to harvest crops:", message);
      show(`❌ ${message}`, "error");
    }
  };

  const handleInstantHarvest = async (index) => {
    try {
      playHarvestConfirmSound();
      show(`Harvesting crop...`, "info");

      const itemToHarvest = cropArray.getItem(index);
      const carrotSeed = (currentSeeds || []).find(s => s.label && s.label.toLowerCase().includes('carrot'));
      let wasCarrot = false;
      if (carrotSeed && itemToHarvest && itemToHarvest.seedId && itemToHarvest.seedId.toString() === carrotSeed.id.toString()) {
          wasCarrot = true;
      }

      const result = await harvestMany([index]);

      // Small delay to ensure blockchain state is updated
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadCropsFromContract();
      if (typeof refetchSeeds === "function") refetchSeeds();

      if (tutorialStep === 3 && tutPageRef.current === 11) {
        setTutPageSync(12);
      }

      // Force a re-render by updating the preview update key
      setPreviewUpdateKey(prev => prev + 1);

      if (result) {
        // Award XP
        const currentFarmingXp = parseInt(localStorage.getItem('sandbox_farming_xp') || '0', 10);
        const oldLevel = getLevelFromXp(currentFarmingXp);
        const newFarmingXp = currentFarmingXp + 10;
        localStorage.setItem('sandbox_farming_xp', newFarmingXp.toString());
        window.dispatchEvent(new CustomEvent('showNotification', { detail: { msg: `+10 Farming XP!`, type: "info" } }));
        setFarmingXp(newFarmingXp);
        const newLevel = getLevelFromXp(newFarmingXp);
        if (newLevel > oldLevel) {
          window.dispatchEvent(new CustomEvent('levelUp', { detail: { skill: 'Farming', level: newLevel } }));
        }

        const ringExpiry = parseInt(localStorage.getItem('sandbox_ring_expiry') || '0', 10);
        if (ringExpiry > Date.now()) {
            const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
            const bonusItems = [ID_PRODUCE_ITEMS?.ONION || 131587, ID_PRODUCE_ITEMS?.POTATO || 131586, ID_PRODUCE_ITEMS?.CARROT || 131588, ID_PRODUCE_ITEMS?.TOMATO || 131589, ID_PRODUCE_ITEMS?.CORN || 131590];
            const r = bonusItems[Math.floor(Math.random() * bonusItems.length)];
            sandboxLoot[r] = (sandboxLoot[r] || 0) + 1;
            localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
            show("✨ Magic Ring doubled your harvest yield!", "success");
        }

        if (wasCarrot && !localStorage.getItem('easter_purple_egg')) {
            localStorage.setItem('easter_purple_egg', 'true');
            const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
            sandboxLoot[9985] = (sandboxLoot[9985] || 0) + 1;
            sandboxLoot[9987] = 1;
            localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
            show("🐣 You unearthed the Purple Easter Egg!", "success");
        }
        show(`✅ Successfully harvested crop!`, "success");
        updatePlotPrep(index, { status: 0 });
        setSelectedIndexes([]);
        setIsFarmMenu(false);
        setIsPlanting(true);
        
        const skipped = JSON.parse(localStorage.getItem('sandbox_skipped_crops') || '{}');
        delete skipped[index];
        localStorage.setItem('sandbox_skipped_crops', JSON.stringify(skipped));
        
        // Reset water state
        const newWaterState = { ...waterStateRef.current };
        delete newWaterState[index];
        waterStateRef.current = newWaterState;
        localStorage.setItem('sandbox_water_state', JSON.stringify(newWaterState));

        // Sync main crop array with latest growth data
        setCropArray((prevCropArray) => {
          const newCropArray = new CropItemArrayClass(30);
          newCropArray.copyFrom(prevCropArray);
          newCropArray.updateGrowth();
          return newCropArray;
        });
      } else {
        show("❌ Failed to harvest crop. Please try again.", "error");
      }
    } catch (error) {
      const { message } = handleContractError(error, 'harvesting crop');
      console.error("Failed to harvest crop:", message);
      show(`❌ ${message}`, "error");
    }
  };

  // Worker Bee Auto-Harvest Logic
  useEffect(() => {
    if (workerBeeLevel <= 1 || farmingLoading) return;
    
    const beeTimer = setInterval(() => {
      const readySlots = [];
      const currentTimeSec = Math.floor(Date.now() / 1000);
      for (let i = 0; i < cropArray.getLength(); i++) {
        const item = cropArray.getItem(i);
        if (item && item.seedId) {
          const endTimeSec = Math.floor((item.plantedAt || 0) / 1000) + (item.growthTime || 0);
          if (item.growStatus === 2 || currentTimeSec >= endTimeSec) readySlots.push(i);
        }
      }

      if (readySlots.length > 0) {
        const chance = (workerBeeLevel - 1) * 0.15; // Lvl 2: 15%, Lvl 3: 30%, Lvl 4: 45%
        if (Math.random() < chance) {
          const targetPlot = readySlots[Math.floor(Math.random() * readySlots.length)];
          show(`🐝 Worker Bee auto-harvested plot ${targetPlot + 1}!`, "success");
          handleInstantHarvest(targetPlot);
        }
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(beeTimer);
  }, [workerBeeLevel, cropArray, farmingLoading]);

  const handleCancel = () => {
    setSelectedIndexes([]);
    setIsFarmMenu(false);
    setIsPlanting(true);
    setIsUsingPotion(false);
    setSelectedPotion(null);
    setIsPlacingScarecrow(false);
    setIsPlacingLadybug(false);
    setIsPlacingSprinkler(false);
    setIsPlacingUmbrella(false);
    setIsPlacingTesla(false);
    setIsWatering(false);
    setIsDigging(false);
    setIsHoeing(false);
    setIsDirting(false);
    setIsSeeding(false);
    // Reset used seeds tracking when canceling
    setUsedSeedsInPreview({});
    
    // Sync main crop array with latest growth data from preview
    setCropArray((prevCropArray) => {
      const newCropArray = new CropItemArrayClass(30);
      newCropArray.copyFrom(prevCropArray);
      newCropArray.updateGrowth();
      return newCropArray;
    });
  };

  const handlePotionUse = async () => {
    if (!selectedPotion) {
      show("No potion selected!", "error");
      return;
    }

    if (!selectedIndexes || selectedIndexes.length !== 1) {
      show("Please select exactly one crop to apply the potion!", "info");
      return;
    }

    try {
      let potionFunction = null;

      // Determine which potion function to use based on the BigInt ID
      const potionId = selectedPotion.id;
      if (potionId === ID_POTION_ITEMS.POTION_GROWTH_ELIXIR || 
          potionId === ID_POTION_ITEMS.POTION_GROWTH_ELIXIR_II || 
          potionId === ID_POTION_ITEMS.POTION_GROWTH_ELIXIR_III) {
        potionFunction = applyGrowthElixir;
      } else if (potionId === ID_POTION_ITEMS.POTION_PESTICIDE || 
                 potionId === ID_POTION_ITEMS.POTION_PESTICIDE_II || 
                 potionId === ID_POTION_ITEMS.POTION_PESTICIDE_III) {
        potionFunction = applyPesticide;
      } else if (potionId === ID_POTION_ITEMS.POTION_FERTILIZER || 
                 potionId === ID_POTION_ITEMS.POTION_FERTILIZER_II || 
                 potionId === ID_POTION_ITEMS.POTION_FERTILIZER_III) {
        potionFunction = applyFertilizer;
      }
      if (!potionFunction) {
        show("Invalid potion type!", "error");
        return;
      }

      const targetIndex = selectedIndexes[0];
      show(`Applying ${selectedPotion.name} to crop #${targetIndex + 1}...`, "info");

      const result = await potionFunction(targetIndex);

      if (result) {
        show(`✅ Successfully applied ${selectedPotion.name} to 1 crop!`, "success");
        
        // Reload crops from contract to show updated potion effects
        await new Promise(resolve => setTimeout(resolve, 1000));
        await loadCropsFromContract();
        
        // Force a re-render by updating the preview update key
        setPreviewUpdateKey(prev => prev + 1);
        
        // Clear any selection state after successful potion application
        setSelectedIndexes([]);
        setIsUsingPotion(false);
        setSelectedPotion(null);
        setIsFarmMenu(false);
        setIsPlanting(true);
      } else {
        show("❌ Failed to apply potion. Please try again.", "error");
      }
    } catch (error) {
      const { message } = handleContractError(error, 'applying potion');
      show(`❌ ${message}`, "error");
    }
  };

  const onClickCrop = (isShift, index) => {

    // Check if userCrops are loaded before allowing any plot interaction
    if (!userCropsLoaded) {
      show(
        "Please wait for your farm data to load before interacting with plots.",
        "info"
      );
      return;
    }

    // Check if user has unlocked farming plots
    if (maxPlots <= 0) {
      show("You need to level up to unlock farming plots!", "info");
      return;
    }

    if (isPlacingScarecrow || isPlacingLadybug || isPlacingSprinkler || isPlacingUmbrella || isPlacingTesla) {
      return; // Clicks handled by scarecrow spots overlay
    }

    if (isDigging) {
      const pStatus = plotPrep[index]?.status || 0;
      const fishId = plotPrep[index]?.fishId;
      const item = cropArray.getItem(index);

      const returnFishAndSeed = (seedIdToReturn) => {
        const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
        let returnedSomething = false;
        if (fishId) {
          sandboxLoot[fishId] = (sandboxLoot[fishId] || 0) + 1;
          returnedSomething = true;
        }
        if (seedIdToReturn) {
          sandboxLoot[seedIdToReturn.toString()] = (sandboxLoot[seedIdToReturn.toString()] || 0) + 1;
          returnedSomething = true;
        }
        if (returnedSomething) {
          localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
          if (typeof refetchSeeds === "function") refetchSeeds();
        }
      };

      if (item && item.seedId && item.seedId !== 0n) {
        returnFishAndSeed(item.seedId);
        show("Crop removed. Seed and fish returned!", "success");
        updatePlotPrep(index, { status: 1 });
        
        const skipped = JSON.parse(localStorage.getItem('sandbox_skipped_crops') || '{}');
        delete skipped[index];
        localStorage.setItem('sandbox_skipped_crops', JSON.stringify(skipped));

        if (destroyCrop) {
          destroyCrop(index).then(() => {
            loadCropsFromContract();
          });
        }
        setCropArray(prev => {
          const newArr = new CropItemArrayClass(30);
          newArr.copyFrom(prev);
          const target = newArr.getItem(index);
          if (target) {
            target.seedId = 0n;
            target.bugCountdown = undefined;
            target.crowCountdown = undefined;
          }
          return newArr;
        });
        playPlantConfirmSound();
      } else if (pStatus === 3) {
        returnFishAndSeed(null);
        updatePlotPrep(index, { status: 1 });
        if (fishId) show("Dirt removed. Fish returned!", "success");
        playPlantConfirmSound();
      } else if (pStatus === 0) {
        if (tutorialStep === 3) {
          const existingHoles = Object.values(plotPrep).filter(p => p.status === 1 || p.status === 3).length;
          if (existingHoles >= 1) {
            show("Dig just one hole for now!", "info");
            return;
          }
        }
        playPlantConfirmSound();
        updatePlotPrep(index, { status: 1 });
        if (tutorialStep === 3 && tutPage < 6) {
          setTutPageSync(6);
        }
      } else {
        show("It's already a hole!", "info");
      }
      return;
    }

    if (isHoeing) {
      show("Click directly on a placed item to remove it!", "info");
      return;
    }



    if (isWatering) {
      const item = cropArray.getItem(index);
      if (item && item.needsWater) {
        const wState = waterStateRef.current[index];
        if (wState) {
          if (wState.needsInitial) wState.needsInitial = false;
          else if (wState.needsMid) wState.needsMid = false;
          waterStateRef.current = { ...waterStateRef.current };
          localStorage.setItem('sandbox_water_state', JSON.stringify(waterStateRef.current));
          setWaterEffects(prev => [...prev, { id: Date.now() + Math.random(), index, time: Date.now() }]);
        }
        playWaterSound();
        if (tutorialStep === 3 && tutPage === 8) {
          const plotIdx = tutWaterPlotRef.current !== null ? tutWaterPlotRef.current : index;
          setTutPageSync(9);
          setSelectedTool(null);
          setIsWatering(false);
          tutPostWaterRef.current = true;
          setTimeout(() => {
            bugsRef.current[plotIdx] = 60;
            setCropArray(prev => {
              const newArr = new CropItemArrayClass(30);
              newArr.copyFrom(prev);
              const item = newArr.getItem(plotIdx);
              if (item) item.bugCountdown = 60;
              return newArr;
            });
          }, 1000);
        }

      } else {
        show("This plot doesn't need water right now.", "info");
      }
      return;
    }

    if (isUsingPotion) {
      // Potion usage mode - allow selection of exactly one growing crop
      const plotData = cropArray.getItem(index);
      if (!plotData || !plotData.seedId) {
        show("This plot is empty. Potions can only be used on growing crops.", "info");
        return;
      }

      // Check if the crop is still growing (growStatus === 1) or ready to harvest (growStatus === 2)
      if (plotData.growStatus === 2) {
        show("This crop is ready to harvest. Potions can only be used on growing crops.", "info");
        return;
      }

      if (plotData.growStatus !== 1) {
        show("This crop is not growing. Potions can only be used on actively growing crops.", "info");
        return;
      }

      // Single-select behavior: selecting a new crop replaces previous selection
      setSelectedIndexes((prev) => (prev.length === 1 && prev[0] === index ? [] : [index]));
      return;
    }

    // --- INSTANT HARVEST CHECK ---
    const plotData = cropArray.getItem(index);
    if (plotData && plotData.seedId && plotData.seedId !== 0n) {
      const nowSec = Math.floor(Date.now() / 1000);
      const endTime = Math.floor((plotData.plantedAt || 0) / 1000) + (plotData.growthTime || 0);
      const isReady = (plotData.growStatus === 2) || (nowSec >= endTime);

      if (tutorialStep === 3 && tutPage === 11) {
        if (isReady) {
          if (farmingLoading) return;
          handleInstantHarvest(index);
        } else {
          setTutGemPlotIndex(index);
          setTutGemPopupOpen(true);
        }
        return;
      }

      if (isReady) {
        if (farmingLoading) return; // Prevent spam clicking
        handleInstantHarvest(index);
        return;
      } else {
        if (tutorialStep >= 32) setSkipGrowTarget(index);
        return;
      }
    }

    // EMPTY PLOT PREP LOGIC
    const pStatus = plotPrep[index]?.status || 0;

    if (isDirting) {
      if (pStatus === 1 || pStatus === 2) {
        updatePlotPrep(index, { ...plotPrep[index], status: 3 });
        playPlantConfirmSound();
        if (tutorialStep === 3 && tutPage < 7) {
          setTutPageSync(7);
        }
      } else {
        show("You can only place dirt in a hole!", "info");
      }
      return;
    }

    if (isSeeding) {
      if (pStatus === 3) {
        // Ready to plant! Require Shift for quick-plant; otherwise open the seed dialog
        if (selectedSeed && isShift) {
          const availableSeeds = getAvailableSeeds();
          const selectedAvailable = availableSeeds.find((s) => s.id === selectedSeed);
          if (!selectedAvailable || selectedAvailable.count <= 0) {
            setSelectedSeed(null);
            setCurrentFieldIndex(index);
            setIsSelectCropDialog(true);
            return;
          }
          handleClickSeedFromDialog(selectedSeed, index);
          return;
        }
        if (selectedSeed === 9998) {
          setIsPlacingSprinkler(true);
          setIsPlacingScarecrow(false);
          setIsPlacingLadybug(false);
          setIsPlacingTesla(false);
          setIsPlacingUmbrella(false);
          setIsUsingPotion(false);
          setIsPlanting(false);
          setIsFarmMenu(false);
          return;
        }
        if (selectedSeed === 9999) {
          setIsPlacingUmbrella(true);
          setIsPlacingScarecrow(false);
          setIsPlacingLadybug(false);
          setIsPlacingTesla(false);
          setIsPlacingSprinkler(false);
          setIsUsingPotion(false);
          setIsPlanting(false);
          setIsFarmMenu(false);
          return;
        }
    
        // Open selection dialog when Shift not held or no seed selected
        setCurrentFieldIndex(index);
        setIsSelectCropDialog(true);
      } else {
        show("You can only plant seeds in prepared dirt!", "info");
      }
      return;
    }

    if (pStatus === 0) {
      show("Equip your shovel to dig a hole!", "info");
      return;
    } else if (pStatus === 1 || pStatus === 2) {
      setPrepDialogTarget(index);
      return;
    } else if (pStatus === 3) {
      show("Select the Seed Bag tool to plant a seed!", "info");
      return;
    }
  };

  const handleClickSeedFromDialog = async (id, fieldIndex) => {
    // Remember the selected seed so Shift+click can reuse it across plots
    setSelectedSeed(id);
    setIsSelectCropDialog(false);
    const idx = typeof fieldIndex === "number" ? fieldIndex : currentFieldIndex;
    if (idx < 0) {
      return;
    }

    // Ensure plot is empty before proceeding (UI guard)
    const existing = cropArray.getItem(idx);
    if (existing && existing.seedId && existing.seedId !== 0n) {
      show(`Plot ${idx} is already occupied.`, "error");
      return;
    }

    // Check if seed is available considering used seeds in preview
    const availableSeeds = getAvailableSeeds();
    let seed = availableSeeds.find((s) => s.id === id);
    if (!seed && (id === 9998 || id === 9999)) {
      seed = allItems.find((s) => s.id === id);
    }
    if (!seed || seed.count <= 0) {
      show("You don't have any more items of this type available!", "info");
      return;
    }
    if (id === 9998) {
      setIsPlacingSprinkler(true);
      setIsPlacingScarecrow(false);
      setIsPlacingLadybug(false);
      setIsPlacingUmbrella(false);
      setIsPlacingTesla(false);
      setIsUsingPotion(false);
      setIsPlanting(false);
      setIsFarmMenu(false);
      show("Select a spot to place your sprinkler!", "info");
      return;
    }
    if (id === 9975) {
      setIsPlacingTesla(true);
      setIsPlacingScarecrow(false);
      setIsPlacingLadybug(false);
      setIsPlacingUmbrella(false);
      setIsPlacingSprinkler(false);
      setIsPlacingTesla(false);
      setIsUsingPotion(false);
      setIsPlanting(false);
      setIsFarmMenu(false);
      show("Select a spot to place your Tesla Tower!", "info");
      return;
    }
    if (id === 9999) {
      setIsPlacingUmbrella(true);
      setIsPlacingScarecrow(false);
      setIsPlacingLadybug(false);
      setIsPlacingSprinkler(false);
      setIsPlacingTesla(false);
      setIsUsingPotion(false);
      setIsPlanting(false);
      setIsFarmMenu(false);
      show("Select a spot to place your umbrella!", "info");
      return;
    }

    // --- INSTANT PLANT HACK ---
    const category = id >> 8;
    const localId = id & 0xFF;
    const subtype = getSubtype(id);
    const encodedId = (idx << 24) | (category << 16) | (subtype << 8) | localId;
    
    playPlantConfirmSound();
    const result = await plantBatch([encodedId]);
    if (result) {
        const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
        if (sandboxLoot[id] > 0) sandboxLoot[id] -= 1;
        localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
        
        const newWaterState = { ...waterStateRef.current };
        newWaterState[idx] = { needsInitial: true, needsMid: tutorialStep >= 32, pausedMs: 0, contractPlantedAt: Date.now() };
        waterStateRef.current = newWaterState;
        localStorage.setItem('sandbox_water_state', JSON.stringify(newWaterState));

        show("✅ Seed planted!", "success");
        if (tutorialStep === 3 && tutPage === 7) {
          setTutPageSync(8);
          tutWaterPlotRef.current = idx;
        }
        await loadCropsFromContract();
        if (typeof refetchSeeds === "function") refetchSeeds();
        setPreviewUpdateKey(prev => prev + 1);
        setIsFarmMenu(false);
    } else {
        show("❌ Failed to plant seed.", "error");
    }
  };

  const SHARED_SPOTS_CONFIG = [
    { index: 1, offsetX: 0, offsetY: 196 },     // New Spot 1
    { index: 2, offsetX: -30, offsetY: 40 },  // Spot 2
    { index: 3, offsetX: 16, offsetY: 143 },  // Spot 3
    { index: 10, offsetX: 60, offsetY: 40 },  // Spot 10
    { index: 11, offsetX: 80, offsetY: -10 }, // Between plot 12 and 13
    { index: 4, offsetX: 83, offsetY: 94 },     // New Spot 4
    { index: 5, offsetX: -40, offsetY: 92 },    // New Spot 5
    { index: 6, offsetX: 25, offsetY: 145 },       // New Spot 6
    { index: 7, offsetX: 10, offsetY: 145 },       // New Spot 7
    { index: 8, offsetX: 105, offsetY: 197 }        // New Spot 8
  ];

  const dialogs = [
    {
      id: ID_FARM_HOTSPOTS.DEX,
      component: FarmerDialog,
      label: "FARMER",
      header: "/images/dialog/modal-header-gardner.png",
      actions: {
        plant: startPlanting,
        plantAll: plantAll,
        harvest: startHarvesting,
        harvestAll: handleHarvestAll,
        usePotion: startPotionUsage,
      },
    },
  ];

  const bees = tutorialStep < 32 ? [] : FARM_BEES;
  return (
    <div className={isCatShaking ? "shake-screen" : ""}>
      <style>{`
        @keyframes crazyCatShake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          10%, 30%, 50%, 70%, 90% { transform: translate(-10px, -5px) rotate(-1deg); }
          20%, 40%, 60%, 80% { transform: translate(10px, 5px) rotate(1deg); }
        }
        .shake-screen {
          animation: crazyCatShake 0.5s ease-in-out 3;
        }
      `}</style>
      
      {isCatShaking && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100vw', height: '100vh',
          zIndex: 999999,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          pointerEvents: 'none',
          backgroundColor: 'rgba(255, 0, 0, 0.3)'
        }}>
          <img src="/images/pets/catangry.png" alt="Angry Cat" style={{
            width: '90vw', height: '90vh', objectFit: 'contain',
            animation: 'zoomIn 0.3s ease-out', filter: 'drop-shadow(0 0 20px red)'
          }} />
          <style>{`
            @keyframes zoomIn {
              from { transform: scale(0.5); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
          `}</style>
        </div>
      )}

      {tutorialStep >= 11 && <WeatherOverlay />}
      

      {/* Farming Level Banner - Top Right */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 100, pointerEvents: 'none', display: 'inline-flex', flexDirection: 'column', alignItems: 'stretch' }}>
        <div style={{ position: 'relative', display: 'flex' }}>
          <img src="/images/label/farmerlevellabel.png" style={{ height: '92px', objectFit: 'contain', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: '113px', paddingBottom: '18px' }}>
            <span style={{ fontFamily: 'Cartoonist', fontSize: '32px', color: '#fff', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000', whiteSpace: 'nowrap' }}>LEVEL {farmingLevel}</span>
          </div>
        </div>
        {/* XP Progress Bar */}
        <div style={{ height: '12px', background: 'rgba(0,0,0,0.55)', borderRadius: '0 0 8px 8px', overflow: 'hidden', border: '2px solid rgba(0,0,0,0.35)', borderTop: 'none' }}>
          <div style={{ width: `${Math.min(farmingProgress, 100)}%`, height: '100%', background: 'linear-gradient(90deg, #4caf50, #8bc34a)', transition: 'width 0.5s ease' }} />
        </div>
        <div style={{ textAlign: 'center', fontFamily: 'Cartoonist', fontSize: '11px', color: '#fff', textShadow: '1px 1px 0 #000, -1px -1px 0 #000', marginTop: '3px' }}>
          {Math.round(farmingProgress)}% to Lv.{farmingLevel + 1}
        </div>
      </div>

      {/* Farming Board Overlay */}


      <PanZoomViewport
        backgroundSrc="/images/backgrounds/realfarm.png"
        hotspots={tutorialStep >= 32 ? hotspots : []}
        width={width}
        height={height}
        dialogs={dialogs}
        hideMenu={isFarmMenu}
        bees={bees}
        initialScale={1.0}
        backgroundOffsetX={40}
        backgroundOffsetY={-40}
        disablePanZoom
        onHotspotClick={(hotspotId) => {
          if (hotspotId === ID_FARM_HOTSPOTS.FARMER) { setShowMissionBoard(true); return true; }
          return false;
        }}
        onBeeClick={() => setShowFarmCustomize(true)}
      >
        {/* Shovel only on tutp5 with yellow highlight */}
        {tutorialStep === 3 && tutPage === 5 && (
        <img
          src="/images/farming/realshovel.png"
          alt="Shovel"
          draggable={false}
          onClick={() => { toggleTool('shovel'); const next = selectedTool !== 'shovel'; setIsDigging(next); setIsHoeing(false); setIsWatering(false); setIsDirting(false); setIsSeeding(false); setIsPlanting(false); }}
          style={{
            position: 'absolute',
            top: '650px',
            left: '555px',
            width: '30px',
            zIndex: 6,
            cursor: 'pointer',
            filter: selectedTool === 'shovel' ? 'drop-shadow(0px 0px 6px rgba(255,255,255,0.8))' : 'drop-shadow(0px 0px 10px yellow) drop-shadow(0px 0px 20px yellow)',
            transform: selectedTool === 'shovel' ? 'translateY(-15px)' : 'none',
            transition: 'transform 0.4s ease, filter 0.2s ease',
            animation: selectedTool === 'shovel' ? 'mapFloat 2s ease-in-out infinite' : 'none',
          }}
        />
        )}
        {/* Seeds only on tutp7 with yellow highlight */}
        {tutorialStep === 3 && tutPage === 7 && (
        <img
          src="/images/farming/realseeds.png"
          alt="Seeds"
          draggable={false}
          onClick={() => { toggleTool('seeds'); const next = selectedTool !== 'seeds'; setIsSeeding(next); setIsDirting(false); setIsHoeing(false); setIsWatering(false); setIsDigging(false); setIsPlanting(false); }}
          style={{
            position: 'absolute',
            top: '637px',
            left: '709px',
            width: '43px',
            zIndex: 6,
            cursor: 'pointer',
            filter: selectedTool === 'seeds' ? 'drop-shadow(0px 0px 6px rgba(255,255,255,0.8))' : 'drop-shadow(0px 0px 10px yellow) drop-shadow(0px 0px 20px yellow)',
            transform: selectedTool === 'seeds' ? 'translateY(-15px)' : 'none',
            transition: 'transform 0.4s ease, filter 0.2s ease',
            animation: selectedTool === 'seeds' ? 'mapFloat 2s ease-in-out infinite' : 'none',
          }}
        />
        )}
        {/* Watercan only on tutp8 (same image as tutp7) with yellow highlight */}
        {tutorialStep === 3 && tutPage === 8 && (
        <img
          src="/images/farming/realbucket.png"
          alt="Watering Can"
          draggable={false}
          onClick={() => { toggleTool('bucket'); const next = selectedTool !== 'bucket'; setIsWatering(next); setIsHoeing(false); setIsDigging(false); setIsDirting(false); setIsSeeding(false); setIsPlanting(false); }}
          style={{
            position: 'absolute',
            top: '638px',
            left: '785px',
            width: '63px',
            zIndex: 6,
            cursor: 'pointer',
            filter: selectedTool === 'bucket' ? 'drop-shadow(0px 0px 6px rgba(255,255,255,0.8))' : 'drop-shadow(0px 0px 10px yellow) drop-shadow(0px 0px 20px yellow)',
            transform: selectedTool === 'bucket' ? 'translateY(-15px)' : 'none',
            transition: 'transform 0.4s ease, filter 0.2s ease',
            animation: selectedTool === 'bucket' ? 'mapFloat 2s ease-in-out infinite' : 'none',
          }}
        />
        )}
        {/* Soil only on tutp6 with yellow highlight */}
        {tutorialStep === 3 && tutPage === 6 && (
        <img
          src="/images/farming/realsoil.png"
          alt="Soil"
          draggable={false}
          onClick={() => { toggleTool('soil'); const next = selectedTool !== 'soil'; setIsDirting(next); setIsHoeing(false); setIsWatering(false); setIsDigging(false); setIsSeeding(false); setIsPlanting(false); }}
          style={{
            position: 'absolute',
            top: '638px',
            left: '618px',
            width: '52px',
            zIndex: 6,
            cursor: 'pointer',
            filter: selectedTool === 'soil' ? 'drop-shadow(0px 0px 6px rgba(255,255,255,0.8))' : 'drop-shadow(0px 0px 10px yellow) drop-shadow(0px 0px 20px yellow)',
            transform: selectedTool === 'soil' ? 'translateY(-15px)' : 'none',
            transition: 'transform 0.4s ease, filter 0.2s ease',
            animation: selectedTool === 'soil' ? 'mapFloat 2s ease-in-out infinite' : 'none',
          }}
        />
        )}
        {(tutorialStep >= 32 || (tutorialStep === 3 && tutPage >= 4)) && (<>
        {/* Belt Top */}
        <img src="/images/farming/realbelttop.png" alt="Belt Top" style={{ position: 'absolute', top: '655px', left: '542px', width: '376px', pointerEvents: 'none', zIndex: 7 }} draggable={false} />
        {/* Belt Bottom */}
        <img src="/images/farming/realbeltbottom.png" alt="Belt Bottom" style={{ position: 'absolute', top: '630px', left: '450px', width: '560px', pointerEvents: 'none', zIndex: 5 }} draggable={false} />
        </>)}
        {/* Farm Tool Items - visible from step 32 or during bug/crow tutorial phase */}
        {(tutorialStep >= 32 || (tutorialStep === 3 && tutPage >= 9)) && (<>
        <img
          src="/images/farming/realfork.png"
          alt="Fork"
          draggable={false}
          onMouseEnter={(e) => {
            e.currentTarget.style.filter = 'drop-shadow(0px 0px 6px rgba(255,255,255,0.8))';
            e.currentTarget.style.transform = 'scale(1.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = selectedTool === 'fork' ? 'drop-shadow(0px 0px 6px rgba(255,255,255,0.8))' : 'none';
            e.currentTarget.style.transform = selectedTool === 'fork' ? 'translateY(-15px)' : 'none';
          }}
          onClick={() => { toggleTool('fork'); const next = selectedTool !== 'fork'; setIsHoeing(next); setIsWatering(false); setIsDigging(false); setIsDirting(false); setIsSeeding(false); setIsPlanting(false); }}
          style={{
            position: 'absolute',
            top: '648px',
            left: '874px',
            width: '28px',
            zIndex: 6,
            cursor: 'pointer',
            transform: selectedTool === 'fork' ? 'translateY(-15px)' : 'none',
            filter: selectedTool === 'fork' ? 'drop-shadow(0px 0px 6px rgba(255,255,255,0.8))' : 'none',
            transition: 'transform 0.4s ease, filter 0.2s ease',
            animation: selectedTool === 'fork' ? 'mapFloat 2s ease-in-out infinite' : 'none',
          }}
        />
        <img
          src="/images/farming/realsoil.png"
          alt="Soil"
          draggable={false}
          onMouseEnter={(e) => {
            e.currentTarget.style.filter = 'drop-shadow(0px 0px 6px rgba(255,255,255,0.8))';
            e.currentTarget.style.transform = 'scale(1.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = selectedTool === 'soil' ? 'drop-shadow(0px 0px 6px rgba(255,255,255,0.8))' : 'none';
            e.currentTarget.style.transform = selectedTool === 'soil' ? 'translateY(-15px)' : 'none';
          }}
          onClick={() => { toggleTool('soil'); const next = selectedTool !== 'soil'; setIsDirting(next); setIsHoeing(false); setIsWatering(false); setIsDigging(false); setIsSeeding(false); setIsPlanting(false); }}
          style={{
            position: 'absolute',
            top: '638px',
            left: '618px',
            width: '52px',
            zIndex: 6,
            cursor: 'pointer',
            transform: selectedTool === 'soil' ? 'translateY(-15px)' : 'none',
            filter: selectedTool === 'soil' ? 'drop-shadow(0px 0px 6px rgba(255,255,255,0.8))' : 'none',
            transition: 'transform 0.4s ease, filter 0.2s ease',
            animation: selectedTool === 'soil' ? 'mapFloat 2s ease-in-out infinite' : 'none',
          }}
        />
        <img
          src="/images/farming/realseeds.png"
          alt="Seeds"
          draggable={false}
          onMouseEnter={(e) => {
            e.currentTarget.style.filter = 'drop-shadow(0px 0px 6px rgba(255,255,255,0.8))';
            e.currentTarget.style.transform = 'scale(1.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = selectedTool === 'seeds' ? 'drop-shadow(0px 0px 6px rgba(255,255,255,0.8))' : 'none';
            e.currentTarget.style.transform = selectedTool === 'seeds' ? 'translateY(-15px)' : 'none';
          }}
          onClick={() => { toggleTool('seeds'); const next = selectedTool !== 'seeds'; setIsSeeding(next); setIsDirting(false); setIsHoeing(false); setIsWatering(false); setIsDigging(false); setIsPlanting(false); }}
          style={{
            position: 'absolute',
            top: '637px',
            left: '709px',
            width: '43px',
            zIndex: 6,
            cursor: 'pointer',
            transform: selectedTool === 'seeds' ? 'translateY(-15px)' : 'none',
            filter: selectedTool === 'seeds' ? 'drop-shadow(0px 0px 6px rgba(255,255,255,0.8))' : 'none',
            transition: 'transform 0.4s ease, filter 0.2s ease',
            animation: selectedTool === 'seeds' ? 'mapFloat 2s ease-in-out infinite' : 'none',
          }}
        />
        <img
          src="/images/farming/realbucket.png"
          alt="Bucket"
          draggable={false}
          onMouseEnter={(e) => {
            e.currentTarget.style.filter = 'drop-shadow(0px 0px 6px rgba(255,255,255,0.8))';
            e.currentTarget.style.transform = 'scale(1.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = selectedTool === 'bucket' ? 'drop-shadow(0px 0px 6px rgba(255,255,255,0.8))' : 'none';
            e.currentTarget.style.transform = selectedTool === 'bucket' ? 'translateY(-15px)' : 'none';
          }}
          onClick={() => { toggleTool('bucket'); const next = selectedTool !== 'bucket'; setIsWatering(next); setIsHoeing(false); setIsDigging(false); setIsDirting(false); setIsSeeding(false); setIsPlanting(false); }}
          style={{
            position: 'absolute',
            top: '638px',
            left: '785px',
            width: '63px',
            zIndex: 6,
            cursor: 'pointer',
            transform: selectedTool === 'bucket' ? 'translateY(-15px)' : 'none',
            filter: selectedTool === 'bucket' ? 'drop-shadow(0px 0px 6px rgba(255,255,255,0.8))' : 'none',
            transition: 'transform 0.4s ease, filter 0.2s ease',
            animation: selectedTool === 'bucket' ? 'mapFloat 2s ease-in-out infinite' : 'none',
          }}
        />
        <img
          src="/images/farming/realshovel.png"
          alt="Shovel"
          draggable={false}
          onMouseEnter={(e) => {
            e.currentTarget.style.filter = 'drop-shadow(0px 0px 6px rgba(255,255,255,0.8))';
            e.currentTarget.style.transform = 'scale(1.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = selectedTool === 'shovel' ? 'drop-shadow(0px 0px 6px rgba(255,255,255,0.8))' : 'none';
            e.currentTarget.style.transform = selectedTool === 'shovel' ? 'translateY(-15px)' : 'none';
          }}
          onClick={() => { toggleTool('shovel'); const next = selectedTool !== 'shovel'; setIsDigging(next); setIsHoeing(false); setIsWatering(false); setIsDirting(false); setIsSeeding(false); setIsPlanting(false); }}
          style={{
            position: 'absolute',
            top: '650px',
            left: '555px',
            width: '30px',
            zIndex: 6,
            cursor: 'pointer',
            transform: selectedTool === 'shovel' ? 'translateY(-15px)' : 'none',
            filter: selectedTool === 'shovel' ? 'drop-shadow(0px 0px 6px rgba(255,255,255,0.8))' : 'none',
            transition: 'transform 0.4s ease, filter 0.2s ease',
            animation: selectedTool === 'shovel' ? 'mapFloat 2s ease-in-out infinite' : 'none',
          }}
        />
        </>)}
        {/* Well */}
        <img src="/images/land/well.png" alt="Well" style={{ position: 'absolute', top: '410px', left: '250px', width: '190px', pointerEvents: 'none', zIndex: 10 }} draggable={false} />
        {/* Mine */}
        <img src="/images/land/mine.png" alt="Mine" style={{ position: 'absolute', top: '417px', left: '1023.5px', width: '235px', pointerEvents: 'none', zIndex: 10 }} draggable={false} />
        {false && <img
          src="/images/label/mineslabel.png"
          alt="Mine Label"
          draggable={false}
          onMouseEnter={(e) => {
            if (mineLockTime <= 0) {
              e.currentTarget.style.filter = 'drop-shadow(0px 0px 8px rgba(255,255,255,0.8))';
              e.currentTarget.style.transform = 'scale(1.1)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = 'none';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            if (mineLockTime > 0) {
              const m = Math.floor(mineLockTime / 60000);
              const s = Math.floor((mineLockTime % 60000) / 1000);
              show(`The mine is resting! Come back in ${m}m ${s}s.`, "error");
              return;
            }
            e.currentTarget.style.transform = 'scale(0.9)';
            setTimeout(() => { navigate('/mine'); }, 150);
          }}
          style={{ position: 'absolute', top: '377px', left: '1145px', width: '78px', zIndex: 11, cursor: mineLockTime > 0 ? 'not-allowed' : 'pointer', animation: 'mapFloat 2.6s ease-in-out infinite', transition: 'filter 0.2s ease', opacity: mineLockTime > 0 ? 0.6 : 1 }}
        />}

        <FarmInterface
          key={isFarmMenu ? `preview-${previewUpdateKey}` : "main"}
          cropArray={isFarmMenu ? previewCropArray : cropArray}
          onClickCrop={onClickCrop}
          isFarmMenu={isFarmMenu}
          isPlanting={isPlanting}
          isUsingPotion={isUsingPotion}
          maxPlots={maxPlots}
          totalPlots={30}
          selectedIndexes={selectedIndexes}
          crops={cropArray}
        />

        {/* Cat Appearance */}

        {catWillAppear && tutorialStep >= 11 && (
          <img 
            src={
              starvingTime > 0 
                ? "/images/pets/catangry.png" 
                : catState === 'walk' 
                  ? "/images/pets/cat_walk.png" 
                  : catState === 'sleep' 
                    ? "/images/pets/catsleep.png" 
                    : "/images/pets/catsit.png"
            } 
            alt="Cat Pet" 
            style={{ 
              position: 'absolute', 
              left: `${catPos.left}px`,
              top: `${catPos.top}px`,
              width: '80px', 
              height: 'auto', 
              zIndex: 15,
              cursor: 'pointer',
              transform: `scaleX(${catDirection})`,
              transition: yarnState?.active ? 'left 0.1s linear, top 0.1s linear, transform 0.2s' : 'left 3.8s linear, top 3.8s linear, transform 0.2s',
              filter: starvingTime > 0 ? 'drop-shadow(0 0 10px red)' : 'drop-shadow(0px 2px 4px rgba(0,0,0,0.4))'
            }} 
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (catState === 'sleep') {
                 let happy = parseFloat(localStorage.getItem('sandbox_cat_happiness') || '50');
                 happy = Math.max(0, happy - 10);
                 localStorage.setItem('sandbox_cat_happiness', happy.toString());
                 setCatHappiness(happy);
                 show("You woke up Felix! Happiness -10%", "error");
                 setCatState('sit');
                 catSleepUntil.current = 0;
              } else {
                 show(starvingTime > 0 ? "HISS! The cat is very hungry!" : "Meow! The cat is happy and fed.", starvingTime > 0 ? "error" : "success");
              }
            }}
          />
        )}

        {/* Sir Bee Tutorial Overlay */}
        {tutorialStep >= 1 && tutorialStep < 4 && (
          <>
            <img
              src="/images/bees/sir.png"
              alt="Sir Bee"
              style={{
                position: 'absolute', left: sirBeePos, top: '320px', width: '100px', zIndex: 20,
                transition: tutorialStep === 1 ? 'left 2s ease-out' : 'none',
                filter: tutorialStep === 2 ? 'drop-shadow(0 0 10px yellow)' : 'none',
                cursor: tutorialStep === 2 ? 'pointer' : 'default',
                animation: tutorialStep >= 2 ? 'mapFloat 2s ease-in-out infinite' : 'none',
                pointerEvents: tutorialStep >= 2 ? 'auto' : 'none'
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (tutorialStep === 2) {
                  setTutorialStep(3);
                  localStorage.setItem('sandbox_tutorial_step', '3');
                }
              }}
            />
            {tutorialStep === 2 && (
              <img
                src="/images/mail/!.png"
                alt="!"
                style={{
                  position: 'absolute',
                  left: `calc(${sirBeePos} + 70px)`,
                  top: '300px',
                  width: '24px',
                  height: '24px',
                  zIndex: 21,
                  pointerEvents: 'none',
                  animation: 'mapFloat 2s ease-in-out infinite'
                }}
              />
            )}
          </>
        )}

        {/* Protector Spots Overlay */}
        {FARM_POSITIONS && SHARED_SPOTS_CONFIG.map((spot) => {
          const nowSec = Math.floor(Date.now() / 1000);
          
          let placedItem = null;
          let sc = scarecrows[spot.index];
          if (sc && (typeof sc === 'number' ? sc : sc.expiry) > nowSec) {
            placedItem = { type: typeof sc === 'number' ? 'tier1' : sc.type, expiryTime: typeof sc === 'number' ? sc : sc.expiry, onExpire: handleRemoveScarecrow };
          } else if (ladybugs[spot.index] && ladybugs[spot.index] > nowSec) {
            placedItem = { type: 'ladybug', expiryTime: ladybugs[spot.index], onExpire: handleRemoveLadybug };
          } else if (teslaTowers[spot.index] && teslaTowers[spot.index] > nowSec) {
            placedItem = { 
              type: 'tesla', 
              expiryTime: teslaTowers[spot.index], 
              onExpire: (expiredSpotId) => { 
                setTeslaTowers(prev => { const n = {...prev}; delete n[expiredSpotId]; teslaTowersRef.current = n; localStorage.setItem('sandbox_tesla', JSON.stringify(n)); return n; }); 
              } 
            };
          } else if (sprinklers[spot.index] && sprinklers[spot.index] > nowSec) {
            placedItem = { type: 'sprinkler', expiryTime: sprinklers[spot.index], onExpire: handleRemoveSprinkler };
          } else if (umbrellas[spot.index] && umbrellas[spot.index] > nowSec) {
            placedItem = { type: 'umbrella', expiryTime: umbrellas[spot.index], onExpire: handleRemoveUmbrella };
          }

          let placingType = null;
          if (isPlacingScarecrow) placingType = placingScarecrowType;
          else if (isPlacingTesla) placingType = 'tesla';
          else if (isPlacingLadybug) placingType = 'ladybug';
          else if (isPlacingSprinkler) placingType = 'sprinkler';
          else if (isPlacingUmbrella) placingType = 'umbrella';

          return (
            <ProtectorSpot
              key={`protector-spot-${spot.index}`}
              spotId={spot.index}
              pos={FARM_POSITIONS[spot.index]}
              offsetX={spot.offsetX}
              offsetY={spot.offsetY}
              placingType={placedItem ? null : placingType}
              placedItem={placedItem}
              onPlace={(spotId, type) => {
                if (type.includes('tier') || type === 'ladybug_scarecrow') handlePlaceScarecrow(spotId, type);
                if (type === 'tesla') handlePlaceTesla(spotId);
                if (type === 'ladybug') handlePlaceLadybug(spotId);
                if (type === 'sprinkler') handlePlaceSprinkler(spotId);
                if (type === 'umbrella') handlePlaceUmbrella(spotId);
              }}
              onRemove={async (spotId, type) => {
                if (isHoeing) {
                  if (type.includes('tier') || type === 'ladybug_scarecrow') handleRemoveScarecrow(spotId);
                  if (type === 'ladybug') handleRemoveLadybug(spotId);
                  if (type === 'tesla') {
                      setTeslaTowers(prev => { const n = {...prev}; delete n[spotId]; teslaTowersRef.current = n; localStorage.setItem('sandbox_tesla', JSON.stringify(n)); return n; });
                      const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}'); sandboxLoot[9975] = (sandboxLoot[9975]||0)+1; localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
                  }
                  if (type === 'sprinkler') handleRemoveSprinkler(spotId);
                  if (type === 'umbrella') {
                    handleRemoveUmbrella(spotId);
                    await loadCropsFromContract();
                  }
                  show(`${type.charAt(0).toUpperCase() + type.slice(1)} removed!`, "success");
                } else {
                  show("Equip the Hoe to remove placed items!", "warning");
                }
              }}
            />
          );
        })}

        {yarnState && yarnState.phase === 'cursor' && (
          <div
            style={{
              position: 'absolute',
              top: 0, left: 0, width: '1920px', height: '1080px',
              zIndex: 99999,
              cursor: 'none'
            }}
            onPointerMove={(e) => {
              const x = e.nativeEvent.offsetX;
              const y = e.nativeEvent.offsetY;
              setYarnState(prev => ({ ...prev, x, y }));
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              const x = e.nativeEvent.offsetX;
              const y = e.nativeEvent.offsetY;
              setYarnState(prev => ({ ...prev, phase: 'idle', x, y }));
              show("Drag the yarn down to aim!", "info");
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: `${yarnState.x - 25}px`,
                top: `${yarnState.y - 25}px`,
                width: '50px',
                height: '50px',
                pointerEvents: 'none',
                filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <img src="/images/pets/yarn.png" alt="Yarn" style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(0.5)' }} onError={(e) => e.target.src='/images/items/seeds.png'} />
            </div>
          </div>
        )}

        {yarnState && yarnState.active && yarnState.phase !== 'cursor' && (
          <div
            style={{
              position: 'absolute',
              left: `${yarnState.x - 25}px`,
              top: `${yarnState.y - 25}px`,
              width: '50px',
              height: '50px',
              zIndex: 100000,
              cursor: yarnState.phase === 'idle' ? 'grab' : (yarnState.phase === 'dragging' || yarnState.phase === 'aiming' ? 'grabbing' : 'default'),
              filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (yarnState.phase === 'idle' || yarnState.phase === 'rolling') {
                 e.currentTarget.setPointerCapture(e.pointerId);
                 setYarnState(prev => ({ ...prev, phase: 'dragging', startY: e.clientY, vx: 0, vy: 0, angle: prev.angle || 0 }));
              }
            }}
            onPointerMove={(e) => {
              if (yarnState.phase === 'dragging' && e.clientY > (yarnState.startY || 0) + 30) {
                 setYarnState(prev => ({ ...prev, phase: 'aiming' }));
              }
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
              e.preventDefault();
              e.currentTarget.releasePointerCapture(e.pointerId);
              if (yarnState.phase === 'aiming') {
                 setYarnState(prev => {
                   if (!prev || prev.phase !== 'aiming') return prev;
                   const rad = prev.angle * (Math.PI / 180);
                   const power = 15; 
                   const vx = Math.sin(rad) * power;
                   const vy = -Math.cos(rad) * power;
                   return { ...prev, phase: 'rolling', vx, vy };
                 });
              } else if (yarnState.phase === 'dragging') {
                 setYarnState(prev => ({ ...prev, phase: 'idle' }));
              }
            }}
          >
             <img src="/images/pets/yarn.png" alt="Yarn" style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(0.5)', pointerEvents: 'none' }} onError={(e) => e.target.src='/images/items/seeds.png'} />
             
             {yarnState.phase === 'idle' && (
               <div style={{ position: 'absolute', top: '-30px', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', color: '#ffea00', fontWeight: 'bold', textShadow: '1px 1px 2px black', fontSize: '14px', pointerEvents: 'none' }}>
                 Drag down to aim!
               </div>
             )}

             {yarnState.phase === 'aiming' && (
               <div style={{
                 position: 'absolute',
                 top: '25px',
                 left: '25px',
                 width: '0px',
                 height: '0px',
                 transform: `rotate(${yarnState.angle}deg)`,
                 zIndex: -1
               }}>
                 <div style={{ position: 'absolute', bottom: '30px', left: '-10px', width: '20px', height: '150px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                   <div style={{ width: 0, height: 0, borderLeft: '15px solid transparent', borderRight: '15px solid transparent', borderBottom: '25px solid #ffea00', filter: 'drop-shadow(0 2px 2px black)' }} />
                   <div style={{ width: '10px', height: '125px', backgroundColor: '#ffea00', filter: 'drop-shadow(0 2px 2px black)', borderRadius: '4px' }} />
                 </div>
               </div>
             )}
          </div>
        )}

        {tutorialStep >= 32 && (
          <>
        {/* Forest Label Overlay - temporarily hidden */}
        {false && <div
          onMouseEnter={(e) => {
            if (forestLockTime <= 0) {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.filter = 'drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.8))';
            }
          }}
          onMouseLeave={(e) => {
            if (forestLockTime <= 0) {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.filter = 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))';
            }
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            if (forestLockTime > 0) {
              const m = Math.floor((forestLockTime % 3600000) / 60000);
              const s = Math.floor((forestLockTime % 60000) / 1000);
              show(`The forest is resting! Come back in ${m}m ${s}s.`, "error");
              return;
            }
            navigate('/forest');
          }}
          style={{ position: 'absolute', bottom: 'calc(100% - 170px)', right: 'calc(15% - 1180px)', zIndex: 9998, cursor: forestLockTime > 0 ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease', filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))', opacity: forestLockTime > 0 ? 0.6 : 1, animation: 'mapFloat 2.6s ease-in-out infinite', willChange: 'transform' }}
        >
          <img src="/images/label/forestlabel (2).png" alt="Forest" style={{ height: '50px', objectFit: 'contain' }} />
          {forestLockTime > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(0,0,0,0.8)', color: '#ff4444', padding: '4px 8px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold', whiteSpace: 'nowrap', marginTop: '5px', border: '1px solid #ff4444', fontFamily: 'monospace' }}>
              {Math.floor(forestLockTime / 60000)}m {Math.floor((forestLockTime % 60000) / 1000)}s
            </div>
          )}
        </div>}

        {/* The Well Label Overlay */}
        <div 
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.filter = 'drop-shadow(0px 0px 8px rgba(0, 191, 255, 0.8))';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.filter = 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))';
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleWellDrop();
          }}
          style={{ display: 'none', position: 'absolute', top: '355px', left: '235px', zIndex: 9998, cursor: 'pointer', transition: 'all 0.2s ease', filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))' }}
        >
          <div style={{ backgroundColor: 'rgba(31, 22, 16, 0.9)', padding: '15px 30px', borderRadius: '12px', border: '3px solid #5a402a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <span style={{ color: '#00bfff', fontFamily: 'monospace', fontSize: '24px', fontWeight: 'bold', textShadow: '2px 2px 0 #000' }}>
              🪣 THE WELL
            </span>
          </div>
        </div>

        {/* The Mine Label Overlay - temporarily hidden */}
          </>
        )}

        {/* Animal Farm Label Overlay */}
        {hasBarnMissionUnlocked && (
          <div 
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.filter = 'drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.8))';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.filter = 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))';
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              navigate('/animal');
            }}
            style={{ position: 'absolute', top: '518px', left: '200px', zIndex: 9998, cursor: 'pointer', transition: 'all 0.2s ease', filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))' }}
          >
            <div style={{ backgroundColor: 'rgba(31, 22, 16, 0.9)', padding: '15px 30px', borderRadius: '12px', border: '3px solid #5a402a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontFamily: 'monospace', fontSize: '24px', fontWeight: 'bold', textShadow: '2px 2px 0 #000' }}>
                🐄 ANIMAL FARM
              </span>
            </div>
          </div>
        )}


      </PanZoomViewport>
      {isFarmMenu && (
        <FarmMenu
          isPlant={isPlanting}
          isUsingPotion={isUsingPotion}
          onCancel={handleCancel}
          onPlant={handlePlant}
          onHarvest={handleHarvest}
          onPlantAll={plantAll}
          onPotionUse={handlePotionUse}
          selectedSeed={selectedSeed}
          selectedPotion={selectedPotion}
          loading={farmingLoading}
        />
      )}
      {isSelectCropDialog && (
        <SelectSeedDialog
          onClose={() => setIsSelectCropDialog(false)}
          onClickSeed={handleClickSeedFromDialog}
          availableSeeds={getAvailableSeeds()}
        />
      )}

      {prepDialogTarget !== null && (
        <PlotPrepDialog
          onClose={() => setPrepDialogTarget(null)}
          onPlaceDirt={() => {
            updatePlotPrep(prepDialogTarget, { ...plotPrep[prepDialogTarget], status: 3 });
            setPrepDialogTarget(null);
            playPlantConfirmSound();
          }}
          onAddFish={(fishId) => {
            const existingPrep = plotPrep[prepDialogTarget];
            const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
            
            if (existingPrep?.status === 2 && existingPrep?.fishId) {
              sandboxLoot[existingPrep.fishId] = (sandboxLoot[existingPrep.fishId] || 0) + 1;
            }

            sandboxLoot[fishId] = Math.max(0, (sandboxLoot[fishId] || 0) - 1);
            localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
            
            updatePlotPrep(prepDialogTarget, { status: 2, fishId });
            setPrepDialogTarget(null);
            show("Fish placed in the hole!", "success");
            if (refetchSeeds) refetchSeeds();
          }}
          availableFish={allItems.filter(item => Object.values(ID_FISH_ITEMS || {}).includes(item.id) && item.count > 0)}
          farmingLevel={farmingLevel}
        />
      )}

      {showBowlFishDialog && (
        <FishBowlDialog
          onClose={() => { setShowBowlFishDialog(false); setShowTamagotchiDialog(true); }}
          onAddFish={(fishId) => {
            const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
            sandboxLoot[fishId] = Math.max(0, (sandboxLoot[fishId] || 0) - 1);
            localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
            
            setBowlFishId(fishId);
            localStorage.setItem('sandbox_bowl_fish', fishId.toString());
            setShowBowlFishDialog(false);
            setShowTamagotchiDialog(true);
            show("Fish placed in the bowl!", "success");
            if (refetchSeeds) refetchSeeds();
          }}
          availableFish={allItems.filter(item => Object.values(ID_FISH_ITEMS || {}).includes(item.id) && item.count > 0)}
        />
      )}

      {skipGrowTarget !== null && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000000 }}>
          <SkipGrowthDialog
            onClose={() => setSkipGrowTarget(null)}
            onConfirm={handleSkipGrowth}
          />
        </div>
      )}

      {/* Interactive Bowls */}
      {false && tutorialStep >= 32 && !hideIcons && (
        <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'flex-end', gap: '15px', zIndex: 9999 }}>
          
          {/* Tamagotchi Pet Device */}
          <div 
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setShowTamagotchiDialog(true);
            }}
            style={{
              width: '80px', height: 'auto', cursor: 'pointer', position: 'relative',
              filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))',
              animation: 'mapFloat 2.5s ease-in-out infinite alternate',
              transition: 'transform 0.1s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            title="Felix the Cat"
          >
            <img src={`/images/pets/paw.png?v=${Date.now()}`} alt="Tamagotchi" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} onError={(e) => e.target.src='/images/pets/bowl.png'} />
            {(!bowlFishId || !bowlWaterFilled || starvingTime > 0) && <div style={{ position: 'absolute', top: '-5px', right: '-5px', fontSize: '24px', animation: 'mailboxAlert 1s infinite' }}>❗️</div>}
          </div>
        </div>
      )}

      {/* Cancel Placement Button */}
      {(isPlacingScarecrow || isPlacingLadybug || isPlacingSprinkler || isPlacingUmbrella || isPlacingTesla || yarnState?.phase === 'cursor') && (
        <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 10000 }}>
          <button 
            onClick={() => {
              setIsPlacingScarecrow(false);
              setIsPlacingLadybug(false);
              setIsPlacingTesla(false);
              setIsPlacingSprinkler(false);
              setIsPlacingUmbrella(false);
              if (yarnState?.phase === 'cursor') {
                setYarnState(null);
                const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
                sandboxLoot[9955] = (sandboxLoot[9955] || 0) + 1;
                localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
                if (refetch) refetch();
              }
              setIsPlanting(true);
            }}
            style={{ backgroundColor: 'rgba(0,0,0,0.8)', color: '#ff4444', border: '2px solid #ff4444', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'monospace', fontSize: '16px', fontWeight: 'bold', boxShadow: '0 0 10px rgba(255,68,68,0.5)' }}
          >
            [CANCEL PLACEMENT]
          </button>
        </div>
      )}
  
  {/* Farming Board Dialog */}
  {showFarmingBoard && (
    <RegionalQuestBoard 
      onClose={() => setShowFarmingBoard(false)} 
      title="FARMING MISSIONS"
      questType="farming"
      tutorialStep={tutorialStep}
      completedQuests={completedQuests}
      setCompletedQuests={setCompletedQuests}
      refetch={refetch} 
    />
  )}

  <style>{`
    .tutorial-img { transition: transform 0.08s, filter 0.08s; cursor: pointer; }
    .tutorial-img:active { transform: scale(0.96); filter: brightness(0.8); }
    .tut-arrow { position: absolute; right: -22px; top: 50%; transform: translateY(-50%); width: 44px; height: 44px; background: #f5c842; border: 3px solid #a67c00; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 22px; box-shadow: 0 3px 10px rgba(0,0,0,0.4); transition: transform 0.1s, filter 0.1s; user-select: none; }
    .tut-arrow:hover { filter: brightness(1.2); transform: translateY(-50%) scale(1.1); }
    .tut-arrow:active { filter: brightness(0.85); transform: translateY(-50%) scale(0.95); }
  `}</style>

  {tutorialStep === 3 && (
    <div style={{ position: 'fixed', right: '20px', bottom: '20px', zIndex: 100000 }}>
      <div style={{ position: 'relative', width: '490px' }}>
        <img
          src={tutPage === 1 ? '/images/tutorial/tutmessagep1.png' : tutPage === 2 ? '/images/tutorial/tutmessagep2.png' : tutPage === 3 ? '/images/tutorial/tutmessagep3.png' : tutPage === 4 ? '/images/tutorial/tutp4.png' : tutPage === 5 ? '/images/tutorial/tutp5.png' : tutPage === 6 ? '/images/tutorial/tutp6.png' : tutPage === 10 ? '/images/tutorial/tutpart8.png' : tutPage === 11 ? '/images/tutorial/tutp9.png' : tutPage === 12 ? '/images/tutorial/tutp10.png' : '/images/tutorial/tutp7.png'}
          alt="Tutorial"
          className="tutorial-img"
          style={{ width: '490px', objectFit: 'contain', display: 'block' }}
        />
        {tutPage !== 5 && tutPage !== 6 && tutPage !== 7 && tutPage !== 8 && tutPage !== 9 && tutPage !== 11 && tutPage !== 12 && (
          <div className="tut-arrow" onClick={() => {
            if (tutPage === 1) {
              setTutPageSync(2);
            } else if (tutPage === 2) {
              setTutPageSync(3);
            } else if (tutPage === 3) {
              setTutPageSync(4);
            } else if (tutPage === 4) {
              setTutPageSync(5);
            } else if (tutPage === 10) {
              setTutPageSync(11);
            } else if (tutPage === 11) {
              setTutPageSync(1);
              setTutorialStep(32);
              localStorage.setItem('sandbox_tutorial_step', '32');
              window.dispatchEvent(new CustomEvent('tutorialStepChanged'));
            }
          }}>▶</div>
        )}
      </div>
    </div>
  )}

  {tutorialStep > 0 && tutorialStep < 4 && tutPage < 12 && (
    <style>{`
      a[href*="/house"], a[href*="/valley"], a[href*="/market"], a[href*="/tavern"] { pointer-events: none !important; }
    `}</style>
  )}
  {tutorialStep === 3 && tutPage === 12 && (
    <style>{`
      a[href*="/house"], a[href*="/valley"], a[href*="/tavern"] { pointer-events: none !important; }
      a[href*="/market"] { pointer-events: auto !important; animation: marketIconPulse 1.2s ease-in-out infinite !important; transform-origin: center; position: relative; z-index: 100001; }
      @keyframes marketIconPulse { 0%, 100% { transform: scale(1.15); filter: drop-shadow(0 0 8px rgba(255,215,0,0.9)); } 50% { transform: scale(0.95); filter: drop-shadow(0 0 2px rgba(255,215,0,0.3)); } }
    `}</style>
  )}

  {tutorialStep === 25 && (
    <div style={{ position: 'fixed', right: '20px', bottom: '20px', zIndex: 100000, pointerEvents: 'none' }}>
      <style>{`
        a[href*="/house"], a[href*="/valley"], a[href*="/market"], a[href*="/tavern"] { pointer-events: none !important; }
        @keyframes craftingGlow {
          0%, 100% { box-shadow: 0 0 20px 5px #00ff41; transform: scale(1.1); background-color: rgba(0,255,65,0.3); }
          50% { box-shadow: 0 0 10px 2px #00ff41; transform: scale(1); background-color: transparent; }
        }
      `}</style>
      <div style={{ position: 'relative', width: '490px', pointerEvents: 'auto' }}>
        <img src="/images/tutorial/tutmessagep1.png" alt="Tutorial" className="tutorial-img" style={{ width: '490px', objectFit: 'contain' }} />
        <div className="tut-arrow" onClick={() => { setTutorialStep(26); localStorage.setItem('sandbox_tutorial_step', '26'); window.dispatchEvent(new CustomEvent('tutorialStepChanged')); }}>▶</div>
      </div>
    </div>
  )}

  {tutorialStep === 26 && (
    <>
      <style>{`
        a[href*="/house"], a[href*="/valley"], a[href*="/market"], a[href*="/tavern"] { pointer-events: none !important; }
        @keyframes craftingGlow {
          0%, 100% { transform: scale(1.1); }
          50% { transform: scale(1); }
        }
      `}</style>
      <div style={{ position: 'fixed', right: '20px', bottom: '20px', zIndex: 100000 }}>
        <div style={{ position: 'relative', width: '490px' }}>
          <img src="/images/tutorial/tutmessagep1.png" alt="Tutorial" style={{ width: '490px', objectFit: 'contain' }} />
          <div className="tut-arrow" onClick={() => { setTutorialStep(27); localStorage.setItem('sandbox_tutorial_step', '27'); window.dispatchEvent(new CustomEvent('tutorialStepChanged')); }}>▶</div>
        </div>
      </div>
    </>
  )}

  {tutorialStep === 27 && (
    <div style={{ position: 'fixed', right: '20px', bottom: '20px', zIndex: 100000 }}>
      <style>{`
        a[href*="/house"], a[href*="/valley"], a[href*="/market"], a[href*="/tavern"] { pointer-events: none !important; }
        @keyframes craftingGlow {
          0%, 100% { transform: scale(1.1); }
          50% { transform: scale(1); }
        }
      `}</style>
      <div style={{ position: 'relative', width: '490px' }}>
        <img src="/images/tutorial/tutmessagep1.png" alt="Tutorial" style={{ width: '490px', objectFit: 'contain' }} />
        <div className="tut-arrow" onClick={() => { setTutorialStep(28); localStorage.setItem('sandbox_tutorial_step', '28'); window.dispatchEvent(new CustomEvent('tutorialStepChanged')); }}>▶</div>
      </div>
    </div>
  )}

  {tutorialStep === 28 && (
    <div style={{ position: 'fixed', right: '20px', bottom: '20px', zIndex: 100000 }}>
      <style>{`a[href*="/house"], a[href*="/valley"], a[href*="/market"], a[href*="/tavern"] { pointer-events: none !important; }`}</style>
      <div style={{ position: 'relative', width: '490px' }}>
        <img src="/images/tutorial/tutmessagep1.png" alt="Tutorial" style={{ width: '490px', objectFit: 'contain' }} />
        <div className="tut-arrow" onClick={() => { setTutorialStep(29); localStorage.setItem('sandbox_tutorial_step', '29'); window.dispatchEvent(new CustomEvent('tutorialStepChanged')); }}>▶</div>
      </div>
    </div>
  )}

  {tutorialStep === 29 && (
    <div style={{ position: 'fixed', right: '20px', bottom: '20px', zIndex: 100000 }}>
      <style>{`
        a[href*="/house"], a[href*="/valley"], a[href*="/market"], a[href*="/tavern"] { pointer-events: none !important; }
        @keyframes craftingGlow {
          0%, 100% { transform: scale(1.1); }
          50% { transform: scale(1); }
        }
      `}</style>
      <div style={{ position: 'relative', width: '490px' }}>
        <img src="/images/tutorial/tutmessagep1.png" alt="Tutorial" style={{ width: '490px', objectFit: 'contain' }} />
        <div className="tut-arrow" onClick={() => { setTutorialStep(30); localStorage.setItem('sandbox_tutorial_step', '30'); window.dispatchEvent(new CustomEvent('tutorialStepChanged')); }}>▶</div>
      </div>
    </div>
  )}

  {tutorialStep === 30 && (
    <div style={{ position: 'fixed', right: '20px', bottom: '20px', zIndex: 100000 }}>
      <style>{`a[href*="/house"], a[href*="/valley"], a[href*="/market"], a[href*="/tavern"] { pointer-events: none !important; }`}</style>
      <div style={{ position: 'relative', width: '490px' }}>
        <img src="/images/tutorial/tutmessagep1.png" alt="Tutorial" style={{ width: '490px', objectFit: 'contain' }} />
        <div className="tut-arrow" onClick={() => { setTutorialStep(31); localStorage.setItem('sandbox_tutorial_step', '31'); window.dispatchEvent(new CustomEvent('tutorialStepChanged')); }}>▶</div>
      </div>
    </div>
  )}

  {tutorialStep === 31 && (
    <div style={{ position: 'fixed', right: '20px', bottom: '20px', zIndex: 100000 }}>
      <div style={{ position: 'relative', width: '490px' }}>
        <img src="/images/tutorial/tutmessagep1.png" alt="Tutorial" style={{ width: '490px', objectFit: 'contain' }} />
        <div className="tut-arrow" onClick={() => { setTutorialStep(32); localStorage.setItem('sandbox_tutorial_step', '32'); window.dispatchEvent(new CustomEvent('tutorialStepChanged')); }}>▶</div>
      </div>
    </div>
  )}

  {/* Tutorial Gem Skip Popup (tutp9 step) */}
  {tutGemPopupOpen && tutorialStep === 3 && tutPage === 11 && (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999999, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* tutp9 image visible above the dark overlay */}
      <div style={{ position: 'absolute', right: '20px', bottom: '20px' }}>
        <img src="/images/tutorial/tutp9.png" alt="Tutorial" style={{ width: '490px', objectFit: 'contain', display: 'block' }} />
      </div>
      {/* Centered popup card */}
      <div style={{ background: 'linear-gradient(135deg, #3a2010, #5a3520)', border: '4px solid #a67c00', borderRadius: '20px', padding: '36px 40px', textAlign: 'center', maxWidth: '360px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
        <div style={{ fontFamily: 'Cartoonist', fontSize: '22px', color: '#fff', marginBottom: '12px', textShadow: '1px 1px 0 #000' }}>
          Your crop is still growing!
        </div>
        <div style={{ fontFamily: 'Cartoonist', fontSize: '16px', color: '#ffd700', marginBottom: '24px' }}>
          Skip the wait for 50 💎?
        </div>
        <div
          onClick={() => {
            const currentGems = parseInt(localStorage.getItem('sandbox_gems') || '0', 10);
            if (currentGems < 50) { show("Not enough gems!", "error"); return; }
            localStorage.setItem('sandbox_gems', String(currentGems - 50));
            window.dispatchEvent(new CustomEvent('sandboxGemsChanged'));
            // Crop is already marked ready — just close the popup so user can click to harvest
            setTutGemPopupOpen(false);
          }}
          style={{ display: 'inline-block', background: 'linear-gradient(135deg, #f5c842, #e0a800)', border: '3px solid #a67c00', borderRadius: '12px', padding: '12px 32px', fontFamily: 'Cartoonist', fontSize: '18px', color: '#3a2010', cursor: 'pointer', userSelect: 'none' }}
        >
          Pay 50 💎
        </div>
      </div>
    </div>
  )}

  {/* Easter Basket Dialog */}
      {tutorialStep >= 9 && showEasterBasket && <EasterBasketDialog onClose={() => setShowEasterBasket(false)} />}

  {/* Tamagotchi Dialog UI */}
  {showTamagotchiDialog && (
    <TamagotchiDialog
      onClose={() => setShowTamagotchiDialog(false)}
      catFeedTimeLeft={catFeedTimeLeft}
      starvingTime={starvingTime}
      bowlWaterFilled={bowlWaterFilled}
      bowlFishId={bowlFishId}
      isCatUnlocked={isCatUnlocked}
      firstFedTime={firstFedTime}
      catHappiness={catHappiness}
      catHealth={catHealth}
      currentHunger={currentHunger}
      onWater={() => {
        if (!bowlWaterFilled) {
          setBowlWaterFilled(true);
          localStorage.setItem('sandbox_bowl_water', 'true');
          playWaterSound();
          show("You filled Felix's water!", "success");
        } else {
          show("Felix isn't thirsty right now.", "info");
        }
      }}
      onFeed={() => {
        if (!bowlFishId) {
          setShowBowlFishDialog(true);
          setShowTamagotchiDialog(false); // Close tama, open fish picker
        } else {
          show("Felix already has fish!", "info");
        }
      }}
    />
  )}

      <AdminPanel />

      {showMissionBoard && <MissionBoard onClose={() => setShowMissionBoard(false)} />}
      {showShop && <Shop onClose={() => setShowShop(false)} />}
      {showFarmCustomize && <FarmCustomizePanel onClose={() => setShowFarmCustomize(false)} />}
      {showPabeePack && (
        <PokemonPackRipDialog
          rollingInfo={{
            id: 'pabee_pack',
            count: 5,
            isReveal: true,
            isComplete: true,
            isFallback: false,
            revealedSeeds: [
              getRaritySeedId(ID_SEEDS.CARROT, 1),
              getRaritySeedId(ID_SEEDS.CARROT, 1),
              getRaritySeedId(ID_SEEDS.CARROT, 2),
              getRaritySeedId(ID_SEEDS.POTATO, 1),
              getRaritySeedId(ID_SEEDS.TOMATO, 1),
            ],
          }}
          onClose={() => {
            setShowPabeePack(false);
            if (tutorialStep === 0) {
              setTutorialStep(1);
              localStorage.setItem('sandbox_tutorial_step', '1');
              window.dispatchEvent(new CustomEvent('tutorialStepChanged'));
            }
          }}
          onBack={() => {
            setShowPabeePack(false);
            if (tutorialStep === 0) {
              setTutorialStep(1);
              localStorage.setItem('sandbox_tutorial_step', '1');
              window.dispatchEvent(new CustomEvent('tutorialStepChanged'));
            }
          }}
        />
      )}
    </div>
  );
};

export default Farm;
