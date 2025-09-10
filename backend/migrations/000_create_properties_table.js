// migrations/202509090003_create_properties.js
export const up = async (knex) => {
  return knex.schema.createTable("properties", (table) => {
    table.increments("id").primary();
    table.integer("position").notNullable().unique(); // 0–39 board index
    table.string("name", 255).notNullable();
    table.string("color", 50).nullable(); // e.g. "brown", "light_blue", null for railroads/utilities/special
    table.string("type", 50).notNullable(); // street, railroad, utility, tax, chance, community_chest, special(no buyable - price 0)

    table.integer("price").nullable(); // purchase price
    table.integer("mortgage_value").nullable();

    // JSON rent structure for flexibility
    table.json("rent").nullable();
    // e.g. { "site": 2, "one_house": 10, "two_houses": 30, "three_houses": 90, "four_houses": 160, "hotel": 250 }

    // JSON for development cost e.g. { "house": 50, "hotel": 50 }
    table.json("development_cost").nullable();

    table.boolean("is_mortgaged").defaultTo(false);
    table.boolean("for_sale").defaultTo(true);
    table.boolean("development").defaultTo(false);
  });
};

export const down = async (knex) => {
  return knex.schema.dropTable("properties");
};
