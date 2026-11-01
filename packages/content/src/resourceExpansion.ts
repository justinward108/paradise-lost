import type {CropDef,RecipeDef,FoodEffect} from '@paradise-lost/sim';
export const RESOURCE_CROPS:Record<string,CropDef> = {
  "tomato": {
    "id": "tomato",
    "name": "Tomato",
    "seed": "seed_tomato",
    "days": 3,
    "yields": {
      "tomato": 3
    },
    "regrowDays": 2
  },
  "carrot": {
    "id": "carrot",
    "name": "Carrot",
    "seed": "seed_carrot",
    "days": 3,
    "yields": {
      "carrot": 3
    }
  },
  "corn": {
    "id": "corn",
    "name": "Corn",
    "seed": "seed_corn",
    "days": 4,
    "yields": {
      "corn": 3
    }
  },
  "wheat": {
    "id": "wheat",
    "name": "Wheat",
    "seed": "seed_wheat",
    "days": 4,
    "yields": {
      "wheat": 3
    }
  },
  "sugarcane": {
    "id": "sugarcane",
    "name": "Sugarcane",
    "seed": "seed_sugarcane",
    "days": 6,
    "yields": {
      "sugarcane": 3
    },
    "regrowDays": 3
  },
  "herbs": {
    "id": "herbs",
    "name": "Kitchen herbs",
    "seed": "seed_herbs",
    "days": 2,
    "yields": {
      "herbs": 3
    },
    "regrowDays": 2
  },
  "coffee": {
    "id": "coffee",
    "name": "Coffee shrub",
    "seed": "seed_coffee",
    "days": 7,
    "yields": {
      "coffee_cherry": 3
    },
    "regrowDays": 3
  },
  "cacao": {
    "id": "cacao",
    "name": "Cacao tree",
    "seed": "seed_cacao",
    "days": 8,
    "yields": {
      "cacao_pod": 3
    },
    "regrowDays": 4
  },
  "pineapple": {
    "id": "pineapple",
    "name": "Pineapple",
    "seed": "seed_pineapple",
    "days": 6,
    "yields": {
      "pineapple": 3
    },
    "regrowDays": 3
  },
  "cotton": {
    "id": "cotton",
    "name": "Cotton",
    "seed": "seed_cotton",
    "days": 5,
    "yields": {
      "raw_cotton": 3
    }
  }
};
export const RESOURCE_RECIPES:Record<string,RecipeDef> = {
  "save_seeds_tomato": {
    "name": "Prepare tomato planting material",
    "skill": "gardening",
    "xp": 4,
    "learnCost": 1,
    "cost": {
      "tomato": 4,
      "plant_fiber": 1
    },
    "gives": {
      "seed_tomato": 2
    },
    "durationMs": 50000
  },
  "save_seeds_carrot": {
    "name": "Prepare carrot planting material",
    "skill": "gardening",
    "xp": 4,
    "learnCost": 1,
    "cost": {
      "carrot": 4,
      "plant_fiber": 1
    },
    "gives": {
      "seed_carrot": 2
    },
    "durationMs": 50000
  },
  "save_seeds_corn": {
    "name": "Prepare corn planting material",
    "skill": "gardening",
    "xp": 4,
    "learnCost": 1,
    "cost": {
      "corn": 4,
      "plant_fiber": 1
    },
    "gives": {
      "seed_corn": 2
    },
    "durationMs": 50000
  },
  "save_seeds_wheat": {
    "name": "Prepare wheat planting material",
    "skill": "gardening",
    "xp": 4,
    "learnCost": 1,
    "cost": {
      "wheat": 4,
      "plant_fiber": 1
    },
    "gives": {
      "seed_wheat": 2
    },
    "durationMs": 50000
  },
  "save_seeds_sugarcane": {
    "name": "Prepare sugarcane planting material",
    "skill": "gardening",
    "xp": 4,
    "learnCost": 1,
    "cost": {
      "sugarcane": 4,
      "plant_fiber": 1
    },
    "gives": {
      "seed_sugarcane": 2
    },
    "durationMs": 50000
  },
  "save_seeds_herbs": {
    "name": "Prepare kitchen herbs planting material",
    "skill": "gardening",
    "xp": 4,
    "learnCost": 1,
    "cost": {
      "herbs": 4,
      "plant_fiber": 1
    },
    "gives": {
      "seed_herbs": 2
    },
    "durationMs": 50000
  },
  "save_seeds_coffee": {
    "name": "Prepare coffee shrub planting material",
    "skill": "gardening",
    "xp": 4,
    "learnCost": 1,
    "cost": {
      "coffee_cherry": 4,
      "plant_fiber": 1
    },
    "gives": {
      "seed_coffee": 2
    },
    "durationMs": 50000
  },
  "save_seeds_cacao": {
    "name": "Prepare cacao tree planting material",
    "skill": "gardening",
    "xp": 4,
    "learnCost": 1,
    "cost": {
      "cacao_pod": 4,
      "plant_fiber": 1
    },
    "gives": {
      "seed_cacao": 2
    },
    "durationMs": 50000
  },
  "save_seeds_pineapple": {
    "name": "Prepare pineapple planting material",
    "skill": "gardening",
    "xp": 4,
    "learnCost": 1,
    "cost": {
      "pineapple": 4,
      "plant_fiber": 1
    },
    "gives": {
      "seed_pineapple": 2
    },
    "durationMs": 50000
  },
  "save_seeds_cotton": {
    "name": "Prepare cotton planting material",
    "skill": "gardening",
    "xp": 4,
    "learnCost": 1,
    "cost": {
      "raw_cotton": 4,
      "plant_fiber": 1
    },
    "gives": {
      "seed_cotton": 2
    },
    "durationMs": 50000
  },
  "smelt_copper": {
    "name": "Smelt copper",
    "skill": "metalworking",
    "xp": 2,
    "learnCost": 1,
    "cost": {
      "copper_ore": 3,
      "coal": 1
    },
    "gives": {
      "copper": 2
    },
    "durationMs": 40000,
    "tool": "tool_smelter"
  },
  "smelt_tin": {
    "name": "Smelt tin",
    "skill": "metalworking",
    "xp": 2,
    "learnCost": 1,
    "cost": {
      "tin_ore": 3,
      "coal": 1
    },
    "gives": {
      "tin": 2
    },
    "durationMs": 40000,
    "tool": "tool_smelter"
  },
  "smelt_iron": {
    "name": "Smelt iron",
    "skill": "metalworking",
    "xp": 4,
    "learnCost": 1,
    "cost": {
      "iron_ore": 3,
      "coal": 1
    },
    "gives": {
      "iron": 2
    },
    "durationMs": 50000,
    "tool": "tool_smelter"
  },
  "alloy_bronze": {
    "name": "Alloy bronze",
    "skill": "metalworking",
    "xp": 4,
    "learnCost": 1,
    "cost": {
      "copper": 2,
      "tin": 1,
      "coal": 1
    },
    "gives": {
      "bronze": 3
    },
    "durationMs": 50000,
    "tool": "tool_smelter"
  },
  "make_steel": {
    "name": "Make steel",
    "skill": "metalworking",
    "xp": 6,
    "learnCost": 1,
    "cost": {
      "iron": 2,
      "coal": 2
    },
    "gives": {
      "steel": 2
    },
    "durationMs": 60000,
    "tool": "tool_smelter"
  },
  "ceramics": {
    "name": "Fire ceramic material",
    "skill": "masonry",
    "xp": 2,
    "learnCost": 1,
    "cost": {
      "clay": 3,
      "coal": 1
    },
    "gives": {
      "ceramic": 2
    },
    "durationMs": 40000,
    "tool": "tool_smelter"
  },
  "cement": {
    "name": "Make building cement",
    "skill": "masonry",
    "xp": 4,
    "learnCost": 1,
    "cost": {
      "limestone": 3,
      "clay": 1,
      "coal": 1
    },
    "gives": {
      "cement": 2
    },
    "durationMs": 50000,
    "tool": "tool_smelter"
  },
  "brick": {
    "name": "Fire building bricks",
    "skill": "masonry",
    "xp": 2,
    "learnCost": 1,
    "cost": {
      "clay": 4,
      "coal": 1
    },
    "gives": {
      "brick": 4
    },
    "durationMs": 40000,
    "tool": "tool_smelter"
  },
  "cooking_salt": {
    "name": "Prepare cooking salt",
    "skill": "cooking",
    "xp": 2,
    "learnCost": 1,
    "cost": {
      "raw_salt": 3,
      "water": 1
    },
    "gives": {
      "salt": 3
    },
    "durationMs": 40000,
    "tool": "tool_kitchen"
  },
  "quartz_glass": {
    "name": "Melt quartz glass",
    "skill": "metalworking",
    "xp": 4,
    "learnCost": 1,
    "cost": {
      "quartz": 3,
      "coal": 1
    },
    "gives": {
      "glass": 3
    },
    "durationMs": 50000,
    "tool": "tool_smelter"
  },
  "copper_wire": {
    "name": "Draw copper wire",
    "skill": "electrical",
    "xp": 2,
    "learnCost": 1,
    "cost": {
      "copper": 1
    },
    "gives": {
      "wire": 4
    },
    "durationMs": 40000,
    "tool": "tool_electrical"
  },
  "steel_fasteners": {
    "name": "Forge steel fasteners",
    "skill": "metalworking",
    "xp": 4,
    "learnCost": 1,
    "cost": {
      "steel": 1
    },
    "gives": {
      "fasteners": 8
    },
    "durationMs": 50000,
    "tool": "tool_forge"
  },
  "copper_pipe": {
    "name": "Make copper pipe",
    "skill": "plumbing",
    "xp": 4,
    "learnCost": 1,
    "cost": {
      "copper": 2
    },
    "gives": {
      "pipe": 4
    },
    "durationMs": 50000,
    "tool": "tool_plumbing"
  },
  "bronze_tools": {
    "name": "Make bronze metalworking tools",
    "skill": "metalworking",
    "xp": 4,
    "learnCost": 1,
    "cost": {
      "bronze": 3,
      "lumber": 2
    },
    "gives": {
      "tool_forge": 1
    },
    "durationMs": 50000
  },
  "brick_wall_parts": {
    "name": "Make brick wall parts",
    "skill": "masonry",
    "xp": 4,
    "learnCost": 1,
    "cost": {
      "brick": 3,
      "cement": 1
    },
    "gives": {
      "part_masonry": 3
    },
    "durationMs": 50000
  },
  "ceramic_planter": {
    "name": "Make a ceramic planter kit",
    "skill": "masonry",
    "xp": 4,
    "learnCost": 1,
    "cost": {
      "ceramic": 3,
      "clay": 1
    },
    "gives": {
      "kit_planter": 1
    },
    "durationMs": 50000
  },
  "steel_civic_parts": {
    "name": "Make steel civic building parts",
    "skill": "construction",
    "xp": 6,
    "learnCost": 1,
    "cost": {
      "steel": 2,
      "cement": 1,
      "fasteners": 2
    },
    "gives": {
      "part_civic": 3
    },
    "durationMs": 60000,
    "tool": "tool_forge"
  },
  "gem_lantern": {
    "name": "Assemble a gemstone lantern",
    "skill": "electronics",
    "xp": 8,
    "learnCost": 1,
    "cost": {
      "gemstone": 1,
      "copper": 1,
      "electronic_circuit": 1,
      "glass": 1
    },
    "gives": {
      "kit_lantern": 1
    },
    "durationMs": 70000,
    "tool": "tool_electronics"
  },
  "cane_sugar": {
    "name": "Process cane sugar",
    "skill": "cooking",
    "xp": 2,
    "learnCost": 1,
    "cost": {
      "sugarcane": 3,
      "water": 1
    },
    "gives": {
      "sugar": 3
    },
    "durationMs": 40000,
    "tool": "tool_kitchen"
  },
  "mill_flour": {
    "name": "Mill wheat flour",
    "skill": "cooking",
    "xp": 2,
    "learnCost": 1,
    "cost": {
      "wheat": 3
    },
    "gives": {
      "flour": 3
    },
    "durationMs": 40000,
    "tool": "tool_kitchen"
  },
  "churn_butter": {
    "name": "Churn butter",
    "skill": "cooking",
    "xp": 2,
    "learnCost": 1,
    "cost": {
      "milk": 3
    },
    "gives": {
      "butter": 2
    },
    "durationMs": 40000,
    "tool": "tool_kitchen"
  },
  "roast_coffee": {
    "name": "Roast coffee beans",
    "skill": "cooking",
    "xp": 4,
    "learnCost": 1,
    "cost": {
      "coffee_cherry": 3,
      "boards": 1
    },
    "gives": {
      "roasted_coffee": 2
    },
    "durationMs": 50000,
    "tool": "tool_kitchen"
  },
  "process_cocoa": {
    "name": "Prepare cocoa powder",
    "skill": "cooking",
    "xp": 4,
    "learnCost": 1,
    "cost": {
      "cacao_pod": 3
    },
    "gives": {
      "cocoa_powder": 2
    },
    "durationMs": 50000,
    "tool": "tool_kitchen"
  },
  "weave_cotton": {
    "name": "Weave cotton cloth",
    "skill": "textiles",
    "xp": 4,
    "learnCost": 1,
    "cost": {
      "raw_cotton": 4
    },
    "gives": {
      "cotton_cloth": 2
    },
    "durationMs": 50000,
    "tool": "tool_loom"
  },
  "cotton_workshirt": {
    "name": "Sew a cotton work shirt",
    "skill": "fashion",
    "xp": 4,
    "learnCost": 1,
    "cost": {
      "cotton_cloth": 2,
      "cloth": 1
    },
    "gives": {
      "clothing_work_shirt": 1
    },
    "durationMs": 50000,
    "tool": "tool_sewing"
  },
  "cotton_bag": {
    "name": "Sew a cotton satchel",
    "skill": "fashion",
    "xp": 4,
    "learnCost": 1,
    "cost": {
      "cotton_cloth": 2,
      "rope": 1,
      "fasteners": 1
    },
    "gives": {
      "clothing_satchel": 1
    },
    "durationMs": 50000,
    "tool": "tool_sewing"
  },
  "corn_animal_feed": {
    "name": "Prepare corn livestock feed",
    "skill": "animal_husbandry",
    "xp": 2,
    "learnCost": 1,
    "cost": {
      "corn": 3,
      "wheat": 1
    },
    "gives": {
      "farm_feed": 6
    },
    "durationMs": 40000
  },
  "herbal_care_supplies": {
    "name": "Prepare fictional herbal care supplies",
    "skill": "pharmacy",
    "xp": 6,
    "learnCost": 1,
    "cost": {
      "herbs": 4,
      "cloth": 2,
      "glass_bottle": 1,
      "water": 1
    },
    "gives": {
      "care_medicine": 2
    },
    "durationMs": 60000
  },
  "meal_bread": {
    "name": "Fresh bread",
    "skill": "cooking",
    "xp": 2,
    "learnCost": 1,
    "cost": {
      "flour": 2,
      "water": 1,
      "salt": 1
    },
    "gives": {
      "meal_bread": 1
    },
    "durationMs": 40000,
    "tool": "tool_kitchen"
  },
  "meal_cornbread": {
    "name": "Cornbread",
    "skill": "cooking",
    "xp": 4,
    "learnCost": 1,
    "cost": {
      "corn": 2,
      "flour": 1,
      "milk": 1,
      "butter": 1
    },
    "gives": {
      "meal_cornbread": 1
    },
    "durationMs": 50000,
    "tool": "tool_kitchen"
  },
  "meal_pancakes": {
    "name": "Fruit pancakes",
    "skill": "cooking",
    "xp": 4,
    "learnCost": 1,
    "cost": {
      "flour": 2,
      "eggs": 1,
      "milk": 1,
      "banana": 1
    },
    "gives": {
      "meal_pancakes": 1
    },
    "durationMs": 50000,
    "tool": "tool_kitchen"
  },
  "meal_tomato_soup": {
    "name": "Tomato soup",
    "skill": "cooking",
    "xp": 2,
    "learnCost": 1,
    "cost": {
      "tomato": 3,
      "herbs": 1,
      "water": 2,
      "salt": 1
    },
    "gives": {
      "meal_tomato_soup": 1
    },
    "durationMs": 40000,
    "tool": "tool_kitchen"
  },
  "meal_carrot_stew": {
    "name": "Carrot and potato stew",
    "skill": "cooking",
    "xp": 2,
    "learnCost": 1,
    "cost": {
      "carrot": 2,
      "sweet_potato": 1,
      "water": 1
    },
    "gives": {
      "meal_carrot_stew": 1
    },
    "durationMs": 40000,
    "tool": "tool_kitchen"
  },
  "meal_garden_salad": {
    "name": "Tomato garden salad",
    "skill": "cooking",
    "xp": 2,
    "learnCost": 1,
    "cost": {
      "tomato": 2,
      "greens": 2,
      "herbs": 1
    },
    "gives": {
      "meal_garden_salad": 1
    },
    "durationMs": 40000,
    "tool": "tool_kitchen"
  },
  "meal_roast_chicken": {
    "name": "Herb-roasted chicken",
    "skill": "cooking",
    "xp": 6,
    "learnCost": 1,
    "cost": {
      "chicken_meat": 1,
      "carrot": 1,
      "herbs": 2,
      "salt": 1
    },
    "gives": {
      "meal_roast_chicken": 1
    },
    "durationMs": 60000,
    "tool": "tool_kitchen"
  },
  "meal_beef_casserole": {
    "name": "Beef and tomato casserole",
    "skill": "cooking",
    "xp": 6,
    "learnCost": 1,
    "cost": {
      "beef": 1,
      "tomato": 2,
      "sweet_potato": 1,
      "salt": 1
    },
    "gives": {
      "meal_beef_casserole": 1
    },
    "durationMs": 60000,
    "tool": "tool_kitchen"
  },
  "meal_chocolate_cake": {
    "name": "Chocolate cake",
    "skill": "cooking",
    "xp": 8,
    "learnCost": 1,
    "cost": {
      "flour": 2,
      "cocoa_powder": 1,
      "sugar": 1,
      "eggs": 1,
      "butter": 1
    },
    "gives": {
      "meal_chocolate_cake": 1
    },
    "durationMs": 70000,
    "tool": "tool_kitchen"
  },
  "meal_pineapple_tart": {
    "name": "Pineapple tart",
    "skill": "cooking",
    "xp": 6,
    "learnCost": 1,
    "cost": {
      "pineapple": 2,
      "flour": 1,
      "sugar": 1,
      "butter": 1
    },
    "gives": {
      "meal_pineapple_tart": 1
    },
    "durationMs": 60000,
    "tool": "tool_kitchen"
  },
  "drink_coffee": {
    "name": "Brewed coffee",
    "skill": "bartending",
    "xp": 4,
    "learnCost": 1,
    "cost": {
      "roasted_coffee": 1,
      "water": 1
    },
    "gives": {
      "drink_coffee": 1
    },
    "durationMs": 50000
  },
  "drink_cocoa": {
    "name": "Warm cocoa",
    "skill": "bartending",
    "xp": 4,
    "learnCost": 1,
    "cost": {
      "cocoa_powder": 1,
      "milk": 1,
      "sugar": 1
    },
    "gives": {
      "drink_cocoa": 1
    },
    "durationMs": 50000
  },
  "drink_herb_tea": {
    "name": "Kitchen herb tea",
    "skill": "bartending",
    "xp": 2,
    "learnCost": 1,
    "cost": {
      "herbs": 2,
      "water": 1
    },
    "gives": {
      "drink_herb_tea": 1
    },
    "durationMs": 40000
  },
  "drink_pineapple_juice": {
    "name": "Pineapple juice",
    "skill": "bartending",
    "xp": 2,
    "learnCost": 1,
    "cost": {
      "pineapple": 2,
      "water": 1
    },
    "gives": {
      "drink_pineapple_juice": 1
    },
    "durationMs": 40000
  },
  "drink_fruit_punch": {
    "name": "Island fruit punch",
    "skill": "bartending",
    "xp": 6,
    "learnCost": 1,
    "cost": {
      "pineapple": 1,
      "papaya": 1,
      "sugar": 1,
      "water": 2
    },
    "gives": {
      "drink_fruit_punch": 1
    },
    "durationMs": 60000
  }
};
export const RESOURCE_FOODS:Record<string,FoodEffect> = {
  "meal_bread": {
    "food": 40,
    "water": 0,
    "happiness": 6,
    "focusMs": 300000
  },
  "meal_cornbread": {
    "food": 55,
    "water": 5,
    "happiness": 9,
    "focusMs": 420000
  },
  "meal_pancakes": {
    "food": 60,
    "water": 5,
    "happiness": 10,
    "focusMs": 420000
  },
  "meal_tomato_soup": {
    "food": 35,
    "water": 40,
    "happiness": 8,
    "focusMs": 360000
  },
  "meal_carrot_stew": {
    "food": 50,
    "water": 20,
    "happiness": 8,
    "focusMs": 360000
  },
  "meal_garden_salad": {
    "food": 40,
    "water": 15,
    "happiness": 8,
    "focusMs": 360000
  },
  "meal_roast_chicken": {
    "food": 70,
    "water": 5,
    "happiness": 12,
    "focusMs": 480000
  },
  "meal_beef_casserole": {
    "food": 75,
    "water": 5,
    "happiness": 12,
    "focusMs": 480000
  },
  "meal_chocolate_cake": {
    "food": 45,
    "water": 0,
    "happiness": 16,
    "focusMs": 480000
  },
  "meal_pineapple_tart": {
    "food": 45,
    "water": 5,
    "happiness": 13,
    "focusMs": 420000
  },
  "drink_coffee": {
    "food": 0,
    "water": 25,
    "happiness": 8,
    "focusMs": 480000
  },
  "drink_cocoa": {
    "food": 20,
    "water": 25,
    "happiness": 12,
    "focusMs": 420000
  },
  "drink_herb_tea": {
    "food": 0,
    "water": 40,
    "happiness": 7,
    "focusMs": 300000
  },
  "drink_pineapple_juice": {
    "food": 15,
    "water": 45,
    "happiness": 10,
    "focusMs": 360000
  },
  "drink_fruit_punch": {
    "food": 15,
    "water": 55,
    "happiness": 12,
    "focusMs": 420000
  },
  "tomato": {
    "food": 12,
    "water": 8,
    "happiness": 2
  },
  "carrot": {
    "food": 15,
    "water": 2,
    "happiness": 2
  },
  "corn": {
    "food": 18,
    "water": 2,
    "happiness": 2
  },
  "pineapple": {
    "food": 18,
    "water": 12,
    "happiness": 2
  },
  "herbs": {
    "food": 4,
    "water": 1,
    "happiness": 2
  }
};
export const RESOURCE_ITEMS:Record<string,{name:string;kind:'material'|'seed'|'food'}> = {
  "seed_tomato": {
    "name": "Tomato seeds",
    "kind": "seed"
  },
  "tomato": {
    "name": "Tomato",
    "kind": "food"
  },
  "seed_carrot": {
    "name": "Carrot seeds",
    "kind": "seed"
  },
  "carrot": {
    "name": "Carrot",
    "kind": "food"
  },
  "seed_corn": {
    "name": "Corn seeds",
    "kind": "seed"
  },
  "corn": {
    "name": "Corn",
    "kind": "food"
  },
  "seed_wheat": {
    "name": "Wheat seeds",
    "kind": "seed"
  },
  "wheat": {
    "name": "Wheat",
    "kind": "material"
  },
  "seed_sugarcane": {
    "name": "Sugarcane seeds",
    "kind": "seed"
  },
  "sugarcane": {
    "name": "Sugarcane",
    "kind": "material"
  },
  "seed_herbs": {
    "name": "Kitchen herbs seeds",
    "kind": "seed"
  },
  "herbs": {
    "name": "Kitchen herbs",
    "kind": "food"
  },
  "seed_coffee": {
    "name": "Coffee shrub seeds",
    "kind": "seed"
  },
  "coffee_cherry": {
    "name": "Coffee cherries",
    "kind": "material"
  },
  "seed_cacao": {
    "name": "Cacao tree seeds",
    "kind": "seed"
  },
  "cacao_pod": {
    "name": "Cacao pods",
    "kind": "material"
  },
  "seed_pineapple": {
    "name": "Pineapple seeds",
    "kind": "seed"
  },
  "pineapple": {
    "name": "Pineapple",
    "kind": "food"
  },
  "seed_cotton": {
    "name": "Cotton seeds",
    "kind": "seed"
  },
  "raw_cotton": {
    "name": "Raw cotton",
    "kind": "material"
  },
  "copper_ore": {
    "name": "Copper ore",
    "kind": "material"
  },
  "tin_ore": {
    "name": "Tin ore",
    "kind": "material"
  },
  "iron_ore": {
    "name": "Iron ore",
    "kind": "material"
  },
  "coal": {
    "name": "Coal",
    "kind": "material"
  },
  "limestone": {
    "name": "Limestone",
    "kind": "material"
  },
  "clay": {
    "name": "Clay",
    "kind": "material"
  },
  "raw_salt": {
    "name": "Unprocessed salt",
    "kind": "material"
  },
  "quartz": {
    "name": "Quartz",
    "kind": "material"
  },
  "gemstone": {
    "name": "Uncut gemstones",
    "kind": "material"
  },
  "copper": {
    "name": "Copper",
    "kind": "material"
  },
  "tin": {
    "name": "Tin",
    "kind": "material"
  },
  "iron": {
    "name": "Iron",
    "kind": "material"
  },
  "bronze": {
    "name": "Bronze",
    "kind": "material"
  },
  "steel": {
    "name": "Steel",
    "kind": "material"
  },
  "ceramic": {
    "name": "Ceramic",
    "kind": "material"
  },
  "cement": {
    "name": "Cement",
    "kind": "material"
  },
  "brick": {
    "name": "Brick",
    "kind": "material"
  },
  "salt": {
    "name": "Cooking salt",
    "kind": "material"
  },
  "sugar": {
    "name": "Sugar",
    "kind": "material"
  },
  "flour": {
    "name": "Flour",
    "kind": "material"
  },
  "butter": {
    "name": "Butter",
    "kind": "material"
  },
  "roasted_coffee": {
    "name": "Roasted coffee beans",
    "kind": "material"
  },
  "cocoa_powder": {
    "name": "Cocoa powder",
    "kind": "material"
  },
  "cotton_cloth": {
    "name": "Cotton cloth",
    "kind": "material"
  },
  "meal_bread": {
    "name": "Fresh bread",
    "kind": "food"
  },
  "meal_cornbread": {
    "name": "Cornbread",
    "kind": "food"
  },
  "meal_pancakes": {
    "name": "Fruit pancakes",
    "kind": "food"
  },
  "meal_tomato_soup": {
    "name": "Tomato soup",
    "kind": "food"
  },
  "meal_carrot_stew": {
    "name": "Carrot and potato stew",
    "kind": "food"
  },
  "meal_garden_salad": {
    "name": "Tomato garden salad",
    "kind": "food"
  },
  "meal_roast_chicken": {
    "name": "Herb-roasted chicken",
    "kind": "food"
  },
  "meal_beef_casserole": {
    "name": "Beef and tomato casserole",
    "kind": "food"
  },
  "meal_chocolate_cake": {
    "name": "Chocolate cake",
    "kind": "food"
  },
  "meal_pineapple_tart": {
    "name": "Pineapple tart",
    "kind": "food"
  },
  "drink_coffee": {
    "name": "Brewed coffee",
    "kind": "food"
  },
  "drink_cocoa": {
    "name": "Warm cocoa",
    "kind": "food"
  },
  "drink_herb_tea": {
    "name": "Kitchen herb tea",
    "kind": "food"
  },
  "drink_pineapple_juice": {
    "name": "Pineapple juice",
    "kind": "food"
  },
  "drink_fruit_punch": {
    "name": "Island fruit punch",
    "kind": "food"
  }
};
export const RESOURCE_PLANT_ART:Record<string,Record<string,string>> = {
  "tomato": {
    "shape": "trellis",
    "fruit": "#cf493b",
    "tag": "#cf493b"
  },
  "carrot": {
    "shape": "rosette",
    "fruit": "#ed873a",
    "tag": "#ed873a"
  },
  "corn": {
    "shape": "trellis",
    "fruit": "#e4c84e",
    "tag": "#e4c84e"
  },
  "wheat": {
    "shape": "trellis",
    "fruit": "#cba657",
    "tag": "#cba657"
  },
  "sugarcane": {
    "shape": "trellis",
    "fruit": "#a8c773",
    "tag": "#a8c773"
  },
  "herbs": {
    "shape": "rosette",
    "fruit": "#65aa75",
    "tag": "#65aa75"
  },
  "coffee": {
    "shape": "rosette",
    "fruit": "#963c40",
    "tag": "#963c40"
  },
  "cacao": {
    "shape": "rosette",
    "fruit": "#a57b48",
    "tag": "#a57b48"
  },
  "pineapple": {
    "shape": "rosette",
    "fruit": "#cfac43",
    "tag": "#cfac43"
  },
  "cotton": {
    "shape": "rosette",
    "fruit": "#e7ded0",
    "tag": "#e7ded0"
  }
};
export const RESOURCE_SEED_TRADES: {id:string;cost:Record<string,number>;gives:Record<string,number>}[] = [
  {
    "id": "new_seeds_tomato",
    "cost": {
      "boards": 4
    },
    "gives": {
      "seed_tomato": 2
    }
  },
  {
    "id": "produce_voucher_tomato",
    "cost": {
      "tomato": 4
    },
    "gives": {
      "learning_credit": 1
    }
  },
  {
    "id": "new_seeds_carrot",
    "cost": {
      "boards": 4
    },
    "gives": {
      "seed_carrot": 2
    }
  },
  {
    "id": "produce_voucher_carrot",
    "cost": {
      "carrot": 4
    },
    "gives": {
      "learning_credit": 1
    }
  },
  {
    "id": "new_seeds_corn",
    "cost": {
      "boards": 4
    },
    "gives": {
      "seed_corn": 2
    }
  },
  {
    "id": "produce_voucher_corn",
    "cost": {
      "corn": 4
    },
    "gives": {
      "learning_credit": 1
    }
  },
  {
    "id": "new_seeds_wheat",
    "cost": {
      "boards": 4
    },
    "gives": {
      "seed_wheat": 2
    }
  },
  {
    "id": "produce_voucher_wheat",
    "cost": {
      "wheat": 4
    },
    "gives": {
      "learning_credit": 1
    }
  },
  {
    "id": "new_seeds_sugarcane",
    "cost": {
      "boards": 4
    },
    "gives": {
      "seed_sugarcane": 2
    }
  },
  {
    "id": "produce_voucher_sugarcane",
    "cost": {
      "sugarcane": 4
    },
    "gives": {
      "learning_credit": 1
    }
  },
  {
    "id": "new_seeds_herbs",
    "cost": {
      "boards": 4
    },
    "gives": {
      "seed_herbs": 2
    }
  },
  {
    "id": "produce_voucher_herbs",
    "cost": {
      "herbs": 4
    },
    "gives": {
      "learning_credit": 1
    }
  },
  {
    "id": "new_seeds_coffee",
    "cost": {
      "boards": 4
    },
    "gives": {
      "seed_coffee": 2
    }
  },
  {
    "id": "produce_voucher_coffee",
    "cost": {
      "coffee_cherry": 4
    },
    "gives": {
      "learning_credit": 1
    }
  },
  {
    "id": "new_seeds_cacao",
    "cost": {
      "boards": 4
    },
    "gives": {
      "seed_cacao": 2
    }
  },
  {
    "id": "produce_voucher_cacao",
    "cost": {
      "cacao_pod": 4
    },
    "gives": {
      "learning_credit": 1
    }
  },
  {
    "id": "new_seeds_pineapple",
    "cost": {
      "boards": 4
    },
    "gives": {
      "seed_pineapple": 2
    }
  },
  {
    "id": "produce_voucher_pineapple",
    "cost": {
      "pineapple": 4
    },
    "gives": {
      "learning_credit": 1
    }
  },
  {
    "id": "new_seeds_cotton",
    "cost": {
      "boards": 4
    },
    "gives": {
      "seed_cotton": 2
    }
  },
  {
    "id": "produce_voucher_cotton",
    "cost": {
      "raw_cotton": 4
    },
    "gives": {
      "learning_credit": 1
    }
  }
];

