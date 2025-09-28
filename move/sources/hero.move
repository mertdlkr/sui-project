module challenge::hero;

use std::string::String;
use sui::event;
use sui::object::{self, ID, UID};
use sui::transfer;
use sui::tx_context::TxContext;

// ========= STRUCTS =========
public struct Hero has key, store {
    id: UID,
    name: String,
    image_url: String,
    power: u64,
}

public struct HeroMetadata has key, store {
    id: UID,
    timestamp: u64,
}

public struct HeroCreated has copy, drop {
    hero_id: ID,
    timestamp: u64,
}

// ========= FUNCTIONS =========

#[allow(lint(self_transfer))]
public fun create_hero(name: String, image_url: String, power: u64, ctx: &mut TxContext) {
    let hero = Hero {
        id: object::new(ctx),
        name,
        image_url,
        power,
    };
    let hero_id = object::id(&hero);
    transfer::transfer(hero, ctx.sender());

    let timestamp = ctx.epoch_timestamp_ms();
    let metadata = HeroMetadata {
        id: object::new(ctx),
        timestamp,
    };
    transfer::freeze_object(metadata);

    event::emit(HeroCreated { hero_id, timestamp });
}

// ========= GETTER FUNCTIONS =========

public fun hero_power(hero: &Hero): u64 {
    hero.power
}

#[test_only]
public fun hero_name(hero: &Hero): String {
    hero.name
}

#[test_only]
public fun hero_image_url(hero: &Hero): String {
    hero.image_url
}

#[test_only]
public fun hero_id(hero: &Hero): ID {
    object::id(hero)
}
