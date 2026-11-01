import type {SkillDef,RecipeDef,FoodEffect} from '@paradise-lost/sim';
export const EXPANDED_SKILLS:Record<string,SkillDef> = {
  "construction": {
    "name": "Construction",
    "profession": "Builder",
    "note": "Training is available; the staffed service and on-site job mechanics are still being built."
  },
  "contracting": {
    "name": "Contracting",
    "profession": "Contractor",
    "prerequisite": "construction",
    "note": "Training is available; the staffed service and on-site job mechanics are still being built."
  },
  "masonry": {
    "name": "Masonry",
    "profession": "Mason",
    "note": "Training is available; the staffed service and on-site job mechanics are still being built."
  },
  "metalworking": {
    "name": "Metalworking",
    "profession": "Metalworker",
    "note": "Training is available; the staffed service and on-site job mechanics are still being built."
  },
  "plumbing": {
    "name": "Plumbing",
    "profession": "Plumber",
    "note": "Training is available; the staffed service and on-site job mechanics are still being built."
  },
  "electrical": {
    "name": "Electrical work",
    "profession": "Electrician",
    "note": "Training is available; the staffed service and on-site job mechanics are still being built."
  },
  "teaching": {
    "name": "Teaching",
    "profession": "Teacher",
    "note": "Training is available; the staffed service and on-site job mechanics are still being built."
  },
  "childcare": {
    "name": "Childcare",
    "profession": "Babysitter",
    "note": "Training is available; the staffed service and on-site job mechanics are still being built."
  },
  "navigation": {
    "name": "Boat navigation",
    "profession": "Boat captain",
    "note": "Training is available; the staffed service and on-site job mechanics are still being built."
  },
  "travel_agency": {
    "name": "Travel operations",
    "profession": "Travel agency worker",
    "note": "Training is available; the staffed service and on-site job mechanics are still being built."
  },
  "retail": {
    "name": "Retail operations",
    "profession": "Shopkeeper",
    "note": "Training is available; the staffed service and on-site job mechanics are still being built."
  },
  "logistics": {
    "name": "Postal and delivery operations",
    "profession": "Postal worker",
    "note": "Training is available; the staffed service and on-site job mechanics are still being built."
  },
  "fishing": {
    "name": "Fishing",
    "profession": "Fisher",
    "note": "Training is available; the staffed service and on-site job mechanics are still being built."
  },
  "farming": {
    "name": "Crop farming",
    "profession": "Farmer",
    "note": "Training is available; the staffed service and on-site job mechanics are still being built."
  },
  "animal_husbandry": {
    "name": "Animal husbandry",
    "profession": "Livestock keeper",
    "note": "Training is available; the staffed service and on-site job mechanics are still being built."
  },
  "pet_care": {
    "name": "Pet care",
    "profession": "Pet store worker",
    "note": "Training is available; the staffed service and on-site job mechanics are still being built."
  },
  "civic_admin": {
    "name": "Civic administration",
    "profession": "Public administrator",
    "note": "Training is available; the staffed service and on-site job mechanics are still being built."
  },
  "finance": {
    "name": "Treasury and bookkeeping",
    "profession": "Treasurer",
    "note": "Training is available; the staffed service and on-site job mechanics are still being built."
  },
  "recreation": {
    "name": "Sports and recreation",
    "profession": "Recreation worker",
    "note": "Training is available; the staffed service and on-site job mechanics are still being built."
  },
  "music": {
    "name": "Music performance",
    "profession": "Musician",
    "note": "Training is available; the staffed service and on-site job mechanics are still being built."
  },
  "visual_art": {
    "name": "Painting and decoration",
    "profession": "Decorative artist",
    "note": "Training is available; the staffed service and on-site job mechanics are still being built."
  },
  "brewing": {
    "name": "Brewing",
    "profession": "Brewer",
    "note": "Training is available; the staffed service and on-site job mechanics are still being built."
  },
  "software": {
    "name": "Software development",
    "profession": "Software developer",
    "prerequisite": "electronics",
    "note": "Training is available; the staffed service and on-site job mechanics are still being built."
  },
  "phone_repair": {
    "name": "Phone repair",
    "profession": "Phone repair specialist",
    "prerequisite": "repair",
    "note": "Training is available; the staffed service and on-site job mechanics are still being built."
  },
  "computer_repair": {
    "name": "Computer repair",
    "profession": "Computer repair specialist",
    "prerequisite": "repair",
    "note": "Training is available; the staffed service and on-site job mechanics are still being built."
  },
  "boat_repair": {
    "name": "Boat repair",
    "profession": "Boat repair specialist",
    "prerequisite": "repair",
    "note": "Training is available; the staffed service and on-site job mechanics are still being built."
  },
  "building_repair": {
    "name": "Building repair",
    "profession": "Building repair specialist",
    "prerequisite": "repair",
    "note": "Training is available; the staffed service and on-site job mechanics are still being built."
  },
  "furniture_repair": {
    "name": "Furniture repair",
    "profession": "Furniture repair specialist",
    "prerequisite": "repair",
    "note": "Training is available; the staffed service and on-site job mechanics are still being built."
  },
  "pediatric_medicine": {
    "name": "Pediatric medicine",
    "profession": "Pediatric doctor",
    "prerequisite": "medicine",
    "note": "Training is available; the staffed service and on-site job mechanics are still being built."
  },
  "cardiac_medicine": {
    "name": "Cardiac medicine",
    "profession": "Cardiac doctor",
    "prerequisite": "medicine",
    "note": "Training is available; the staffed service and on-site job mechanics are still being built."
  },
  "skin_medicine": {
    "name": "Skin care specialty",
    "profession": "Skin specialist",
    "prerequisite": "medicine",
    "note": "Training is available; the staffed service and on-site job mechanics are still being built."
  },
  "infection_medicine": {
    "name": "Infection care specialty",
    "profession": "Infection care doctor",
    "prerequisite": "medicine",
    "note": "Training is available; the staffed service and on-site job mechanics are still being built."
  },
  "pediatric_nursing": {
    "name": "Pediatric nursing",
    "profession": "Pediatric nurse",
    "prerequisite": "nursing",
    "note": "Training is available; the staffed service and on-site job mechanics are still being built."
  },
  "triage_nursing": {
    "name": "Triage nursing",
    "profession": "Triage nurse",
    "prerequisite": "nursing",
    "note": "Training is available; the staffed service and on-site job mechanics are still being built."
  },
  "infection_nursing": {
    "name": "Infection care nursing",
    "profession": "Infection care nurse",
    "prerequisite": "nursing",
    "note": "Training is available; the staffed service and on-site job mechanics are still being built."
  },
  "pet_veterinary": {
    "name": "Companion animal veterinary care",
    "profession": "Companion animal veterinarian",
    "prerequisite": "veterinary",
    "note": "Training is available; the staffed service and on-site job mechanics are still being built."
  },
  "farm_veterinary": {
    "name": "Farm animal veterinary care",
    "profession": "Farm animal veterinarian",
    "prerequisite": "veterinary",
    "note": "Training is available; the staffed service and on-site job mechanics are still being built."
  }
};
export const EXPANDED_RECIPES:Record<string,RecipeDef> = {
  "forge_tools": {
    "name": "Make metalworking tools",
    "skill": "metalworking",
    "xp": 0,
    "learnCost": 1,
    "cost": {
      "stone": 8,
      "lumber": 3,
      "metal": 3
    },
    "gives": {
      "tool_forge": 1
    },
    "durationMs": 30000
  },
  "fasteners": {
    "name": "Forge metal fasteners",
    "skill": "metalworking",
    "xp": 2,
    "learnCost": 1,
    "cost": {
      "metal": 1
    },
    "gives": {
      "fasteners": 6
    },
    "durationMs": 40000,
    "tool": "tool_forge"
  },
  "rope": {
    "name": "Weave rope",
    "skill": "textiles",
    "xp": 0,
    "learnCost": 1,
    "cost": {
      "plant_fiber": 4
    },
    "gives": {
      "rope": 2
    },
    "durationMs": 30000
  },
  "wire": {
    "name": "Draw electrical wire",
    "skill": "metalworking",
    "xp": 2,
    "learnCost": 1,
    "cost": {
      "metal": 1
    },
    "gives": {
      "wire": 3
    },
    "durationMs": 40000,
    "tool": "tool_forge"
  },
  "pipe": {
    "name": "Form metal pipes",
    "skill": "plumbing",
    "xp": 2,
    "learnCost": 1,
    "cost": {
      "metal": 2
    },
    "gives": {
      "pipe": 3
    },
    "durationMs": 40000,
    "tool": "tool_forge"
  },
  "circuit": {
    "name": "Assemble electronic circuits",
    "skill": "electronics",
    "xp": 4,
    "learnCost": 1,
    "cost": {
      "wire": 2,
      "glass": 1,
      "metal": 1
    },
    "gives": {
      "electronic_circuit": 2
    },
    "durationMs": 50000,
    "tool": "tool_electronics"
  },
  "dyed_cloth": {
    "name": "Dye woven cloth",
    "skill": "textiles",
    "xp": 2,
    "learnCost": 1,
    "cost": {
      "cloth": 2,
      "plant_fiber": 2,
      "water": 1
    },
    "gives": {
      "dyed_cloth": 2
    },
    "durationMs": 40000,
    "tool": "tool_loom"
  },
  "repair_parts": {
    "name": "Prepare repair parts",
    "skill": "repair",
    "xp": 2,
    "learnCost": 1,
    "cost": {
      "fasteners": 3,
      "metal": 1,
      "cloth": 1
    },
    "gives": {
      "repair_parts": 3
    },
    "durationMs": 40000
  },
  "bottles": {
    "name": "Make glass bottles",
    "skill": "metalworking",
    "xp": 2,
    "learnCost": 1,
    "cost": {
      "glass": 1
    },
    "gives": {
      "glass_bottle": 3
    },
    "durationMs": 40000,
    "tool": "tool_smelter"
  },
  "sewing_tools": {
    "name": "Make a sewing kit",
    "skill": "fashion",
    "xp": 0,
    "learnCost": 1,
    "cost": {
      "metal": 1,
      "cloth": 2,
      "plant_fiber": 3
    },
    "gives": {
      "tool_sewing": 1
    },
    "durationMs": 30000
  },
  "kitchen_tools": {
    "name": "Make kitchen tools",
    "skill": "cooking",
    "xp": 0,
    "learnCost": 1,
    "cost": {
      "metal": 2,
      "lumber": 1
    },
    "gives": {
      "tool_kitchen": 1
    },
    "durationMs": 30000
  },
  "plumbing_tools": {
    "name": "Assemble plumbing tools",
    "skill": "plumbing",
    "xp": 0,
    "learnCost": 1,
    "cost": {
      "metal": 4,
      "lumber": 2,
      "cloth": 2
    },
    "gives": {
      "tool_plumbing": 1
    },
    "durationMs": 30000
  },
  "electrical_tools": {
    "name": "Assemble electrical tools",
    "skill": "electrical",
    "xp": 0,
    "learnCost": 1,
    "cost": {
      "metal": 3,
      "wire": 2,
      "cloth": 3
    },
    "gives": {
      "tool_electrical": 1
    },
    "durationMs": 30000
  },
  "reinforced_masonry": {
    "name": "Make reinforced masonry parts",
    "skill": "masonry",
    "xp": 4,
    "learnCost": 1,
    "cost": {
      "block": 2,
      "fasteners": 2
    },
    "gives": {
      "part_masonry": 3
    },
    "durationMs": 50000
  },
  "civic_plumbing": {
    "name": "Assemble civic utility parts",
    "skill": "plumbing",
    "xp": 4,
    "learnCost": 1,
    "cost": {
      "pipe": 3,
      "metal": 1,
      "fasteners": 2
    },
    "gives": {
      "part_civic": 2
    },
    "durationMs": 50000,
    "tool": "tool_plumbing"
  },
  "civic_electrical": {
    "name": "Assemble civic electrical parts",
    "skill": "electrical",
    "xp": 4,
    "learnCost": 1,
    "cost": {
      "wire": 3,
      "electronic_circuit": 1,
      "metal": 1
    },
    "gives": {
      "part_civic": 2
    },
    "durationMs": 50000,
    "tool": "tool_electrical"
  },
  "reinforced_shopfront": {
    "name": "Assemble reinforced shopfront parts",
    "skill": "construction",
    "xp": 4,
    "learnCost": 1,
    "cost": {
      "lumber": 3,
      "glass": 2,
      "fasteners": 3
    },
    "gives": {
      "part_shopfront": 2
    },
    "durationMs": 50000,
    "tool": "tool_saw"
  },
  "contractor_parts": {
    "name": "Prepare contractor building parts",
    "skill": "contracting",
    "xp": 6,
    "learnCost": 1,
    "cost": {
      "part_masonry": 2,
      "part_civic": 1,
      "lumber": 2
    },
    "gives": {
      "part_shopfront": 3
    },
    "durationMs": 60000,
    "tool": "tool_saw"
  },
  "circuit_phone_parts": {
    "name": "Assemble circuit-based phone parts",
    "skill": "electronics",
    "xp": 6,
    "learnCost": 1,
    "cost": {
      "electronic_circuit": 1,
      "wire": 1,
      "glass": 1
    },
    "gives": {
      "phone_parts": 3
    },
    "durationMs": 60000,
    "tool": "tool_electronics"
  },
  "circuit_computer_parts": {
    "name": "Assemble circuit-based computer parts",
    "skill": "electronics",
    "xp": 8,
    "learnCost": 1,
    "cost": {
      "electronic_circuit": 2,
      "wire": 2,
      "metal": 1
    },
    "gives": {
      "computer_parts": 3
    },
    "durationMs": 70000,
    "tool": "tool_electronics"
  },
  "rigged_boat_parts": {
    "name": "Make rigged boat parts",
    "skill": "shipbuilding",
    "xp": 4,
    "learnCost": 1,
    "cost": {
      "lumber": 4,
      "rope": 2,
      "fasteners": 3
    },
    "gives": {
      "boat_parts": 2
    },
    "durationMs": 50000,
    "tool": "tool_saw"
  },
  "work_shirt": {
    "name": "Sew a work shirt",
    "skill": "fashion",
    "xp": 4,
    "learnCost": 1,
    "cost": {
      "dyed_cloth": 2,
      "cloth": 1
    },
    "gives": {
      "clothing_work_shirt": 1
    },
    "durationMs": 50000,
    "tool": "tool_sewing"
  },
  "coat": {
    "name": "Sew a coat",
    "skill": "fashion",
    "xp": 6,
    "learnCost": 1,
    "cost": {
      "dyed_cloth": 3,
      "cloth": 2
    },
    "gives": {
      "clothing_coat": 1
    },
    "durationMs": 60000,
    "tool": "tool_sewing"
  },
  "boots": {
    "name": "Make work boots",
    "skill": "fashion",
    "xp": 4,
    "learnCost": 1,
    "cost": {
      "cloth": 3,
      "rope": 1,
      "metal": 1
    },
    "gives": {
      "clothing_boots": 1
    },
    "durationMs": 50000,
    "tool": "tool_sewing"
  },
  "cap": {
    "name": "Sew a cloth cap",
    "skill": "fashion",
    "xp": 2,
    "learnCost": 1,
    "cost": {
      "dyed_cloth": 1
    },
    "gives": {
      "clothing_cap": 1
    },
    "durationMs": 40000,
    "tool": "tool_sewing"
  },
  "satchel": {
    "name": "Sew a satchel",
    "skill": "fashion",
    "xp": 4,
    "learnCost": 1,
    "cost": {
      "dyed_cloth": 2,
      "rope": 1,
      "fasteners": 1
    },
    "gives": {
      "clothing_satchel": 1
    },
    "durationMs": 50000,
    "tool": "tool_sewing"
  },
  "upholstered_chair": {
    "name": "Make an upholstered chair kit",
    "skill": "furniture",
    "xp": 6,
    "learnCost": 1,
    "cost": {
      "lumber": 2,
      "dyed_cloth": 2,
      "fasteners": 2
    },
    "gives": {
      "kit_chair": 1
    },
    "durationMs": 60000,
    "tool": "tool_saw"
  },
  "reinforced_table": {
    "name": "Make a reinforced table kit",
    "skill": "furniture",
    "xp": 8,
    "learnCost": 1,
    "cost": {
      "lumber": 3,
      "metal": 1,
      "fasteners": 3
    },
    "gives": {
      "kit_table": 1
    },
    "durationMs": 70000,
    "tool": "tool_saw"
  },
  "decorated_rug": {
    "name": "Weave a patterned rug",
    "skill": "textiles",
    "xp": 6,
    "learnCost": 1,
    "cost": {
      "dyed_cloth": 3,
      "cloth": 1
    },
    "gives": {
      "kit_rug": 1
    },
    "durationMs": 60000,
    "tool": "tool_loom"
  },
  "weatherproof_bench": {
    "name": "Make a weatherproof bench kit",
    "skill": "furniture",
    "xp": 6,
    "learnCost": 1,
    "cost": {
      "lumber": 2,
      "metal": 1,
      "fasteners": 2
    },
    "gives": {
      "kit_yard_bench": 1
    },
    "durationMs": 60000,
    "tool": "tool_saw"
  },
  "masonry_planter": {
    "name": "Build a masonry planter kit",
    "skill": "masonry",
    "xp": 2,
    "learnCost": 1,
    "cost": {
      "block": 2,
      "stone": 2
    },
    "gives": {
      "kit_planter": 1
    },
    "durationMs": 40000
  },
  "seed_greens_pack": {
    "name": "Prepare greens seed packs",
    "skill": "gardening",
    "xp": 4,
    "learnCost": 1,
    "cost": {
      "greens": 4,
      "plant_fiber": 2
    },
    "gives": {
      "seed_greens": 2
    },
    "durationMs": 50000
  },
  "potato_slips": {
    "name": "Prepare sweet potato slips",
    "skill": "farming",
    "xp": 4,
    "learnCost": 1,
    "cost": {
      "sweet_potato": 3,
      "water": 1
    },
    "gives": {
      "slip_sweet_potato": 2
    },
    "durationMs": 50000
  },
  "papaya_seeds": {
    "name": "Prepare papaya seeds",
    "skill": "gardening",
    "xp": 4,
    "learnCost": 1,
    "cost": {
      "papaya": 3,
      "water": 1
    },
    "gives": {
      "seed_papaya": 2
    },
    "durationMs": 50000
  },
  "bean_seeds": {
    "name": "Prepare long bean seed packs",
    "skill": "farming",
    "xp": 4,
    "learnCost": 1,
    "cost": {
      "long_beans": 4,
      "plant_fiber": 1
    },
    "gives": {
      "seed_long_beans": 2
    },
    "durationMs": 50000
  },
  "balanced_farm_feed": {
    "name": "Mix balanced livestock feed",
    "skill": "animal_husbandry",
    "xp": 2,
    "learnCost": 1,
    "cost": {
      "long_beans": 2,
      "sweet_potato": 1,
      "greens": 1
    },
    "gives": {
      "farm_feed": 5
    },
    "durationMs": 40000
  },
  "pet_food_mix": {
    "name": "Prepare pet food mix",
    "skill": "pet_care",
    "xp": 2,
    "learnCost": 1,
    "cost": {
      "chicken_meat": 1,
      "milk": 1,
      "sweet_potato": 1
    },
    "gives": {
      "pet_food": 4
    },
    "durationMs": 40000,
    "tool": "tool_kitchen"
  },
  "woven_dog_toy": {
    "name": "Make a woven dog toy",
    "skill": "pet_care",
    "xp": 2,
    "learnCost": 1,
    "cost": {
      "rope": 2,
      "cloth": 1
    },
    "gives": {
      "dog_toy": 1
    },
    "durationMs": 40000
  },
  "cat_play_toy": {
    "name": "Make a cloth cat toy",
    "skill": "pet_care",
    "xp": 2,
    "learnCost": 1,
    "cost": {
      "dyed_cloth": 1,
      "rope": 1
    },
    "gives": {
      "cat_toy": 1
    },
    "durationMs": 40000
  },
  "care_supply_batch": {
    "name": "Prepare fictional care supplies",
    "skill": "pharmacy",
    "xp": 6,
    "learnCost": 1,
    "cost": {
      "plant_fiber": 8,
      "cloth": 3,
      "glass_bottle": 2,
      "water": 2
    },
    "gives": {
      "care_medicine": 3
    },
    "durationMs": 60000
  },
  "vet_supply_batch": {
    "name": "Prepare fictional veterinary supplies",
    "skill": "pharmacy",
    "xp": 8,
    "learnCost": 1,
    "cost": {
      "plant_fiber": 10,
      "cloth": 3,
      "glass_bottle": 2,
      "water": 2
    },
    "gives": {
      "pet_medicine": 3
    },
    "durationMs": 70000
  },
  "meal_bean_stew": {
    "name": "Bean and greens stew",
    "skill": "cooking",
    "xp": 4,
    "learnCost": 1,
    "cost": {
      "long_beans": 3,
      "greens": 2,
      "water": 1
    },
    "gives": {
      "meal_bean_stew": 1
    },
    "durationMs": 50000,
    "tool": "tool_kitchen"
  },
  "meal_roast_potato": {
    "name": "Roasted sweet potato plate",
    "skill": "cooking",
    "xp": 2,
    "learnCost": 1,
    "cost": {
      "sweet_potato": 2,
      "greens": 1
    },
    "gives": {
      "meal_roast_potato": 1
    },
    "durationMs": 40000,
    "tool": "tool_kitchen"
  },
  "meal_omelet": {
    "name": "Garden omelet",
    "skill": "cooking",
    "xp": 4,
    "learnCost": 1,
    "cost": {
      "eggs": 2,
      "greens": 2,
      "milk": 1
    },
    "gives": {
      "meal_omelet": 1
    },
    "durationMs": 50000,
    "tool": "tool_kitchen"
  },
  "meal_chicken_stew": {
    "name": "Chicken and bean stew",
    "skill": "cooking",
    "xp": 6,
    "learnCost": 1,
    "cost": {
      "chicken_meat": 1,
      "long_beans": 2,
      "water": 2
    },
    "gives": {
      "meal_chicken_stew": 1
    },
    "durationMs": 60000,
    "tool": "tool_kitchen"
  },
  "meal_beef_potato": {
    "name": "Beef and potato plate",
    "skill": "cooking",
    "xp": 6,
    "learnCost": 1,
    "cost": {
      "beef": 1,
      "sweet_potato": 2,
      "greens": 1
    },
    "gives": {
      "meal_beef_potato": 1
    },
    "durationMs": 60000,
    "tool": "tool_kitchen"
  },
  "drink_banana_milk": {
    "name": "Banana milk drink",
    "skill": "bartending",
    "xp": 2,
    "learnCost": 1,
    "cost": {
      "banana": 2,
      "milk": 1
    },
    "gives": {
      "drink_banana_milk": 1
    },
    "durationMs": 40000
  },
  "drink_papaya_cooler": {
    "name": "Papaya cooler",
    "skill": "bartending",
    "xp": 2,
    "learnCost": 1,
    "cost": {
      "papaya": 2,
      "water": 1
    },
    "gives": {
      "drink_papaya_cooler": 1
    },
    "durationMs": 40000
  },
  "drink_garden_fizz": {
    "name": "Garden fruit refresher",
    "skill": "bartending",
    "xp": 4,
    "learnCost": 1,
    "cost": {
      "papaya": 1,
      "banana": 1,
      "water": 2
    },
    "gives": {
      "drink_garden_fizz": 1
    },
    "durationMs": 50000
  }
};
export const EXPANDED_FOODS:Record<string,FoodEffect> = {
  "meal_bean_stew": {
    "food": 50,
    "water": 20,
    "happiness": 8,
    "focusMs": 360000
  },
  "meal_roast_potato": {
    "food": 48,
    "water": 5,
    "happiness": 7,
    "focusMs": 300000
  },
  "meal_omelet": {
    "food": 58,
    "water": 8,
    "happiness": 10,
    "focusMs": 420000
  },
  "meal_chicken_stew": {
    "food": 65,
    "water": 20,
    "happiness": 11,
    "focusMs": 480000
  },
  "meal_beef_potato": {
    "food": 70,
    "water": 5,
    "happiness": 11,
    "focusMs": 480000
  },
  "drink_banana_milk": {
    "food": 30,
    "water": 30,
    "happiness": 8,
    "focusMs": 300000
  },
  "drink_papaya_cooler": {
    "food": 15,
    "water": 50,
    "happiness": 8,
    "focusMs": 360000
  },
  "drink_garden_fizz": {
    "food": 20,
    "water": 55,
    "happiness": 10,
    "focusMs": 420000
  }
};
export const EXPANDED_ITEMS:Record<string,{name:string;kind:'material'|'seed'|'food'}> = {
  "fasteners": {
    "name": "Metal fasteners",
    "kind": "material"
  },
  "rope": {
    "name": "Woven rope",
    "kind": "material"
  },
  "wire": {
    "name": "Electrical wire",
    "kind": "material"
  },
  "pipe": {
    "name": "Metal pipe",
    "kind": "material"
  },
  "electronic_circuit": {
    "name": "Electronic circuit",
    "kind": "material"
  },
  "dyed_cloth": {
    "name": "Dyed cloth",
    "kind": "material"
  },
  "repair_parts": {
    "name": "Repair parts",
    "kind": "material"
  },
  "glass_bottle": {
    "name": "Glass bottle",
    "kind": "material"
  },
  "tool_forge": {
    "name": "Metalworking tools",
    "kind": "material"
  },
  "tool_sewing": {
    "name": "Sewing kit",
    "kind": "material"
  },
  "tool_kitchen": {
    "name": "Kitchen tools",
    "kind": "material"
  },
  "tool_plumbing": {
    "name": "Plumbing toolkit",
    "kind": "material"
  },
  "tool_electrical": {
    "name": "Electrical toolkit",
    "kind": "material"
  },
  "clothing_work_shirt": {
    "name": "Work shirt",
    "kind": "material"
  },
  "clothing_coat": {
    "name": "Coat",
    "kind": "material"
  },
  "clothing_boots": {
    "name": "Work boots",
    "kind": "material"
  },
  "clothing_cap": {
    "name": "Cloth cap",
    "kind": "material"
  },
  "clothing_satchel": {
    "name": "Satchel",
    "kind": "material"
  },
  "meal_bean_stew": {
    "name": "Bean and greens stew",
    "kind": "food"
  },
  "meal_roast_potato": {
    "name": "Roasted sweet potato plate",
    "kind": "food"
  },
  "meal_omelet": {
    "name": "Garden omelet",
    "kind": "food"
  },
  "meal_chicken_stew": {
    "name": "Chicken and bean stew",
    "kind": "food"
  },
  "meal_beef_potato": {
    "name": "Beef and potato plate",
    "kind": "food"
  },
  "drink_banana_milk": {
    "name": "Banana milk drink",
    "kind": "food"
  },
  "drink_papaya_cooler": {
    "name": "Papaya cooler",
    "kind": "food"
  },
  "drink_garden_fizz": {
    "name": "Garden fruit refresher",
    "kind": "food"
  }
};
