import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  database: process.env.PG_DATABASE,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
});

// Optional: Drop existing tables (use with caution)
const dropTables = async () => {
  try {
    await pool.query(`
      DROP TABLE IF EXISTS game_settings CASCADE;
      DROP TABLE IF EXISTS properties_owned_map CASCADE;
      DROP TABLE IF EXISTS chance_cards CASCADE;
      DROP TABLE IF EXISTS community_cards CASCADE;
      DROP TABLE IF EXISTS game_players_map CASCADE;
      DROP TABLE IF EXISTS game_players CASCADE;
      DROP TABLE IF EXISTS games CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);
    console.log('All tables dropped');
  } catch (error) {
    console.error('Error dropping tables:', error.message);
    throw error;
  }
};

const createTables = async () => {
  try {
    // Users table (maps to PlayerData)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        wallet_address VARCHAR(42) PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        is_registered BOOLEAN NOT NULL,
        balance NUMERIC(78, 0) DEFAULT 0,
        last_game NUMERIC(78, 0) DEFAULT 0,
        active BOOLEAN DEFAULT FALSE,
        total_games_played NUMERIC(78, 0) DEFAULT 0,
        total_games_completed NUMERIC(78, 0) DEFAULT 0,
        total_games_won NUMERIC(78, 0) DEFAULT 0,
        created_at BIGINT NOT NULL,
        updated_at BIGINT
      );
    `);
    console.log('Users table created or already exists');

    // Games table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS games (
        id VARCHAR(5) PRIMARY KEY,
        status VARCHAR(20) NOT NULL CHECK (status IN ('Pending', 'Ongoing', 'Ended')),
        next_player VARCHAR(42),
        winner VARCHAR(42),
        created_at BIGINT NOT NULL,
        number_of_players SMALLINT NOT NULL CHECK (number_of_players >= 2 AND number_of_players <= 8),
        ended_at BIGINT NOT NULL,
        created_by VARCHAR(42) NOT NULL,
        mode VARCHAR(20) NOT NULL CHECK (mode IN ('PublicGame', 'PrivateGame')),
        players_joined SMALLINT NOT NULL,
        is_initialised BOOLEAN NOT NULL,
        ready_to_start BOOLEAN NOT NULL,
        rolls_count BIGINT NOT NULL,
        rolls_times BIGINT NOT NULL,
        player_chance VARCHAR(42),
        has_thrown_dice BOOLEAN NOT NULL,
        FOREIGN KEY (next_player) REFERENCES users(wallet_address),
        FOREIGN KEY (winner) REFERENCES users(wallet_address),
        FOREIGN KEY (created_by) REFERENCES users(wallet_address),
        FOREIGN KEY (player_chance) REFERENCES users(wallet_address)
      );
    `);
    console.log('Games table created or already exists');

    // GamePlayers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS game_players (
        game_id VARCHAR(5) NOT NULL,
        player_address VARCHAR(42) NOT NULL,
        username VARCHAR(255) NOT NULL,
        balance BIGINT NOT NULL,
        position SMALLINT NOT NULL CHECK (position >= 0 AND position <= 39),
        player_symbol VARCHAR(20) NOT NULL CHECK (player_symbol IN ('Hat', 'Car', 'Dog', 'Thimble', 'Iron', 'Battleship', 'Boot', 'Wheelbarrow')),
        is_next BOOLEAN NOT NULL,
        dice_rolled SMALLINT NOT NULL,
        jailed BOOLEAN NOT NULL,
        chance_jail_card BOOLEAN NOT NULL,
        comm_free_card BOOLEAN NOT NULL,
        total_houses_owned SMALLINT NOT NULL,
        total_hotels_owned SMALLINT NOT NULL,
        no_of_utilities SMALLINT NOT NULL,
        no_of_railways SMALLINT NOT NULL,
        no_section_1 SMALLINT NOT NULL,
        no_section_2 SMALLINT NOT NULL,
        no_section_3 SMALLINT NOT NULL,
        no_section_4 SMALLINT NOT NULL,
        no_section_5 SMALLINT NOT NULL,
        no_section_6 SMALLINT NOT NULL,
        no_section_7 SMALLINT NOT NULL,
        no_section_8 SMALLINT NOT NULL,
        is_bankrupt BOOLEAN NOT NULL,
        is_active BOOLEAN NOT NULL,
        jail_turns SMALLINT NOT NULL,
        strikes SMALLINT NOT NULL,
        paid_rent BOOLEAN NOT NULL,
        joined BOOLEAN NOT NULL,
        rolled_dice BOOLEAN NOT NULL,
        PRIMARY KEY (game_id, player_address),
        FOREIGN KEY (game_id) REFERENCES games(id),
        FOREIGN KEY (player_address) REFERENCES users(wallet_address)
      );
    `);
    console.log('GamePlayers table created or already exists');

    // GamePlayersMap table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS game_players_map (
        game_id VARCHAR(5) NOT NULL,
        player_address VARCHAR(42) NOT NULL,
        is_in_game BOOLEAN NOT NULL,
        PRIMARY KEY (game_id, player_address),
        FOREIGN KEY (game_id) REFERENCES games(id),
        FOREIGN KEY (player_address) REFERENCES users(wallet_address)
      );
    `);
    console.log('GamePlayersMap table created or already exists');

    // ChanceCards table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chance_cards (
        game_id VARCHAR(5) NOT NULL,
        card_index INTEGER NOT NULL,
        card_description TEXT NOT NULL,
        PRIMARY KEY (game_id, card_index),
        FOREIGN KEY (game_id) REFERENCES games(id)
      );
    `);
    console.log('ChanceCards table created or already exists');

    // CommunityCards table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS community_cards (
        game_id VARCHAR(5) NOT NULL,
        card_index INTEGER NOT NULL,
        card_description TEXT NOT NULL,
        PRIMARY KEY (game_id, card_index),
        FOREIGN KEY (game_id) REFERENCES games(id)
      );
    `);
    console.log('CommunityCards table created or already exists');

    // PropertiesOwnedMap table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS properties_owned_map (
        game_id VARCHAR(5) NOT NULL,
        player_address VARCHAR(42) NOT NULL,
        property_id SMALLINT NOT NULL CHECK (property_id >= 0 AND property_id <= 39),
        is_owned BOOLEAN NOT NULL,
        PRIMARY KEY (game_id, player_address, property_id),
        FOREIGN KEY (game_id) REFERENCES games(id),
        FOREIGN KEY (player_address) REFERENCES users(wallet_address)
      );
    `);
    console.log('PropertiesOwnedMap table created or already exists');

    // GameSettings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS game_settings (
        game_id VARCHAR(5) PRIMARY KEY,
        max_players SMALLINT NOT NULL CHECK (max_players >= 2 AND max_players <= 8),
        private_room BOOLEAN NOT NULL,
        auction BOOLEAN NOT NULL,
        rent_in_prison BOOLEAN NOT NULL,
        mortgage BOOLEAN NOT NULL,
        even_build BOOLEAN NOT NULL,
        starting_cash BIGINT NOT NULL CHECK (starting_cash >= 100 AND starting_cash <= 1500),
        randomize_play_order BOOLEAN NOT NULL,
        FOREIGN KEY (game_id) REFERENCES games(id)
      );
    `);
    console.log('GameSettings table created or already exists');
  } catch (error) {
    console.error('Error creating tables:', error.message);
    throw error;
  }
};

const connectDB = async () => {
  console.log('PostgreSQL Config:', {
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    database: process.env.PG_DATABASE,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD ? '[REDACTED]' : undefined,
  });

  try {
    await pool.connect();
    console.log('PostgreSQL connected');
    await createTables();
  } catch (error) {
    console.error('PostgreSQL connection error:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
};

export { pool, connectDB, dropTables };